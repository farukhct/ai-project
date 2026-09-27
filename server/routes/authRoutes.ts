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
    const input = (username || '').trim();

    // 1. Direct case-insensitive match
    let user = queryRow<{
      UserID: number;
      Username: string;
      PasswordHash: string;
      FullName: string;
      Role: string;
      IsActive: number;
    }>(db, 'SELECT * FROM Users WHERE LOWER(Username) = LOWER(?);', [input]);

    // 2. If entered as email (e.g. faruk017@gmail.com), check prefix before '@' or substring
    if (!user && input.includes('@')) {
      const emailPrefix = input.split('@')[0].toLowerCase();
      user = queryRow<any>(
        db,
        "SELECT * FROM Users WHERE LOWER(Username) = LOWER(?) OR ? LIKE LOWER(Username) || '%' OR LOWER(Username) LIKE ? || '%' LIMIT 1;",
        [emailPrefix, emailPrefix, emailPrefix]
      );
    }

    // 3. Fallback: If 'admin' or 'administrator' is typed and there is an Administrator account
    if (!user && (input.toLowerCase() === 'admin' || input.toLowerCase() === 'administrator')) {
      user = queryRow<any>(db, "SELECT * FROM Users WHERE Role = 'Administrator' ORDER BY UserID ASC LIMIT 1;");
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password.'
      });
    }

    if (user.IsActive !== 1) {
      return res.status(403).json({ error: 'Account is deactivated. Contact Administrator.' });
    }

    const isValid = verifyPassword(password, user.PasswordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid password. If you forgot your password, you can reset it below.'
      });
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

// Self-service emergency password reset
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required.' });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({ error: 'New password must be at least 5 characters long.' });
    }

    const db = await getDb();
    const input = (username || '').trim();
    let user = queryRow<any>(db, 'SELECT * FROM Users WHERE LOWER(Username) = LOWER(?);', [input]);

    if (!user && (input.toLowerCase() === 'admin' || input.toLowerCase() === 'administrator')) {
      user = queryRow<any>(db, "SELECT * FROM Users WHERE Role = 'Administrator' ORDER BY UserID ASC LIMIT 1;");
    }

    if (!user) {
      return res.status(404).json({ error: `Account '${input}' not found in database.` });
    }

    const newHash = hashPassword(newPassword);
    db.run('UPDATE Users SET PasswordHash = ?, IsActive = 1 WHERE UserID = ?;', [newHash, user.UserID]);
    saveDb();

    logAudit(db, 'PASSWORD_RESET', 'Security', String(user.UserID), `Password reset for user ${user.Username}`, user.Username);

    res.json({ message: `Password for account '${user.Username}' has been reset successfully. You can now log in.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password reset error' });
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
