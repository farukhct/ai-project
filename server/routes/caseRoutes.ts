import { Router, Response } from 'express';
import { getDb, queryScalar, queryRow, queryRows, saveDb, logAudit, runTransaction } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Convert any supported date format to YYYY-MM-DD
const MONTH_MAP_SERVER: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

export function toIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // 1. Textual month format: "24 Sep 2026" or "24 September 2026"
  const textMonthMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, '0');
    const monStr = textMonthMatch[2].toLowerCase();
    const mon = MONTH_MAP_SERVER[monStr];
    const year = textMonthMatch[3];
    if (mon) return `${year}-${mon}-${day}`;
  }

  // 2. If in DD-MM-YYYY, DD/MM/YYYY, or DD.MM.YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split(/[-/.]/);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. If in YYYY-MM-DD, YYYY/MM/DD, or YYYY.MM.DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed)) {
    const [y, m, d] = trimmed.substring(0, 10).split(/[-/.]/);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 4. Fallback native parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

// Check if case number exists
router.get('/cases/check-casenumber', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const caseNumber = String(req.query.caseNumber || req.query.CaseNumber || '').trim();
    const excludeId = req.query.excludeId ? parseInt(String(req.query.excludeId), 10) : null;

    if (!caseNumber) {
      return res.json({ exists: false, match: null });
    }

    let sql = 'SELECT ID, SerialNo, CaseNumber, CaseDate, DairyDate, Result FROM CourtDiary WHERE LOWER(TRIM(CaseNumber)) = LOWER(TRIM(?))';
    const params: any[] = [caseNumber];
    if (excludeId && !isNaN(excludeId)) {
      sql += ' AND ID != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1;';

    const match = queryRow<any>(db, sql, params);
    if (match) {
      res.json({
        exists: true,
        match: {
          ...match,
          DisplayCaseDate: toDisplayDate(match.CaseDate),
          DisplayDairyDate: toDisplayDate(match.DairyDate)
        }
      });
    } else {
      res.json({ exists: false, match: null });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error checking case number' });
  }
});

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
    const q = req.query as Record<string, string>;
    const page = q.page || '1';
    const limit = q.limit || '25';
    const search = q.search || '';
    const sortBy = q.sortBy || q.SortBy || 'SerialNo';
    const sortOrder = q.sortOrder || q.SortOrder || 'ASC';
    const caseDateFrom = q.caseDateFrom || q.CaseDateFrom || '';
    const caseDateTo = q.caseDateTo || q.CaseDateTo || '';
    const dairyDateFrom = q.dairyDateFrom || q.DairyDateFrom || '';
    const dairyDateTo = q.dairyDateTo || q.DairyDateTo || '';
    const result = q.result || q.Result || '';
    const serialFrom = q.serialFrom || q.SerialFrom || '';
    const serialTo = q.serialTo || q.SerialTo || '';
    const caseNumber = q.caseNumber || q.CaseNumber || q['case-number'] || '';
    const description = q.description || q.Description || '';
    const remarks = q.remarks || q.Remarks || '';

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
    const rawCaseNumber = req.body.caseNumber ?? req.body.CaseNumber ?? req.body['Case Number'] ?? '';
    const rawCaseDate = req.body.caseDate ?? req.body.CaseDate ?? req.body['Case Date'] ?? '';
    const rawDairyDate = req.body.dairyDate ?? req.body.DairyDate ?? req.body['Dairy Date'] ?? '';
    const rawSerial = req.body.serialNo ?? req.body.SerialNo ?? req.body['Serial No'];
    const rawResult = req.body.result ?? req.body.Result ?? 'Pending';
    const rawDescription = req.body.description ?? req.body.Description ?? '';
    const rawRemarks = req.body.remarks ?? req.body.Remarks ?? '';

    const caseNumber = String(rawCaseNumber).trim();
    const caseDateStr = String(rawCaseDate).trim();
    const dairyDateStr = String(rawDairyDate).trim();

    // Validations
    if (!caseNumber) {
      return res.status(400).json({ error: 'Case Number is required.' });
    }
    if (!caseDateStr) {
      return res.status(400).json({ error: 'Case Date is required.' });
    }
    if (!dairyDateStr) {
      return res.status(400).json({ error: 'Dairy Date is required.' });
    }

    const isoCaseDate = toIsoDate(caseDateStr);
    const isoDairyDate = toIsoDate(dairyDateStr);

    if (!isoCaseDate || !isoDairyDate) {
      return res.status(400).json({ error: 'Invalid date format. Expected DD-MM-YYYY or YYYY-MM-DD.' });
    }

    // Determine SerialNo (or validate supplied)
    let finalSerial = parseInt(String(rawSerial), 10);
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

    const result = String(rawResult).trim() || 'Pending';
    const description = String(rawDescription).trim();
    const remarks = String(rawRemarks).trim();
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
          caseNumber,
          result,
          isoDairyDate,
          description,
          remarks,
          now,
          now,
          createdBy,
          createdBy
        ]
      );
    });

    const newId = queryScalar(db, 'SELECT last_insert_rowid();') as number;
    logAudit(db, 'CREATE_CASE', 'CourtDiary', String(newId), `Created case #${caseNumber} (Serial ${finalSerial})`, createdBy);

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

    const rawCaseNumber = req.body.caseNumber ?? req.body.CaseNumber ?? req.body['Case Number'] ?? existing.CaseNumber;
    const rawCaseDate = req.body.caseDate ?? req.body.CaseDate ?? req.body['Case Date'] ?? existing.CaseDate;
    const rawDairyDate = req.body.dairyDate ?? req.body.DairyDate ?? req.body['Dairy Date'] ?? existing.DairyDate;
    const rawSerial = req.body.serialNo ?? req.body.SerialNo ?? req.body['Serial No'];
    const rawResult = req.body.result ?? req.body.Result ?? existing.Result;
    const rawDescription = req.body.description ?? req.body.Description ?? existing.Description;
    const rawRemarks = req.body.remarks ?? req.body.Remarks ?? existing.Remarks;

    const caseNumber = String(rawCaseNumber).trim();
    if (!caseNumber) {
      return res.status(400).json({ error: 'Case Number is required.' });
    }

    const isoCaseDate = toIsoDate(String(rawCaseDate).trim());
    const isoDairyDate = toIsoDate(String(rawDairyDate).trim());

    if (!isoCaseDate || !isoDairyDate) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }

    const finalSerial = parseInt(String(rawSerial), 10) || existing.SerialNo;
    if (finalSerial !== existing.SerialNo) {
      const duplicate = queryRow(db, 'SELECT ID FROM CourtDiary WHERE SerialNo = ? AND ID != ?;', [finalSerial, caseId]);
      if (duplicate) {
        return res.status(400).json({ error: `Serial Number ${finalSerial} is already used by another case.` });
      }
    }

    const result = String(rawResult).trim() || existing.Result;
    const description = rawDescription !== undefined ? String(rawDescription).trim() : existing.Description;
    const remarks = rawRemarks !== undefined ? String(rawRemarks).trim() : existing.Remarks;
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
          caseNumber,
          result,
          isoDairyDate,
          description,
          remarks,
          now,
          updatedBy,
          caseId
        ]
      );
    });

    logAudit(db, 'UPDATE_CASE', 'CourtDiary', String(caseId), `Updated case #${caseNumber}`, updatedBy);

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
