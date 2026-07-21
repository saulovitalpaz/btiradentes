const API_URL = '/api/data';
const UPLOAD_URL = '/api/upload';
const AUTH_URL = '/api/auth';
const SEARCH_URL = '/api/search';

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha na requisição');
  return data;
};

export const loginUser = async (email, password) => requestJson(`${AUTH_URL}/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

export const fetchCurrentUser = async () => requestJson(`${AUTH_URL}/me`);

export const logoutUser = async () => requestJson(`${AUTH_URL}/logout`, {
  method: 'POST',
});

export const changePassword = async (currentPassword, newPassword) => requestJson(`${AUTH_URL}/password`, {
  method: 'POST',
  body: JSON.stringify({ currentPassword, newPassword }),
});

export const searchRecords = async (query) => requestJson(`${SEARCH_URL}?q=${encodeURIComponent(query)}`);

// Fetches the entire database state
export const fetchDB = async () => {
  try {
    const data = await requestJson(API_URL);
    // Ensure default structure
    return {
      patients: data.patients || [],
      sessions: data.sessions || [],
      appointments: data.appointments || []
    };
  } catch (error) {
    console.error('API Error:', error);
    return { patients: [], sessions: [], appointments: [] };
  }
};

// Saves the entire database state
export const saveDB = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      credentials: 'same-origin',
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

export const uploadSessionFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Falha ao enviar arquivo');
  }

  return {
    filename: data.filename,
    url: data.url,
    name: file.name,
    type: file.type
  };
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
