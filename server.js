import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import {
  createClearSessionCookie,
  createPasswordHash,
  createSessionCookie,
  createSessionToken,
  getSessionCookie,
  verifyPassword,
  verifySessionToken,
} from './server/auth.js';
import { createDataStore, normalizeDbShape } from './server/data-store.js';
import { searchDatabase } from './server/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_EMAIL = process.env.AUTH_EMAIL || 'garotadesorte@btiradentes.vet';
const INITIAL_AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('base64url');
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL || process.env.DB_url;

const resolveDataDir = () => {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) return process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (process.env.RAILWAY_ENVIRONMENT || fs.existsSync('/data')) return '/data';
  return path.join(__dirname, 'data');
};

const DATA_DIR = resolveDataDir();
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const dataStore = createDataStore({ databaseUrl: DATABASE_URL, fallbackFile: DB_FILE });

app.use(express.json({ limit: '10mb' }));

[DATA_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

await dataStore.init();

const migrateJsonFileToPostgres = async () => {
  if (dataStore.type !== 'postgres' || !fs.existsSync(DB_FILE)) return;
  const current = await dataStore.read();
  const existingCount = current.patients.length + current.sessions.length + current.appointments.length;
  if (existingCount > 0) return;

  try {
    const fileDb = normalizeDbShape(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
    const fileCount = fileDb.patients.length + fileDb.sessions.length + fileDb.appointments.length;
    if (fileCount > 0) await dataStore.write(fileDb);
  } catch (error) {
    console.error('Error migrating JSON data to PostgreSQL:', error);
  }
};

await migrateJsonFileToPostgres();

const ensurePasswordHash = async () => {
  const existingHash = await dataStore.getSetting('auth.passwordHash');
  if (existingHash) return existingHash;
  if (!INITIAL_AUTH_PASSWORD) {
    throw new Error('AUTH_PASSWORD must be set before the first login password hash can be created.');
  }
  const hash = await createPasswordHash(INITIAL_AUTH_PASSWORD);
  await dataStore.setSetting('auth.passwordHash', hash);
  return hash;
};

await ensurePasswordHash();

const isSecureCookie = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getSession = (req) => verifySessionToken(getSessionCookie(req), SESSION_SECRET);

const requireAuth = (req, res, next) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Não autenticado.' });
  req.user = session;
  return next();
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use imagens ou PDF.'));
  }
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const passwordHash = await ensurePasswordHash();
  const isValid = email === AUTH_EMAIL && await verifyPassword(password || '', passwordHash);

  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Email ou senha incorretos.' });
  }

  const token = createSessionToken({ email, secret: SESSION_SECRET });
  res.setHeader('Set-Cookie', createSessionCookie(token, isSecureCookie(req)));
  return res.json({ success: true, user: { email } });
}));

app.get('/api/auth/me', (req, res) => {
  const session = getSession(req);
  res.json({
    authenticated: Boolean(session),
    user: session ? { email: session.email } : null,
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', createClearSessionCookie());
  res.json({ success: true });
});

app.post('/api/auth/password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(422).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
  }

  const passwordHash = await ensurePasswordHash();
  if (!await verifyPassword(currentPassword || '', passwordHash)) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  await dataStore.setSetting('auth.passwordHash', await createPasswordHash(newPassword));
  res.setHeader('Set-Cookie', createClearSessionCookie());
  return res.json({ success: true });
}));

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const filename = path.basename(req.file.filename);
  res.json({
    success: true,
    filename,
    url: `/api/uploads/${filename}`
  });
});

app.use('/api/uploads', requireAuth, express.static(UPLOADS_DIR));

app.delete('/api/uploads/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const target = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  fs.unlinkSync(target);
  res.json({ success: true });
});

app.get('/api/storage-info', requireAuth, (_req, res) => {
  res.json({
    database: dataStore.type,
    dataDir: DATA_DIR,
    uploadsDir: UPLOADS_DIR,
    uploadEndpoint: '/api/upload',
    uploadsPublicPath: '/api/uploads'
  });
});

app.get('/api/search', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  res.json(searchDatabase(db, req.query.q || ''));
}));

app.get('/api/data', requireAuth, asyncHandler(async (_req, res) => {
  res.json(await dataStore.read());
}));

app.post('/api/data', requireAuth, asyncHandler(async (req, res) => {
  await dataStore.write(req.body);
  res.json({ success: true });
}));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*all', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((error, _req, res, next) => {
  void next;
  console.error(error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database store: ${dataStore.type}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
