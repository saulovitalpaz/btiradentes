import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTICLE_LIMIT,
  PORTUGUESE_ARTICLE_TARGET,
  buildPubMedQueries,
  mapArticleSummary,
  selectArticlesByLanguage,
} from '../src/components/clinicalInsightsData.js';

test('builds approved PubMed queries with a Portuguese priority query', () => {
  const queries = buildPubMedQueries();

  assert.equal(queries.portuguese.retmax, PORTUGUESE_ARTICLE_TARGET);
  assert.match(queries.portuguese.term, /portuguese\[lang\]/);
  assert.match(queries.portuguese.term, /veterinary neurology/);
  assert.match(queries.complementary.term, /veterinary acupuncture/);
  assert.equal(queries.complementary.retmax, ARTICLE_LIMIT);
});

test('selects three articles per language and keeps the translated display title', () => {
  const articles = [
    ...['1', '2', '3', '4'].map(id => ({ id, language: 'Português' })),
    ...['5', '6', '7', '8'].map(id => ({ id, language: 'Outro idioma' })),
  ];

  assert.deepEqual(selectArticlesByLanguage(articles).map(article => article.id), ['1', '2', '3', '5', '6', '7']);
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
    displayTitle: 'Acupuntura veterinária',
    journal: 'Revista Veterinária',
    date: '2025',
    language: 'Português',
  });
});
