import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDbShape } from '../server/data-store.js';

test('normalizes missing database collections', () => {
  const normalized = normalizeDbShape({});

  assert.deepEqual(normalized, {
    patients: [],
    sessions: [],
    appointments: [],
  });
});

test('preserves existing database collections', () => {
  const db = {
    patients: [{ id: 'p1' }],
    sessions: [{ id: 's1' }],
    appointments: [{ id: 'a1' }],
  };

  assert.deepEqual(normalizeDbShape(db), db);
});
