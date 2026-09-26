import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// If started with plain `node server.ts`, auto-bootstrap using `--import tsx`
const isTsxActive = process.execArgv.some(arg => arg.includes('tsx')) || process.env.TSX_ACTIVE === '1';

if (!isTsxActive) {
  const child = spawn(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, TSX_ACTIVE: '1' }
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  // Wait indefinitely while child runs
  await new Promise(() => {});
}

// Dynamically import dependencies once tsx is active
const [
  { default: express },
  { default: authRoutes },
  { default: caseRoutes },
  { default: dashboardRoutes },
  { default: proceedingRoutes },
  { default: documentRoutes },
  { default: resultRoutes },
  { default: userRoutes },
  { default: settingRoutes },
  { default: backupRoutes },
  { getDb }
] = await Promise.all([
  import('express'),
  import('./server/routes/authRoutes.js'),
  import('./server/routes/caseRoutes.js'),
  import('./server/routes/dashboardRoutes.js'),
  import('./server/routes/proceedingRoutes.js'),
  import('./server/routes/documentRoutes.js'),
  import('./server/routes/resultRoutes.js'),
  import('./server/routes/userRoutes.js'),
  import('./server/routes/settingRoutes.js'),
  import('./server/routes/backupRoutes.js'),
  import('./server/db.js')
]);

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
