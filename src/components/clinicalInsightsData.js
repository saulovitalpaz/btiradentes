export const ARTICLE_LIMIT = 6;
export const PORTUGUESE_ARTICLE_TARGET = 3;
export const OTHER_LANGUAGE_ARTICLE_TARGET = 3;

export const PUBMED_TOPIC_QUERY = '(("veterinary physiotherapy"[Title/Abstract] OR "veterinary physical therapy"[Title/Abstract]) OR "veterinary acupuncture"[Title/Abstract] OR "veterinary neurology"[Title/Abstract])';

export const buildPubMedQueries = () => ({
  portuguese: {
    term: `${PUBMED_TOPIC_QUERY} AND portuguese[lang]`,
    retmax: PORTUGUESE_ARTICLE_TARGET,
  },
  complementary: {
    term: `${PUBMED_TOPIC_QUERY} NOT portuguese[lang]`,
    retmax: ARTICLE_LIMIT,
  },
});

export const selectArticlesByLanguage = (articles = []) => {
  const portuguese = articles.filter(article => article.language === 'Português');
  const otherLanguages = articles.filter(article => article.language === 'Outro idioma');
  const selectedPortuguese = portuguese.slice(0, PORTUGUESE_ARTICLE_TARGET);
  const selectedOtherLanguages = otherLanguages.slice(0, OTHER_LANGUAGE_ARTICLE_TARGET);
  const selected = [...selectedPortuguese, ...selectedOtherLanguages];
  const remaining = articles.filter(article => !selected.includes(article));

  return [...selected, ...remaining].slice(0, ARTICLE_LIMIT);
};

export const mergeArticleIds = (portugueseIds = [], complementaryIds = []) => {
  const uniqueIds = [...new Set([...portugueseIds, ...complementaryIds])];
  return uniqueIds.slice(0, ARTICLE_LIMIT);
};

const isPortuguese = (language) => {
  const values = Array.isArray(language) ? language : [language];
  return values.some(value => String(value || '').toLowerCase().includes('portugu'));
};

export const mapArticleSummary = (id, item = {}) => ({
  id,
  title: item.title || 'Título indisponível',
  displayTitle: item.title || 'Título indisponível',
  journal: item.source || 'Periódico não informado',
  date: item.pubdate?.substring(0, 4) || '—',
  language: isPortuguese(item.lang) ? 'Português' : 'Outro idioma',
});
