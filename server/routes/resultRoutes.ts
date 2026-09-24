import { Router, Response } from 'express';
import { getDb, queryRow, queryRows, queryScalar, saveDb, logAudit } from '../db.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Get all results
router.get('/results', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryRows(db, 'SELECT * FROM Results ORDER BY ResultName ASC;');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch results' });
  }
});

// Add result
router.post('/results', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { resultName } = req.body;
    if (!resultName || !resultName.trim()) {
      return res.status(400).json({ error: 'Result name is required.' });
    }

    const existing = queryRow(db, 'SELECT ResultID FROM Results WHERE LOWER(ResultName) = LOWER(?);', [resultName.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Result already exists.' });
    }

    const now = new Date().toISOString();
    db.run('INSERT INTO Results (ResultName, IsActive, CreatedDate) VALUES (?, 1, ?);', [resultName.trim(), now]);
    saveDb();

    const user = req.user?.username || 'Admin';
    logAudit(db, 'CREATE_RESULT', 'Results', null, `Created result type: ${resultName.trim()}`, user);

    res.status(201).json({ message: 'Result type added successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add result' });
  }
});

// Edit result
router.put('/results/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const { resultName, isActive } = req.body;

    const existing = queryRow<any>(db, 'SELECT * FROM Results WHERE ResultID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Result not found.' });
    }

    const newName = resultName ? resultName.trim() : existing.ResultName;
    const newActive = isActive !== undefined ? (isActive ? 1 : 0) : existing.IsActive;

    db.run('UPDATE Results SET ResultName = ?, IsActive = ? WHERE ResultID = ?;', [newName, newActive, id]);
    saveDb();

    const user = req.user?.username || 'Admin';
    logAudit(db, 'UPDATE_RESULT', 'Results', String(id), `Updated result #${id} to ${newName}`, user);

    res.json({ message: 'Result updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update result' });
  }
});

// Delete result
router.delete('/results/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const existing = queryRow<any>(db, 'SELECT * FROM Results WHERE ResultID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Result not found.' });
    }

    // Check if cases are using this result
    const usedCount = queryScalar(db, 'SELECT COUNT(*) FROM CourtDiary WHERE Result = ?;', [existing.ResultName]) as number;
    if (usedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete result '${existing.ResultName}' because it is in use by ${usedCount} case record(s). Deactivate it instead.`
      });
    }

    db.run('DELETE FROM Results WHERE ResultID = ?;', [id]);
    saveDb();

    const user = req.user?.username || 'Admin';
    logAudit(db, 'DELETE_RESULT', 'Results', String(id), `Deleted result ${existing.ResultName}`, user);

    res.json({ message: 'Result deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete result' });
  }
});

export default router;
