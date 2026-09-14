import assert from 'node:assert/strict';
import test from 'node:test';
import { ANIMAL_SVG_BY_SPECIES, BODY_ZONE_HOTSPOTS, BODY_ZONES, normalizeSpecies } from '../src/components/bodyDiagramData.js';

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

test('provides current image assets for canine and feline patients', () => {
  assert.match(ANIMAL_SVG_BY_SPECIES.canino.images.lateral, /canine-lateral\.png$/);
  assert.match(ANIMAL_SVG_BY_SPECIES.felino.images.lateral, /feline-lateral\.png$/);
  assert.notEqual(ANIMAL_SVG_BY_SPECIES.canino.images.lateral, ANIMAL_SVG_BY_SPECIES.felino.images.lateral);
});

test('defines direct image hotspots for every region in both views', () => {
  const zoneIds = BODY_ZONES.map(zone => zone.id).sort();

  for (const view of ['lateral', 'superior']) {
    const hotspots = BODY_ZONE_HOTSPOTS[view];
    assert.deepEqual(hotspots.map(hotspot => hotspot.id).sort(), zoneIds);
    for (const hotspot of hotspots) {
      for (const key of ['left', 'top', 'width', 'height']) {
        assert.ok(hotspot[key] >= 0 && hotspot[key] <= 100, `${view}.${hotspot.id}.${key} must be a percentage`);
      }
    }
  }
});
