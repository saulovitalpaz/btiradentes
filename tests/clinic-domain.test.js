import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AVAILABILITY,
  buildRecurringAppointments,
  applyPatientWeight,
  hasAppointmentConflict,
} from '../server/clinic-domain.js';

test('builds a total-count weekly series including the initial appointment', () => {
  const result = buildRecurringAppointments({
    idFactory: (() => { let n = 0; return () => `a${++n}`; })(),
    appointment: { patientId: 'p1', date: '2026-09-14', time: '09:00', reason: 'Fisioterapia' },
    total: 3,
    pattern: 'weekly',
    existing: [],
  });

  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.created.map(item => item.date), [
    '2026-09-14', '2026-09-21', '2026-09-28',
  ]);
  assert.deepEqual(result.created.map(item => item.recurrenceIndex), [1, 2, 3]);
  assert.equal(new Set(result.created.map(item => item.recurrenceGroupId)).size, 1);
});

test('skips occupied occurrences and reports conflicts without losing free dates', () => {
  const result = buildRecurringAppointments({
    idFactory: (() => { let n = 0; return () => `a${++n}`; })(),
    appointment: { patientId: 'p1', date: '2026-09-14', time: '09:00' },
    total: 3,
    pattern: 'fortnightly',
    existing: [{ patientId: 'p2', date: '2026-09-28', time: '09:00', status: 'Agendado' }],
  });

  assert.deepEqual(result.created.map(item => item.date), ['2026-09-14', '2026-10-12']);
  assert.deepEqual(result.conflicts.map(item => item.date), ['2026-09-28']);
});

test('uses a safe default availability and updates the current patient weight', () => {
  assert.equal(DEFAULT_AVAILABILITY.intervalMinutes, 30);
  assert.equal(DEFAULT_AVAILABILITY.days.monday.enabled, true);
  assert.equal(DEFAULT_AVAILABILITY.days.sunday.enabled, false);

  const patient = applyPatientWeight({ id: 'p1', weight: 10 }, '12.5');
  assert.equal(patient.weight, 12.5);
  assert.equal(applyPatientWeight(patient, ''), patient);
});

test('detects only active appointments at the same date and time', () => {
  assert.equal(hasAppointmentConflict({ date: '2026-09-14', time: '09:00' }, [
    { date: '2026-09-14', time: '09:00', status: 'Agendado' },
  ]), true);
  assert.equal(hasAppointmentConflict({ date: '2026-09-14', time: '09:00' }, [
    { date: '2026-09-14', time: '09:00', status: 'Realizado' },
  ]), false);
});
