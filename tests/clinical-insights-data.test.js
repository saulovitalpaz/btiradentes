import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTICLE_LIMIT,
  PORTUGUESE_ARTICLE_TARGET,
  buildPubMedQueries,
  mapArticleSummary,
  mergeArticleIds,
} from '../src/components/clinicalInsightsData.js';

test('builds approved PubMed queries with a Portuguese priority query', () => {
  const queries = buildPubMedQueries();

  assert.equal(queries.portuguese.retmax, PORTUGUESE_ARTICLE_TARGET);
  assert.match(queries.portuguese.term, /portuguese\[lang\]/);
  assert.match(queries.portuguese.term, /veterinary neurology/);
  assert.match(queries.complementary.term, /veterinary acupuncture/);
  assert.equal(queries.complementary.retmax, ARTICLE_LIMIT);
});

test('merges unique Portuguese-first PubMed ids up to six results', () => {
  const ids = mergeArticleIds(['1', '2', '3', '4'], ['4', '5', '6', '7']);

  assert.deepEqual(ids, ['1', '2', '3', '4', '5', '6']);
});

test('maps PubMed summary data with a visible language label', () => {
  assert.deepEqual(mapArticleSummary('12', {
    title: 'Acupuntura veterinária',
    source: 'Revista Veterinária',
    pubdate: '2025 Apr',
    lang: ['Portuguese'],
  }), {
    id: '12',
    title: 'Acupuntura veterinária',
    journal: 'Revista Veterinária',
    date: '2025',
    language: 'Português',
  });
});
