const API_URL = '/api/data';
const UPLOAD_URL = '/api/upload';
const AUTH_URL = '/api/auth';
const SEARCH_URL = '/api/search';
const PATIENTS_URL = '/api/patients';
const SESSIONS_URL = '/api/sessions';
const APPOINTMENTS_URL = '/api/appointments';
const AVAILABILITY_URL = '/api/settings/availability';

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
  const result = await requestJson(PATIENTS_URL, {
    method: 'POST',
    body: JSON.stringify(patient),
  });
  return result.patient;
};

export const updatePatient = async (id, updates) => {
  const result = await requestJson(`${PATIENTS_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return result.patient;
};

export const addSession = async (session) => {
  const result = await requestJson(SESSIONS_URL, {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return result;
};

export const updateSession = async (id, updates) => {
  const result = await requestJson(`${SESSIONS_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return result;
};

export const addAppointment = async (appt) => {
  const endpoint = appt.recurrence?.total > 1 ? `${APPOINTMENTS_URL}/series` : APPOINTMENTS_URL;
  return requestJson(endpoint, {
    method: 'POST',
    body: JSON.stringify(appt),
  });
};

export const updateAppointment = async (id, updates) => {
  const result = await requestJson(`${APPOINTMENTS_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return result.appointment;
};

export const deleteAppointment = async (id) => {
  await requestJson(`${APPOINTMENTS_URL}/${id}`, { method: 'DELETE' });
  return true;
};

export const deletePatient = async (id) => {
  await requestJson(`${PATIENTS_URL}/${id}`, { method: 'DELETE' });
  return true;
};

export const fetchAvailability = async () => {
  const result = await requestJson(AVAILABILITY_URL);
  return result.availability;
};

export const saveAvailability = async (availability) => {
  const result = await requestJson(AVAILABILITY_URL, {
    method: 'PUT',
    body: JSON.stringify(availability),
  });
  return result.availability;
};
