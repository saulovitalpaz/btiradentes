import assert from 'node:assert/strict';
import test from 'node:test';
import { searchDatabase } from '../server/search.js';

const db = {
  patients: [
    { id: 'p1', name: 'Luna', tutor: 'Ana Souza', breed: 'Golden Retriever', species: 'Canino', status: 'Tratamento Ativo' },
    { id: 'p2', name: 'Mingau', tutor: 'Bruno Lima', breed: 'Siamês', species: 'Felino', status: 'Manutenção' },
  ],
  sessions: [
    { id: 's1', patientId: 'p1', type: 'Acupuntura', notes: 'Melhora de mobilidade', createdAt: '2026-07-20T12:00:00.000Z' },
  ],
  appointments: [
    { id: 'a1', patientId: 'p2', reason: 'Avaliação inicial', date: '2026-07-22', time: '09:00' },
  ],
};

test('search finds patients by name, tutor, species and breed', () => {
  const byName = searchDatabase(db, 'luna');
  const byTutor = searchDatabase(db, 'bruno');
  const byBreed = searchDatabase(db, 'golden');

  assert.equal(byName.patients[0].id, 'p1');
  assert.equal(byTutor.patients[0].id, 'p2');
  assert.equal(byBreed.patients[0].id, 'p1');
});

test('search includes related sessions and appointments', () => {
  const sessions = searchDatabase(db, 'mobilidade');
  const appointments = searchDatabase(db, 'avaliação');

  assert.equal(sessions.sessions[0].id, 's1');
  assert.equal(sessions.sessions[0].patientName, 'Luna');
  assert.equal(appointments.appointments[0].id, 'a1');
  assert.equal(appointments.appointments[0].patientName, 'Mingau');
});

test('empty search returns no results', () => {
  const result = searchDatabase(db, '   ');

  assert.deepEqual(result, { patients: [], sessions: [], appointments: [] });
});
