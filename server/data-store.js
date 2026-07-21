import fs from 'node:fs';
import { Pool } from 'pg';

export const normalizeDbShape = (db = {}) => ({
  patients: Array.isArray(db.patients) ? db.patients : [],
  sessions: Array.isArray(db.sessions) ? db.sessions : [],
  appointments: Array.isArray(db.appointments) ? db.appointments : [],
});

export const createDataStore = ({ databaseUrl, fallbackFile }) => {
  if (databaseUrl) return createPostgresStore(databaseUrl);
  return createJsonFileStore(fallbackFile);
};

const createJsonFileStore = (file) => ({
  type: 'json-file',
  async init() {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(normalizeDbShape(), null, 2));
    }
  },
  async read() {
    return normalizeDbShape(JSON.parse(fs.readFileSync(file, 'utf8')));
  },
  async write(db) {
    fs.writeFileSync(file, JSON.stringify(normalizeDbShape(db), null, 2));
  },
  async getSetting(key) {
    const db = JSON.parse(fs.readFileSync(file, 'utf8'));
    return db.settings?.[key] || null;
  },
  async setSetting(key, value) {
    const db = JSON.parse(fs.readFileSync(file, 'utf8'));
    db.settings = { ...(db.settings || {}), [key]: value };
    fs.writeFileSync(file, JSON.stringify(db, null, 2));
  },
});

const createPostgresStore = (connectionString) => {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('railway.internal') ? false : { rejectUnauthorized: false },
  });

  return {
    type: 'postgres',
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          patient_id TEXT,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          patient_id TEXT,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS sessions_patient_id_idx ON sessions(patient_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id)');
    },
    async read() {
      const [patients, sessions, appointments] = await Promise.all([
        pool.query('SELECT data FROM patients ORDER BY created_at ASC'),
        pool.query('SELECT data FROM sessions ORDER BY created_at ASC'),
        pool.query('SELECT data FROM appointments ORDER BY created_at ASC'),
      ]);
      return normalizeDbShape({
        patients: patients.rows.map((row) => row.data),
        sessions: sessions.rows.map((row) => row.data),
        appointments: appointments.rows.map((row) => row.data),
      });
    },
    async write(db) {
      const normalized = normalizeDbShape(db);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('TRUNCATE appointments, sessions, patients');
        for (const patient of normalized.patients) {
          await client.query(
            'INSERT INTO patients (id, data, created_at, updated_at) VALUES ($1, $2, COALESCE($3::timestamptz, now()), now())',
            [patient.id, patient, patient.createdAt || null]
          );
        }
        for (const session of normalized.sessions) {
          await client.query(
            'INSERT INTO sessions (id, patient_id, data, created_at, updated_at) VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), now())',
            [session.id, session.patientId || null, session, session.createdAt || null]
          );
        }
        for (const appointment of normalized.appointments) {
          await client.query(
            'INSERT INTO appointments (id, patient_id, data, created_at, updated_at) VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), now())',
            [appointment.id, appointment.patientId || null, appointment, appointment.createdAt || null]
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    async getSetting(key) {
      const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
      return result.rows[0]?.value || null;
    },
    async setSetting(key, value) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, value]
      );
    },
  };
};
