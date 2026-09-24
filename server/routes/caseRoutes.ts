import { Router, Response } from 'express';
import { getDb, queryScalar, queryRow, queryRows, saveDb, logAudit, runTransaction } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Convert DD-MM-YYYY to YYYY-MM-DD if needed
export function toIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // If in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-');
    return `${y}-${m}-${d}`;
  }
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

// Convert YYYY-MM-DD to DD-MM-YYYY
export function toDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}-${m}-${y}`;
  }
  return trimmed;
}

// Get next available serial number
router.get('/cases/next-serial', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const maxSerial = queryScalar(db, 'SELECT COALESCE(MAX(SerialNo), 0) FROM CourtDiary;') as number;
    res.json({ nextSerial: maxSerial + 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch next serial' });
  }
});

// List cases with filtering, search, pagination, sorting
router.get('/cases', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const {
      page = '1',
      limit = '25',
      search = '',
      sortBy = 'SerialNo',
      sortOrder = 'ASC',
      caseDateFrom = '',
      caseDateTo = '',
      dairyDateFrom = '',
      dairyDateTo = '',
      result = '',
      serialFrom = '',
      serialTo = '',
      caseNumber = '',
      description = '',
      remarks = ''
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Global Search (across SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks)
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(`(
        CAST(SerialNo AS TEXT) LIKE ? OR
        CaseNumber LIKE ? OR
        Result LIKE ? OR
        CaseDate LIKE ? OR
        DairyDate LIKE ? OR
        COALESCE(Description, '') LIKE ? OR
        COALESCE(Remarks, '') LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term);
    }

    // Advanced Filters
    if (serialFrom) {
      conditions.push('SerialNo >= ?');
      params.push(parseInt(serialFrom, 10));
    }
    if (serialTo) {
      conditions.push('SerialNo <= ?');
      params.push(parseInt(serialTo, 10));
    }
    if (caseDateFrom) {
      conditions.push('CaseDate >= ?');
      params.push(toIsoDate(caseDateFrom));
    }
    if (caseDateTo) {
      conditions.push('CaseDate <= ?');
      params.push(toIsoDate(caseDateTo));
    }
    if (dairyDateFrom) {
      conditions.push('DairyDate >= ?');
      params.push(toIsoDate(dairyDateFrom));
    }
    if (dairyDateTo) {
      conditions.push('DairyDate <= ?');
      params.push(toIsoDate(dairyDateTo));
    }
    if (result && result !== 'All') {
      conditions.push('Result = ?');
      params.push(result);
    }
    if (caseNumber && caseNumber.trim()) {
      conditions.push('CaseNumber LIKE ?');
      params.push(`%${caseNumber.trim()}%`);
    }
    if (description && description.trim()) {
      conditions.push('COALESCE(Description, \'\') LIKE ?');
      params.push(`%${description.trim()}%`);
    }
    if (remarks && remarks.trim()) {
      conditions.push('COALESCE(Remarks, \'\') LIKE ?');
      params.push(`%${remarks.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to avoid SQL injection
    const allowedSortCols = ['SerialNo', 'CaseDate', 'CaseNumber', 'Result', 'DairyDate', 'ID', 'CreatedDate'];
    const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'SerialNo';
    const safeOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `SELECT COUNT(*) FROM CourtDiary ${whereClause};`;
    const totalRecords = queryScalar(db, countSql, params as any) as number;

    const dataSql = `
      SELECT ID, SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      FROM CourtDiary
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeOrder}
      LIMIT ? OFFSET ?;
    `;

    const queryParams = [...params, limitNum, offset];
    const rawRows = queryRows<any>(db, dataSql, queryParams as any);

    const rows = rawRows.map(r => ({
      ...r,
      DisplayCaseDate: toDisplayDate(r.CaseDate),
      DisplayDairyDate: toDisplayDate(r.DairyDate)
    }));

    res.json({
      records: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching cases' });
  }
});

// Single Case Details (including proceedings and documents)
router.get('/cases/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const caseId = parseInt(req.params.id, 10);
    const caseData = queryRow<any>(db, 'SELECT * FROM CourtDiary WHERE ID = ?;', [caseId]);

    if (!caseData) {
      return res.status(404).json({ error: 'Case record not found' });
    }

    const proceedings = queryRows<any>(
      db,
      'SELECT * FROM CaseProceedings WHERE CaseID = ? ORDER BY HearingDate DESC, ID DESC;',
      [caseId]
    ).map(p => ({
      ...p,
      DisplayHearingDate: toDisplayDate(p.HearingDate),
      DisplayNextHearingDate: p.NextHearingDate ? toDisplayDate(p.NextHearingDate) : ''
    }));

    const documents = queryRows<any>(
      db,
      'SELECT ID, CaseID, Title, DocumentType, FileName, FileSize, MimeType, UploadedBy, UploadedDate FROM CaseDocuments WHERE CaseID = ? ORDER BY ID DESC;',
      [caseId]
    );

    res.json({
      case: {
        ...caseData,
        DisplayCaseDate: toDisplayDate(caseData.CaseDate),
        DisplayDairyDate: toDisplayDate(caseData.DairyDate)
      },
      proceedings,
      documents
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching case details' });
  }
});

// Create Case
router.post('/cases', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const {
      serialNo,
      caseDate,
      caseNumber,
      result = 'Pending',
      dairyDate,
      description = '',
      remarks = ''
    } = req.body;

    // Validations
    if (!caseNumber || !caseNumber.trim()) {
      return res.status(400).json({ error: 'Case Number is required.' });
    }
    if (!caseDate || !caseDate.trim()) {
      return res.status(400).json({ error: 'Case Date is required.' });
    }
    if (!dairyDate || !dairyDate.trim()) {
      return res.status(400).json({ error: 'Dairy Date is required.' });
    }

    const isoCaseDate = toIsoDate(caseDate);
    const isoDairyDate = toIsoDate(dairyDate);

    if (!isoCaseDate || !isoDairyDate) {
      return res.status(400).json({ error: 'Invalid date format. Expected DD-MM-YYYY.' });
    }

    // Determine SerialNo (or validate supplied)
    let finalSerial = parseInt(serialNo, 10);
    if (!finalSerial || isNaN(finalSerial)) {
      const maxSerial = queryScalar(db, 'SELECT COALESCE(MAX(SerialNo), 0) FROM CourtDiary;') as number;
      finalSerial = maxSerial + 1;
    } else {
      // Check for duplicate SerialNo
      const existing = queryRow(db, 'SELECT ID FROM CourtDiary WHERE SerialNo = ?;', [finalSerial]);
      if (existing) {
        return res.status(400).json({ error: `Serial Number ${finalSerial} is already assigned to another case record.` });
      }
    }

    const now = new Date().toISOString();
    const createdBy = req.user?.fullName || req.user?.username || 'Officer';

    runTransaction(db, () => {
      db.run(
        `INSERT INTO CourtDiary (
          SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          finalSerial,
          isoCaseDate,
          caseNumber.trim(),
          result.trim() || 'Pending',
          isoDairyDate,
          description ? description.trim() : '',
          remarks ? remarks.trim() : '',
          now,
          now,
          createdBy,
          createdBy
        ]
      );
    });

    const newId = queryScalar(db, 'SELECT last_insert_rowid();') as number;
    logAudit(db, 'CREATE_CASE', 'CourtDiary', String(newId), `Created case #${caseNumber.trim()} (Serial ${finalSerial})`, createdBy);

    res.status(201).json({
      message: 'Case saved successfully.',
      caseId: newId,
      serialNo: finalSerial
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create case' });
  }
});

// Update Case
router.put('/cases/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const caseId = parseInt(req.params.id, 10);

    const existing = queryRow<any>(db, 'SELECT * FROM CourtDiary WHERE ID = ?;', [caseId]);
    if (!existing) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const {
      serialNo,
      caseDate,
      caseNumber,
      result,
      dairyDate,
      description,
      remarks
    } = req.body;

    if (!caseNumber || !caseNumber.trim()) {
      return res.status(400).json({ error: 'Case Number is required.' });
    }

    const isoCaseDate = toIsoDate(caseDate);
    const isoDairyDate = toIsoDate(dairyDate);

    if (!isoCaseDate || !isoDairyDate) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }

    const finalSerial = parseInt(serialNo, 10) || existing.SerialNo;
    if (finalSerial !== existing.SerialNo) {
      const duplicate = queryRow(db, 'SELECT ID FROM CourtDiary WHERE SerialNo = ? AND ID != ?;', [finalSerial, caseId]);
      if (duplicate) {
        return res.status(400).json({ error: `Serial Number ${finalSerial} is already used by another case.` });
      }
    }

    const now = new Date().toISOString();
    const updatedBy = req.user?.fullName || req.user?.username || 'Officer';

    runTransaction(db, () => {
      db.run(
        `UPDATE CourtDiary SET
          SerialNo = ?,
          CaseDate = ?,
          CaseNumber = ?,
          Result = ?,
          DairyDate = ?,
          Description = ?,
          Remarks = ?,
          UpdatedDate = ?,
          UpdatedBy = ?
        WHERE ID = ?;`,
        [
          finalSerial,
          isoCaseDate,
          caseNumber.trim(),
          result ? result.trim() : existing.Result,
          isoDairyDate,
          description !== undefined ? description.trim() : existing.Description,
          remarks !== undefined ? remarks.trim() : existing.Remarks,
          now,
          updatedBy,
          caseId
        ]
      );
    });

    logAudit(db, 'UPDATE_CASE', 'CourtDiary', String(caseId), `Updated case #${caseNumber.trim()}`, updatedBy);

    res.json({ message: 'Case updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update case' });
  }
});

// Delete Case (strict confirmation)
router.delete('/cases/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const caseId = parseInt(req.params.id, 10);

    const existing = queryRow<any>(db, 'SELECT * FROM CourtDiary WHERE ID = ?;', [caseId]);
    if (!existing) {
      return res.status(404).json({ error: 'Case record not found' });
    }

    const user = req.user?.fullName || req.user?.username || 'Officer';

    runTransaction(db, () => {
      // Cascade delete proceedings and documents
      db.run('DELETE FROM CaseProceedings WHERE CaseID = ?;', [caseId]);
      db.run('DELETE FROM CaseDocuments WHERE CaseID = ?;', [caseId]);
      db.run('DELETE FROM CourtDiary WHERE ID = ?;', [caseId]);
    });

    logAudit(db, 'DELETE_CASE', 'CourtDiary', String(caseId), `Deleted case #${existing.CaseNumber} (Serial ${existing.SerialNo})`, user);

    res.json({ message: 'Case deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete case' });
  }
});

// Bulk import cases from CSV/JSON
router.post('/cases/bulk-import', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided for import.' });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; error: string }[] = [];
    const now = new Date().toISOString();
    const user = req.user?.fullName || req.user?.username || 'Officer';

    let currentMaxSerial = (queryScalar(db, 'SELECT COALESCE(MAX(SerialNo), 0) FROM CourtDiary;') as number) || 0;

    runTransaction(db, () => {
      records.forEach((row, index) => {
        try {
          const caseNumber = String(row.CaseNumber || row['Case Number'] || row.caseNumber || '').trim();
          if (!caseNumber) {
            throw new Error('Case Number missing');
          }

          const rawCaseDate = row.CaseDate || row['Case Date'] || row.caseDate;
          const rawDairyDate = row.DairyDate || row['Dairy Date'] || row.dairyDate;

          const isoCaseDate = toIsoDate(String(rawCaseDate || ''));
          const isoDairyDate = toIsoDate(String(rawDairyDate || ''));

          if (!isoCaseDate || !isoDairyDate) {
            throw new Error(`Invalid date format for record: ${caseNumber}`);
          }

          let serial = parseInt(row.SerialNo || row['Serial No'] || row.serialNo, 10);
          if (!serial || isNaN(serial)) {
            currentMaxSerial += 1;
            serial = currentMaxSerial;
          } else {
            if (serial > currentMaxSerial) currentMaxSerial = serial;
          }

          const result = String(row.Result || row.result || 'Pending').trim();
          const description = String(row.Description || row.description || '').trim();
          const remarks = String(row.Remarks || row.remarks || '').trim();

          db.run(
            `INSERT INTO CourtDiary (
              SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [serial, isoCaseDate, caseNumber, result, isoDairyDate, description, remarks, now, now, user, user]
          );
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push({ row: index + 1, error: err.message || 'Failed to insert row' });
        }
      });
    });

    logAudit(db, 'IMPORT_CASES', 'CourtDiary', null, `Imported ${successCount} cases (${failedCount} failed)`, user);

    res.json({
      message: `Import finished. ${successCount} successful, ${failedCount} failed.`,
      successCount,
      failedCount,
      errors
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bulk import failed' });
  }
});

export default router;
