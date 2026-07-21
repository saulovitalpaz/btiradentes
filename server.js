import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

app.use(express.json({ limit: '10mb' }));

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure db file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ patients: [], sessions: [] }));
}

// Multer storage - saves directly to the Railway /data/uploads volume
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                allowed.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use imagens ou PDF.'));
  }
});

// --- API Routes ---

// Upload image/file attached to a session
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  res.json({
    success: true,
    filename: req.file.filename,
    url: `/api/uploads/${req.file.filename}`
  });
});

// Serve uploaded files
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Delete an uploaded file
app.delete('/api/uploads/:filename', (req, res) => {
  const target = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  fs.unlinkSync(target);
  res.json({ success: true });
});

// Database read
app.get('/api/data', (_req, res) => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Database write
app.post('/api/data', (req, res) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// React routing fallback
app.get('*all', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data volume mounted at: ${DATA_DIR}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
