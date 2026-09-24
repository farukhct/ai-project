import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDb, reloadDbFromBuffer, queryRows, logAudit, saveDb } from '../db.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();
const dbPath = path.resolve(process.cwd(), 'CourtDairy.db');

// Download SQLite Database Backup (.db)
router.get('/backup/download', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    saveDb(); // ensure all flushed

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `CourtDairy_Backup_${todayStr}.db`;

    logAudit(db, 'BACKUP_DOWNLOAD', 'Database', null, `Downloaded complete SQLite backup: ${fileName}`, req.user?.username || 'Admin');

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download database backup' });
  }
});

// Restore SQLite Database
router.post('/backup/restore', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { base64Data, confirmation } = req.body;

    if (confirmation !== 'CONFIRM_RESTORE') {
      return res.status(400).json({ error: 'Confirmation string "CONFIRM_RESTORE" is required to prevent accidental overwrite.' });
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'No database file provided.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Validate SQLite magic header: "SQLite format 3\0"
    const header = buffer.subarray(0, 16).toString('utf-8');
    if (!header.startsWith('SQLite format 3')) {
      return res.status(400).json({ error: 'Invalid SQLite database file. Header check failed.' });
    }

    // Reload database from buffer
    reloadDbFromBuffer(buffer);

    // Re-verify new database instance
    const freshDb = await getDb();
    logAudit(freshDb, 'RESTORE_DATABASE', 'Database', null, `Restored database from uploaded backup file`, req.user?.username || 'Admin');

    res.json({ message: 'Database restored successfully. Application data reloaded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restore database' });
  }
});

// View Audit Logs
router.get('/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryRows(
      db,
      'SELECT * FROM AuditLogs ORDER BY ID DESC LIMIT 100;'
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

export default router;
