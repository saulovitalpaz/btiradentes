const ACTIVE_APPOINTMENT_STATUSES = new Set(['Agendado', 'Confirmado']);

export const DEFAULT_AVAILABILITY = {
  intervalMinutes: 30,
  days: {
    monday: { enabled: true, start: '08:00', end: '18:00' },
    tuesday: { enabled: true, start: '08:00', end: '18:00' },
    wednesday: { enabled: true, start: '08:00', end: '18:00' },
    thursday: { enabled: true, start: '08:00', end: '18:00' },
    friday: { enabled: true, start: '08:00', end: '18:00' },
    saturday: { enabled: false, start: '08:00', end: '12:00' },
    sunday: { enabled: false, start: '08:00', end: '12:00' },
  },
};

const toDateOnly = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const hasAppointmentConflict = (appointment, existing = [], ignoredId = null) => existing.some((item) => (
  item.id !== ignoredId &&
  item.date === appointment.date &&
  item.time === appointment.time &&
  ACTIVE_APPOINTMENT_STATUSES.has(item.status || 'Agendado')
));

export const buildRecurringAppointments = ({ appointment, total, pattern = 'weekly', existing = [], idFactory = () => Date.now().toString() }) => {
  const count = Math.max(1, Number(total) || 1);
  const step = pattern === 'fortnightly' ? 14 : 7;
  const recurrenceGroupId = `series-${idFactory()}`;
  const created = [];
  const conflicts = [];

  for (let index = 0; index < count; index += 1) {
    const date = toDateOnly(appointment.date);
    date.setDate(date.getDate() + (index * step));
    const occurrence = {
      ...appointment,
      id: idFactory(),
      date: toDateString(date),
      recurrenceGroupId,
      recurrenceIndex: index + 1,
      recurrenceTotal: count,
      recurrencePattern: pattern,
      createdAt: new Date().toISOString(),
    };

    if (hasAppointmentConflict(occurrence, [...existing, ...created])) {
      conflicts.push({ date: occurrence.date, time: occurrence.time, reason: 'Horário ocupado' });
    } else {
      created.push(occurrence);
    }
  }

  return { created, conflicts };
};

export const applyPatientWeight = (patient, weight) => {
  if (weight === '' || weight === null || weight === undefined) return patient;
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) throw new Error('O peso deve ser um número maior que zero.');
  return { ...patient, weight: numericWeight };
};

export const normalizeAvailability = (availability = {}) => ({
  intervalMinutes: 30,
  days: Object.fromEntries(Object.entries(DEFAULT_AVAILABILITY.days).map(([day, fallback]) => ([
    day,
    { ...fallback, ...(availability.days?.[day] || {}) },
  ]))),
});
