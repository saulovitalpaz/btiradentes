import assert from 'node:assert/strict';
import test from 'node:test';
import { ANIMAL_SVG_BY_SPECIES, BODY_ZONES, normalizeSpecies } from '../src/components/bodyDiagramData.js';

test('normalizes patient species to the two supported illustrations', () => {
  assert.equal(normalizeSpecies('Felino'), 'felino');
  assert.equal(normalizeSpecies('felino'), 'felino');
  assert.equal(normalizeSpecies('Canino'), 'canino');
  assert.equal(normalizeSpecies('Outro'), 'canino');
  assert.equal(normalizeSpecies(undefined), 'canino');
});

test('keeps every persisted clinical region id available', () => {
  assert.deepEqual(BODY_ZONES.map(zone => zone.id), [
    'head', 'neck', 'thorax', 'lumbar', 'sacrum',
    'front_right', 'front_left', 'rear_right', 'rear_left', 'abdomen',
  ]);
});

test('provides a distinct anatomy map for canine and feline patients', () => {
  assert.ok(ANIMAL_SVG_BY_SPECIES.canino.body.length > 0);
  assert.ok(ANIMAL_SVG_BY_SPECIES.felino.body.length > 0);
  assert.notEqual(ANIMAL_SVG_BY_SPECIES.canino.body, ANIMAL_SVG_BY_SPECIES.felino.body);
});
