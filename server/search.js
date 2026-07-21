const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const includesQuery = (query, values) => values.some((value) => normalize(value).includes(query));

export const searchDatabase = (db, rawQuery) => {
  const query = normalize(rawQuery).trim();
  if (!query) return { patients: [], sessions: [], appointments: [] };

  const patients = db.patients || [];
  const sessions = db.sessions || [];
  const appointments = db.appointments || [];
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  const patientResults = patients.filter((patient) => includesQuery(query, [
    patient.name,
    patient.tutor,
    patient.breed,
    patient.species,
    patient.status,
  ]));

  const sessionResults = sessions
    .filter((session) => {
      const patient = patientById.get(session.patientId);
      return includesQuery(query, [
        session.type,
        session.title,
        session.notes,
        session.evolucao,
        ...(session.tags || []),
        patient?.name,
        patient?.tutor,
      ]);
    })
    .map((session) => ({
      ...session,
      patientName: patientById.get(session.patientId)?.name || 'Paciente não encontrado',
    }));

  const appointmentResults = appointments
    .filter((appointment) => {
      const patient = patientById.get(appointment.patientId);
      return includesQuery(query, [
        appointment.reason,
        appointment.status,
        appointment.date,
        appointment.time,
        patient?.name,
        patient?.tutor,
      ]);
    })
    .map((appointment) => ({
      ...appointment,
      patientName: patientById.get(appointment.patientId)?.name || 'Paciente não encontrado',
    }));

  return {
    patients: patientResults.slice(0, 8),
    sessions: sessionResults.slice(0, 6),
    appointments: appointmentResults.slice(0, 6),
  };
};

