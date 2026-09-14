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
import {
  applyPatientWeight,
  buildRecurringAppointments,
  DEFAULT_AVAILABILITY,
  hasAppointmentConflict,
  normalizeAvailability,
} from './server/clinic-domain.js';

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

app.get('/api/appointments', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const { from, to, patientId } = req.query;
  const appointments = db.appointments.filter((appointment) => (
    (!from || appointment.date >= from) &&
    (!to || appointment.date <= to) &&
    (!patientId || appointment.patientId === patientId)
  ));
  res.json({ appointments });
}));

const validateAppointment = (appointment) => {
  if (!appointment.patientId || !appointment.date || !appointment.time) {
    return 'Paciente, data e horário são obrigatórios.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment.date) || !/^\d{2}:\d{2}$/.test(appointment.time)) {
    return 'Informe uma data e um horário válidos.';
  }
  return null;
};

const createAppointments = async (payload, { series = false } = {}) => {
  const db = await dataStore.read();
  const patient = db.patients.find((item) => item.id === payload.patientId);
  if (!patient) throw Object.assign(new Error('Paciente não encontrado.'), { statusCode: 404 });
  const validationError = validateAppointment(payload);
  if (validationError) throw Object.assign(new Error(validationError), { statusCode: 422 });

  const total = series || payload.recurrence?.total ? Number(payload.recurrence?.total || payload.total || 1) : 1;
  const pattern = payload.recurrence?.pattern || payload.pattern || 'weekly';
  const appointment = {
    patientId: payload.patientId,
    date: payload.date,
    time: payload.time,
    reason: payload.reason || 'Sessão Fisioterapia',
    status: payload.status || 'Agendado',
    ...(payload.defaultAppointmentTime ? { defaultAppointmentTime: payload.defaultAppointmentTime } : {}),
  };
  const result = buildRecurringAppointments({
    appointment,
    total,
    pattern,
    existing: db.appointments,
    idFactory: () => crypto.randomUUID(),
  });

  if (result.created.length > 0) {
    db.appointments.push(...result.created);
    await dataStore.write(db);
  }
  return result;
};

app.post('/api/appointments', requireAuth, asyncHandler(async (req, res) => {
  const result = await createAppointments(req.body || {});
  res.status(result.created.length ? 201 : 409).json(result);
}));

app.post('/api/appointments/series', requireAuth, asyncHandler(async (req, res) => {
  const result = await createAppointments(req.body || {}, { series: true });
  res.status(result.created.length ? 201 : 409).json(result);
}));

app.patch('/api/appointments/:id', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const index = db.appointments.findIndex((appointment) => appointment.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Agendamento não encontrado.' });

  const next = { ...db.appointments[index], ...req.body, updatedAt: new Date().toISOString() };
  const validationError = validateAppointment(next);
  if (validationError) return res.status(422).json({ error: validationError });
  if (hasAppointmentConflict(next, db.appointments, req.params.id)) {
    return res.status(409).json({ error: 'Este horário já está ocupado.' });
  }
  db.appointments[index] = next;
  await dataStore.write(db);
  return res.json({ appointment: next });
}));

app.delete('/api/appointments/:id', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const next = db.appointments.filter((appointment) => appointment.id !== req.params.id);
  if (next.length === db.appointments.length) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  await dataStore.write({ ...db, appointments: next });
  return res.json({ success: true });
}));

const findDefaultAppointmentTime = (db, patientId, session = {}) => (
  session.time ||
  db.patients.find((patient) => patient.id === patientId)?.defaultAppointmentTime ||
  db.appointments
    .filter((appointment) => appointment.patientId === patientId && appointment.time)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))[0]?.time ||
  ''
);

const createNextSessionAppointment = (db, session) => {
  if (!session.proximaSessao) return null;
  const time = session.proximaSessaoTime || findDefaultAppointmentTime(db, session.patientId, session);
  if (!time) throw Object.assign(new Error('Informe o horário da próxima sessão.'), { statusCode: 422 });
  const duplicate = db.appointments.find((appointment) => (
    appointment.patientId === session.patientId &&
    appointment.date === session.proximaSessao &&
    appointment.time === time &&
    appointment.status !== 'Realizado'
  ));
  if (duplicate) return duplicate;
  return {
    id: crypto.randomUUID(),
    patientId: session.patientId,
    date: session.proximaSessao,
    time,
    reason: 'Próxima sessão',
    status: 'Agendado',
    createdAt: new Date().toISOString(),
  };
};

app.post('/api/patients', requireAuth, asyncHandler(async (req, res) => {
  const patient = { ...req.body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  if (!patient.name?.trim() || !patient.tutor?.trim()) return res.status(422).json({ error: 'Nome e tutor são obrigatórios.' });
  const db = await dataStore.read();
  db.patients.push(patient);
  await dataStore.write(db);
  return res.status(201).json({ patient });
}));

app.patch('/api/patients/:id', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const index = db.patients.findIndex((patient) => patient.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Paciente não encontrado.' });
  const next = { ...db.patients[index], ...req.body, updatedAt: new Date().toISOString() };
  db.patients[index] = next;
  await dataStore.write(db);
  return res.json({ patient: next });
}));

app.delete('/api/patients/:id', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const patient = db.patients.find((item) => item.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
  await dataStore.write({
    ...db,
    patients: db.patients.filter((item) => item.id !== req.params.id),
    sessions: db.sessions.filter((item) => item.patientId !== req.params.id),
    appointments: db.appointments.filter((item) => item.patientId !== req.params.id),
  });
  return res.json({ success: true });
}));

app.post('/api/sessions', requireAuth, asyncHandler(async (req, res) => {
  const session = { ...req.body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const db = await dataStore.read();
  const patientIndex = db.patients.findIndex((patient) => patient.id === session.patientId);
  if (patientIndex === -1) return res.status(404).json({ error: 'Paciente não encontrado.' });
  const patientWithWeight = applyPatientWeight(db.patients[patientIndex], session.peso);
  db.patients[patientIndex] = { ...patientWithWeight, lastSession: session.createdAt };
  db.sessions.push(session);
  const nextAppointment = createNextSessionAppointment(db, session);
  if (nextAppointment) db.appointments.push(nextAppointment);
  await dataStore.write(db);
  return res.status(201).json({ session, patient: db.patients[patientIndex], nextAppointment });
}));

app.patch('/api/sessions/:id', requireAuth, asyncHandler(async (req, res) => {
  const db = await dataStore.read();
  const index = db.sessions.findIndex((session) => session.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Sessão não encontrada.' });
  const current = db.sessions[index];
  const next = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  const patientIndex = db.patients.findIndex((patient) => patient.id === next.patientId);
  if (patientIndex === -1) return res.status(404).json({ error: 'Paciente não encontrado.' });
  db.sessions[index] = next;
  db.patients[patientIndex] = applyPatientWeight(db.patients[patientIndex], next.peso);
  const nextAppointment = createNextSessionAppointment(db, next);
  if (nextAppointment && !db.appointments.some(appointment => appointment.id === nextAppointment.id)) {
    db.appointments.push(nextAppointment);
  }
  await dataStore.write(db);
  return res.json({ session: next, patient: db.patients[patientIndex], nextAppointment });
}));

app.get('/api/settings/availability', requireAuth, asyncHandler(async (_req, res) => {
  const stored = await dataStore.getSetting('agenda.availability');
  const availability = stored ? normalizeAvailability(typeof stored === 'string' ? JSON.parse(stored) : stored) : DEFAULT_AVAILABILITY;
  return res.json({ availability });
}));

app.put('/api/settings/availability', requireAuth, asyncHandler(async (req, res) => {
  const availability = normalizeAvailability(req.body || {});
  await dataStore.setSetting('agenda.availability', JSON.stringify(availability));
  return res.json({ availability });
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
  res.status(error.statusCode || 500).json({ error: error.message || 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database store: ${dataStore.type}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
