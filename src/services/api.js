const API_URL = '/api/data';

// Fetches the entire database state
export const fetchDB = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    // Ensure default structure
    return {
      patients: data.patients || [],
      sessions: data.sessions || [],
      appointments: data.appointments || []
    };
  } catch (error) {
    console.error('API Error:', error);
    return { patients: [], sessions: [] };
  }
};

// Saves the entire database state
export const saveDB = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save data');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false };
  }
};

export const addPatient = async (patient) => {
  const db = await fetchDB();
  const newPatient = {
    ...patient,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  db.patients.push(newPatient);
  await saveDB(db);
  return newPatient;
};

export const addSession = async (session) => {
  const db = await fetchDB();
  const newSession = {
    ...session,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  db.sessions.push(newSession);
  
  // Update patient lastSession date
  const patientIndex = db.patients.findIndex(p => p.id === session.patientId);
  if (patientIndex !== -1) {
    db.patients[patientIndex].lastSession = new Date().toISOString();
  }
  
  await saveDB(db);
  return newSession;
};

export const addAppointment = async (appt) => {
  const db = await fetchDB();
  const newAppt = {
    ...appt,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  db.appointments.push(newAppt);
  await saveDB(db);
  return newAppt;
};

export const updateAppointment = async (id, updates) => {
  const db = await fetchDB();
  const index = db.appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    db.appointments[index] = { ...db.appointments[index], ...updates, updatedAt: new Date().toISOString() };
    await saveDB(db);
    return db.appointments[index];
  }
  return null;
};

export const deleteAppointment = async (id) => {
  const db = await fetchDB();
  db.appointments = db.appointments.filter(a => a.id !== id);
  await saveDB(db);
  return true;
};

export const deletePatient = async (id) => {
  const db = await fetchDB();
  db.patients = db.patients.filter(p => p.id !== id);
  db.sessions = db.sessions.filter(s => s.patientId !== id);
  db.appointments = db.appointments.filter(a => a.patientId !== id);
  await saveDB(db);
  return true;
};
