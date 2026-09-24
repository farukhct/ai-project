import { Router, Response } from 'express';
import { getDb, queryScalar, queryRow, queryRows, saveDb, logAudit } from '../db.js';
import { hashPassword, verifyPassword, createSessionToken, revokeSessionToken, requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Check if first-run setup is required
router.get('/status', async (req, res) => {
  try {
    const db = await getDb();
    const userCount = queryScalar(db, 'SELECT COUNT(*) FROM Users;') as number;
    const caseCount = queryScalar(db, 'SELECT COUNT(*) FROM CourtDiary;') as number;
    res.json({
      setupRequired: userCount === 0,
      totalUsers: userCount,
      totalCases: caseCount,
      database: 'CourtDairy.db',
      system: 'Court Dairy Management System',
      version: '1.0.0'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Database status error' });
  }
});

// First-run administrator creation
router.post('/setup', async (req, res) => {
  try {
    const db = await getDb();
    const userCount = queryScalar(db, 'SELECT COUNT(*) FROM Users;') as number;
    if (userCount > 0) {
      return res.status(400).json({ error: 'Initial administrator already created. Please log in.' });
    }

    const { username, password, fullName } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required.' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }
    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters long.' });
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO Users (Username, PasswordHash, FullName, Role, IsActive, CreatedDate) VALUES (?, ?, ?, ?, 1, ?);',
      [username.trim(), passwordHash, fullName.trim(), 'Administrator', now]
    );
    saveDb();

    logAudit(db, 'SETUP_ADMIN', 'Security', '1', `Created primary administrator account: ${username.trim()}`, username.trim());

    // Auto log in after initial setup
    const newUser = queryRow(db, 'SELECT UserID, Username, FullName, Role FROM Users WHERE Username = ?;', [username.trim()]);
    if (!newUser) {
      return res.status(500).json({ error: 'Failed to retrieve created user.' });
    }

    const token = createSessionToken(newUser as any);
    res.json({
      message: 'Administrator account configured successfully.',
      token,
      user: {
        userId: newUser.UserID,
        username: newUser.Username,
        fullName: newUser.FullName,
        role: newUser.Role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error during administrator setup' });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = await getDb();
    const user = queryRow<{
      UserID: number;
      Username: string;
      PasswordHash: string;
      FullName: string;
      Role: string;
      IsActive: number;
    }>(db, 'SELECT * FROM Users WHERE Username = ?;', [username.trim()]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.IsActive !== 1) {
      return res.status(403).json({ error: 'Account is deactivated. Contact Administrator.' });
    }

    const isValid = verifyPassword(password, user.PasswordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const now = new Date().toISOString();
    db.run('UPDATE Users SET LastLogin = ? WHERE UserID = ?;', [now, user.UserID]);
    saveDb();

    const token = createSessionToken(user);
    logAudit(db, 'LOGIN', 'Auth', String(user.UserID), `User ${user.Username} logged in`, user.Username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.UserID,
        username: user.Username,
        fullName: user.FullName,
        role: user.Role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Logout
router.post('/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeSessionToken(authHeader.substring(7).trim());
  }
  if (req.user) {
    const db = await getDb();
    logAudit(db, 'LOGOUT', 'Auth', String(req.user.userId), `User ${req.user.username} logged out`, req.user.username);
  }
  res.json({ message: 'Logged out successfully' });
});

// Current user profile
router.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
