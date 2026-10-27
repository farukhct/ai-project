import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
let cachedSqlEngine: any = null;
const dbPath = path.resolve(process.cwd(), 'CourtDairy.db');

export async function getSqlEngine() {
  if (cachedSqlEngine) return cachedSqlEngine;
  cachedSqlEngine = await initSqlJs({
    locateFile: (file) => {
      const p = path.resolve(process.cwd(), 'node_modules/sql.js/dist', file);
      return fs.existsSync(p) ? p : file;
    }
  });
  return cachedSqlEngine;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await getSqlEngine();
  let instance: Database;

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      instance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error reading existing CourtDairy.db, creating fresh instance:', err);
      instance = new SQL.Database();
    }
  } else {
    instance = new SQL.Database();
  }

  // Enable foreign keys
  instance.run('PRAGMA foreign_keys = ON;');

  // Initialize schema
  initSchema(instance);
  dbInstance = instance;
  saveDb();

  return instance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function reloadDbFromBuffer(buffer: Buffer): Promise<Database> {
  const SQL = await getSqlEngine();

  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }

  // Create an automatic safety backup copy of the existing database on disk
  if (fs.existsSync(dbPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(process.cwd(), `CourtDairy_PreRestore_${timestamp}.db`);
    try {
      fs.copyFileSync(dbPath, backupPath);
    } catch (e) {
      console.warn('Could not create pre-restore backup:', e);
    }
  }

  // Write new restored file
  fs.writeFileSync(dbPath, buffer);

  // Instantly instantiate new database
  const instance: Database = new SQL.Database(buffer);
  instance.run('PRAGMA foreign_keys = ON;');
  initSchema(instance);
  dbInstance = instance;
  saveDb();

  return instance;
}

/**
 * One-Click Database Reset
 * Resets case records, proceedings, documents, and sequences while preserving
 * active user accounts and system configuration. An automatic pre-reset safety
 * backup is created before clearing data.
 */
export async function resetDatabase(currentUsername: string): Promise<{ backupFile: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `CourtDairy_PreReset_${timestamp}.db`;
  const backupPath = path.resolve(process.cwd(), backupFileName);

  // 1. Create safety backup of existing db file
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
    } catch (e) {
      console.warn('Could not create pre-reset safety backup:', e);
    }
  }

  const db = await getDb();

  // 2. Wipe case data, proceedings, documents, and reset autoincrement sequences
  db.run('PRAGMA foreign_keys = OFF;');
  db.run(`
    DELETE FROM CaseDocuments;
    DELETE FROM CaseProceedings;
    DELETE FROM CourtDiary;
    DELETE FROM AuditLogs;
    DELETE FROM sqlite_sequence WHERE name IN ('CourtDiary', 'CaseProceedings', 'CaseDocuments', 'AuditLogs');
  `);
  db.run('PRAGMA foreign_keys = ON;');

  // 3. Ensure standard schemas and results exist
  initSchema(db);

  // 4. Record audit entry
  logAudit(
    db,
    'RESET_DATABASE',
    'System',
    null,
    `Database reset to clean state by ${currentUsername}. Safety backup: ${backupFileName}`,
    currentUsername
  );

  saveDb();
  return { backupFile: backupFileName };
}

function initSchema(db: Database) {
  // 1. Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      UserID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      PasswordHash TEXT NOT NULL,
      FullName TEXT NOT NULL,
      Role TEXT NOT NULL,
      IsActive INTEGER NOT NULL DEFAULT 1,
      CreatedDate TEXT NOT NULL,
      LastLogin TEXT
    );
  `);

  // 2. Results table
  db.run(`
    CREATE TABLE IF NOT EXISTS Results (
      ResultID INTEGER PRIMARY KEY AUTOINCREMENT,
      ResultName TEXT UNIQUE NOT NULL,
      IsActive INTEGER NOT NULL DEFAULT 1,
      CreatedDate TEXT NOT NULL
    );
  `);

  // 3. CourtDiary table
  db.run(`
    CREATE TABLE IF NOT EXISTS CourtDiary (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      SerialNo INTEGER UNIQUE NOT NULL,
      CaseDate TEXT NOT NULL,
      CaseNumber TEXT NOT NULL,
      Result TEXT NOT NULL,
      DairyDate TEXT NOT NULL,
      Description TEXT,
      Remarks TEXT,
      CreatedDate TEXT NOT NULL,
      UpdatedDate TEXT NOT NULL,
      CreatedBy TEXT,
      UpdatedBy TEXT
    );
  `);

  // Indexes for high performance search and dashboard
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_courtdiary_serial ON CourtDiary(SerialNo);
    CREATE INDEX IF NOT EXISTS idx_courtdiary_casedate ON CourtDiary(CaseDate);
    CREATE INDEX IF NOT EXISTS idx_courtdiary_casenumber ON CourtDiary(CaseNumber);
    CREATE INDEX IF NOT EXISTS idx_courtdiary_dairydate ON CourtDiary(DairyDate);
    CREATE INDEX IF NOT EXISTS idx_courtdiary_result ON CourtDiary(Result);
  `);

  // 4. CaseProceedings table (hearing history & real-time bench notes)
  db.run(`
    CREATE TABLE IF NOT EXISTS CaseProceedings (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CaseID INTEGER NOT NULL REFERENCES CourtDiary(ID) ON DELETE CASCADE,
      HearingDate TEXT NOT NULL,
      BusinessRecorded TEXT NOT NULL,
      NextHearingDate TEXT,
      BenchNotes TEXT,
      CreatedBy TEXT,
      CreatedDate TEXT NOT NULL
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_proceedings_caseid ON CaseProceedings(CaseID);`);

  // 5. CaseDocuments table (secure document uploads)
  db.run(`
    CREATE TABLE IF NOT EXISTS CaseDocuments (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CaseID INTEGER NOT NULL REFERENCES CourtDiary(ID) ON DELETE CASCADE,
      Title TEXT NOT NULL,
      DocumentType TEXT NOT NULL,
      FileName TEXT NOT NULL,
      FileSize INTEGER NOT NULL,
      MimeType TEXT NOT NULL,
      Base64Data TEXT NOT NULL,
      UploadedBy TEXT,
      UploadedDate TEXT NOT NULL
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_caseid ON CaseDocuments(CaseID);`);

  // 6. Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS Settings (
      SettingID INTEGER PRIMARY KEY AUTOINCREMENT,
      SettingKey TEXT UNIQUE NOT NULL,
      SettingValue TEXT NOT NULL
    );
  `);

  // 7. AuditLogs table
  db.run(`
    CREATE TABLE IF NOT EXISTS AuditLogs (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Action TEXT NOT NULL,
      Module TEXT NOT NULL,
      RecordID TEXT,
      Details TEXT,
      PerformedBy TEXT,
      PerformedAt TEXT NOT NULL
    );
  `);

  // Seed default results if table is empty
  const defaultResults = [
    'Pending',
    'Absolute',
    'Discharged',
    'Disposed of',
    'Disposed',
    'Allowed',
    'Dismissed',
    'Adjourned',
    'For Judgement',
    'Withdrawn',
    'Reserved',
    'Others'
  ];
  const now = new Date().toISOString();

  const resCount = queryScalar(db, 'SELECT COUNT(*) FROM Results;') as number;
  if (resCount === 0) {
    for (const res of defaultResults) {
      db.run('INSERT INTO Results (ResultName, IsActive, CreatedDate) VALUES (?, 1, ?);', [res, now]);
    }
  } else {
    // Ensure all standard judicial status options exist
    for (const res of defaultResults) {
      const exists = queryScalar(
        db,
        'SELECT COUNT(*) FROM Results WHERE LOWER(ResultName) = LOWER(?);',
        [res]
      ) as number;
      if (exists === 0) {
        db.run('INSERT INTO Results (ResultName, IsActive, CreatedDate) VALUES (?, 1, ?);', [res, now]);
      }
    }
  }

  // Seed default settings if empty
  const settingsCount = queryScalar(db, 'SELECT COUNT(*) FROM Settings;') as number;
  if (settingsCount === 0) {
    const defaults: Record<string, string> = {
      appName: 'Court Dairy',
      appSubtitle: 'Court Case Diary & Management System',
      courtName: 'Court of the Bench Officer & Judicial Magistrate',
      reportHeader: 'COURT CASE DIARY — PROCEEDINGS RECORD',
      reportFooter: 'Generated by Court Dairy — Court Case Diary & Management System',
      defaultResult: 'Pending',
      dateFormat: 'DD-MM-YYYY',
      upcomingDays: '14',
      theme: 'dark',
      autoBackup: 'Daily'
    };
    for (const [k, v] of Object.entries(defaults)) {
      db.run('INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?);', [k, v]);
    }
  }
}

export function queryScalar(db: Database, sql: string, params: SqlValue[] = []): SqlValue | null {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.get();
      return row[0] ?? null;
    }
    return null;
  } finally {
    stmt.free();
  }
}

export function queryRows<T = Record<string, any>>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  const rows: T[] = [];
  try {
    stmt.bind(params);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export function queryRow<T = Record<string, any>>(db: Database, sql: string, params: SqlValue[] = []): T | null {
  const rows = queryRows<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runTransaction(db: Database, callback: () => void): void {
  db.run('BEGIN TRANSACTION;');
  try {
    callback();
    db.run('COMMIT;');
    saveDb();
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
}

export function logAudit(db: Database, action: string, module: string, recordId: string | null, details: string, performedBy: string): void {
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO AuditLogs (Action, Module, RecordID, Details, PerformedBy, PerformedAt) VALUES (?, ?, ?, ?, ?, ?);',
    [action, module, recordId || '', details, performedBy, now]
  );
  saveDb();
}
