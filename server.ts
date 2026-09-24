import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/authRoutes.js';
import caseRoutes from './server/routes/caseRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import proceedingRoutes from './server/routes/proceedingRoutes.js';
import documentRoutes from './server/routes/documentRoutes.js';
import resultRoutes from './server/routes/resultRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import settingRoutes from './server/routes/settingRoutes.js';
import backupRoutes from './server/routes/backupRoutes.js';
import { getDb } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limits for base64 attachments and database backups
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api', authRoutes);
app.use('/api', caseRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', proceedingRoutes);
app.use('/api', documentRoutes);
app.use('/api', resultRoutes);
app.use('/api', userRoutes);
app.use('/api', settingRoutes);
app.use('/api', backupRoutes);

// Initialize DB on boot
getDb()
  .then(() => {
    console.log('✅ SQLite CourtDairy.db ready.');
  })
  .catch((err) => {
    console.error('❌ Failed to initialize SQLite database:', err);
  });

async function startServer() {
  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏛️ Court Dairy Desktop System running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
