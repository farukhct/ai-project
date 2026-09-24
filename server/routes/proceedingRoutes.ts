import { Router, Response } from 'express';
import { getDb, queryRow, queryRows, queryScalar, saveDb, logAudit, runTransaction } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { toIsoDate, toDisplayDate } from './caseRoutes.js';

const router = Router();

// Add proceeding / bench note to case
router.post('/cases/:caseId/proceedings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const caseId = parseInt(req.params.caseId, 10);
    const { hearingDate, businessRecorded, nextHearingDate, benchNotes, updateResult } = req.body;

    if (!hearingDate || !businessRecorded) {
      return res.status(400).json({ error: 'Hearing date and business recorded are required.' });
    }

    const isoHearingDate = toIsoDate(hearingDate);
    const isoNextHearingDate = nextHearingDate ? toIsoDate(nextHearingDate) : null;
    const now = new Date().toISOString();
    const author = req.user?.fullName || req.user?.username || 'Officer';

    runTransaction(db, () => {
      db.run(
        `INSERT INTO CaseProceedings (CaseID, HearingDate, BusinessRecorded, NextHearingDate, BenchNotes, CreatedBy, CreatedDate)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [caseId, isoHearingDate, businessRecorded.trim(), isoNextHearingDate, benchNotes ? benchNotes.trim() : '', author, now]
      );

      // If next hearing date is provided, update Case DairyDate to next date!
      if (isoNextHearingDate) {
        db.run(
          `UPDATE CourtDiary SET DairyDate = ?, UpdatedDate = ?, UpdatedBy = ? WHERE ID = ?;`,
          [isoNextHearingDate, now, author, caseId]
        );
      }

      // If updateResult provided
      if (updateResult) {
        db.run(
          `UPDATE CourtDiary SET Result = ?, UpdatedDate = ?, UpdatedBy = ? WHERE ID = ?;`,
          [updateResult.trim(), now, author, caseId]
        );
      }
    });

    const newId = queryScalar(db, 'SELECT last_insert_rowid();') as number;
    logAudit(db, 'ADD_PROCEEDING', 'CaseProceedings', String(newId), `Added proceeding entry for Case #${caseId}`, author);

    res.status(201).json({ message: 'Proceeding & bench notes recorded successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add proceeding' });
  }
});

// Delete proceeding entry
router.delete('/proceedings/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const existing = queryRow(db, 'SELECT * FROM CaseProceedings WHERE ID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Proceeding entry not found' });
    }

    const user = req.user?.fullName || req.user?.username || 'Officer';
    db.run('DELETE FROM CaseProceedings WHERE ID = ?;', [id]);
    saveDb();

    logAudit(db, 'DELETE_PROCEEDING', 'CaseProceedings', String(id), `Deleted proceeding entry #${id}`, user);
    res.json({ message: 'Proceeding entry removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete proceeding' });
  }
});

export default router;
