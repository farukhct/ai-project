import { Router, Response } from 'express';
import { getDb, queryRow, queryRows, queryScalar, saveDb, logAudit } from '../db.js';
import { requireAuth, requireAdmin, hashPassword, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Get users list (admin only)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryRows<any>(
      db,
      'SELECT UserID, Username, FullName, Role, IsActive, CreatedDate, LastLogin FROM Users ORDER BY UserID ASC;'
    );
    const users = rows.map((r) => ({
      userId: r.UserID,
      username: r.Username,
      fullName: r.FullName,
      role: r.Role,
      isActive: r.IsActive,
      createdDate: r.CreatedDate,
      lastLogin: r.LastLogin,
      UserID: r.UserID,
      Username: r.Username,
      FullName: r.FullName,
      Role: r.Role,
      IsActive: r.IsActive
    }));
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// Create new user (admin only)
router.post('/users', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { username, password, fullName, role = 'User' } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required.' });
    }

    const existing = queryRow(db, 'SELECT UserID FROM Users WHERE LOWER(Username) = LOWER(?);', [username.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Username already in use.' });
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO Users (Username, PasswordHash, FullName, Role, IsActive, CreatedDate) VALUES (?, ?, ?, ?, 1, ?);',
      [username.trim(), passwordHash, fullName.trim(), role === 'Administrator' ? 'Administrator' : 'User', now]
    );
    saveDb();

    const admin = req.user?.username || 'Admin';
    logAudit(db, 'CREATE_USER', 'Users', null, `Created user ${username.trim()} with role ${role}`, admin);

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/users/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const { fullName, role, isActive, password } = req.body;

    const existing = queryRow<any>(db, 'SELECT * FROM Users WHERE UserID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newFullName = fullName ? fullName.trim() : existing.FullName;
    const newRole = role !== undefined ? role : existing.Role;
    const newIsActive = isActive !== undefined ? (isActive ? 1 : 0) : existing.IsActive;

    // If updating own account, prevent deactivating or demoting self if sole admin
    if (req.user?.userId === id && (newIsActive === 0 || newRole !== 'Administrator')) {
      const adminCount = queryScalar(db, "SELECT COUNT(*) FROM Users WHERE Role = 'Administrator' AND IsActive = 1;") as number;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate or demote the sole active administrator.' });
      }
    }

    if (password && password.trim()) {
      const newHash = hashPassword(password.trim());
      db.run(
        'UPDATE Users SET FullName = ?, Role = ?, IsActive = ?, PasswordHash = ? WHERE UserID = ?;',
        [newFullName, newRole, newIsActive, newHash, id]
      );
    } else {
      db.run(
        'UPDATE Users SET FullName = ?, Role = ?, IsActive = ? WHERE UserID = ?;',
        [newFullName, newRole, newIsActive, id]
      );
    }
    saveDb();

    const admin = req.user?.username || 'Admin';
    logAudit(db, 'UPDATE_USER', 'Users', String(id), `Updated user ${existing.Username}`, admin);

    res.json({ message: 'User updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);

    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
    }

    const existing = queryRow<any>(db, 'SELECT * FROM Users WHERE UserID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.run('DELETE FROM Users WHERE UserID = ?;', [id]);
    saveDb();

    const admin = req.user?.username || 'Admin';
    logAudit(db, 'DELETE_USER', 'Users', String(id), `Deleted user ${existing.Username}`, admin);

    res.json({ message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

export default router;
