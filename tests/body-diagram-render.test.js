import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/BodyDiagram.jsx', import.meta.url), 'utf8');

test('renders image hotspots instead of geometric body paths', () => {
  assert.doesNotMatch(source, /<path\b/);
  assert.doesNotMatch(source, /anatomy\.zones/);
  assert.match(source, /body-diagram-hotspots/);
  assert.doesNotMatch(source, /handleZoneKeyDown/);
});
