import { Router, Response } from 'express';
import { getDb, queryRow, queryRows, queryScalar, saveDb, logAudit } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Upload document for a case
router.post('/cases/:caseId/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const caseId = parseInt(req.params.caseId, 10);
    const title = req.body.title ?? req.body.Title;
    const documentType = req.body.documentType ?? req.body.DocumentType;
    const fileName = req.body.fileName ?? req.body.FileName;
    const fileSize = req.body.fileSize ?? req.body.FileSize;
    const mimeType = req.body.mimeType ?? req.body.MimeType;
    const base64Data = req.body.base64Data ?? req.body.Base64Data;

    if (!title || !fileName || !base64Data) {
      return res.status(400).json({ error: 'Title, file name, and file data are required.' });
    }

    const caseRecord = queryRow(db, 'SELECT ID, CaseNumber FROM CourtDiary WHERE ID = ?;', [caseId]);
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const now = new Date().toISOString();
    const uploader = req.user?.fullName || req.user?.username || 'Officer';

    db.run(
      `INSERT INTO CaseDocuments (CaseID, Title, DocumentType, FileName, FileSize, MimeType, Base64Data, UploadedBy, UploadedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        caseId,
        title.trim(),
        documentType ? documentType.trim() : 'General Record',
        fileName.trim(),
        fileSize || 0,
        mimeType || 'application/octet-stream',
        base64Data,
        uploader,
        now
      ]
    );
    saveDb();

    const docId = queryScalar(db, 'SELECT last_insert_rowid();') as number;
    logAudit(db, 'UPLOAD_DOC', 'CaseDocuments', String(docId), `Uploaded document ${fileName} for Case #${caseId}`, uploader);

    res.status(201).json({ message: 'Document uploaded and attached securely.', docId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// Download / get document payload
router.get('/documents/:id/download', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const doc = queryRow<any>(db, 'SELECT * FROM CaseDocuments WHERE ID = ?;', [id]);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json({
      title: doc.Title,
      fileName: doc.FileName,
      mimeType: doc.MimeType,
      fileSize: doc.FileSize,
      base64Data: doc.Base64Data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve document' });
  }
});

// Delete document
router.delete('/documents/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const existing = queryRow<any>(db, 'SELECT * FROM CaseDocuments WHERE ID = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const user = req.user?.fullName || req.user?.username || 'Officer';
    db.run('DELETE FROM CaseDocuments WHERE ID = ?;', [id]);
    saveDb();

    logAudit(db, 'DELETE_DOC', 'CaseDocuments', String(id), `Deleted document ${existing.FileName}`, user);
    res.json({ message: 'Document deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

export default router;
