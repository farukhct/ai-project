import { Router, Response } from 'express';
import { getDb, queryRows, saveDb, logAudit } from '../db.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Get settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryRows<{ SettingKey: string; SettingValue: string }>(
      db,
      'SELECT SettingKey, SettingValue FROM Settings;'
    );
    const settingsMap: Record<string, string> = {};
    rows.forEach(r => {
      settingsMap[r.SettingKey] = r.SettingValue;
    });
    res.json(settingsMap);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// Update settings (admin only)
router.put('/settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }

    for (const [key, val] of Object.entries(settings)) {
      db.run(
        `INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?)
         ON CONFLICT(SettingKey) DO UPDATE SET SettingValue = excluded.SettingValue;`,
        [key, String(val)]
      );
    }
    saveDb();

    const admin = req.user?.username || 'Admin';
    logAudit(db, 'UPDATE_SETTINGS', 'Settings', null, `Updated system configuration settings`, admin);

    res.json({ message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

export default router;
