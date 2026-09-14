import React, { useEffect, useState } from 'react';
import {
  buildPubMedQueries,
  mapArticleSummary,
  mergeArticleIds,
} from './clinicalInsightsData';

const PUBMED_ENDPOINT = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

const fetchPubMedIds = async ({ term, retmax }) => {
  const params = new URLSearchParams({
    db: 'pubmed',
    term,
    retmode: 'json',
    retmax: String(retmax),
    sort: 'date',
  });
  const response = await fetch(`${PUBMED_ENDPOINT}/esearch.fcgi?${params}`);
  const data = await response.json();
  return data.esearchresult?.idlist || [];
};

const fetchPubMedSummaries = async (ids) => {
  const params = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
  });
  const response = await fetch(`${PUBMED_ENDPOINT}/esummary.fcgi?${params}`);
  return response.json();
};

const ClinicalInsights = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const queries = buildPubMedQueries();
        const [portugueseIds, complementaryIds] = await Promise.all([
          fetchPubMedIds(queries.portuguese),
          fetchPubMedIds(queries.complementary),
        ]);
        const ids = mergeArticleIds(portugueseIds, complementaryIds);
        if (ids.length === 0) return;

        const details = await fetchPubMedSummaries(ids);
        const results = ids
          .map(id => mapArticleSummary(id, details.result?.[id]))
          .filter(Boolean);
        setArticles(results);
      } catch (error) {
        console.error('Falha ao buscar artigos no PubMed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <section className="insight-card dynamic-insight" aria-labelledby="clinical-articles-title">
      <div className="insight-header">
        <div className="insight-title">
          <span className="material-symbols-outlined insight-icon" aria-hidden="true">science</span>
          <div>
            <h3 id="clinical-articles-title">Artigos veterinários</h3>
            <p className="insight-kicker">Atualização clínica selecionada</p>
          </div>
        </div>
        <button
          type="button"
          className="articles-toggle"
          aria-expanded={isExpanded}
          aria-controls="clinical-articles-list"
          onClick={() => setIsExpanded(expanded => !expanded)}
        >
          <span>{isExpanded ? 'Ocultar artigos' : 'Ver artigos'}</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      <p className="insight-description">
        Seis pesquisas sobre fisioterapia, acupuntura e neurologia veterinária.
      </p>

      <div
        id="clinical-articles-list"
        className={`articles-list ${isExpanded ? 'expanded' : 'compact'}`}
        aria-live="polite"
      >
        {loading ? (
          <div className="articles-status">Buscando artigos…</div>
        ) : articles.length > 0 ? (
          articles.map((article, index) => {
            const articleContent = (
              <>
                <span className="article-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div className="article-content">
                  <h4 className="article-title">{article.title}</h4>
                  {isExpanded && (
                    <span className="article-meta">
                      {article.journal} · {article.date}
                    </span>
                  )}
                </div>
                <span className="article-language">{article.language}</span>
                {isExpanded && (
                  <span className="material-symbols-outlined article-external" aria-hidden="true">open_in_new</span>
                )}
              </>
            );

            return isExpanded ? (
              <a
                key={article.id}
                href={`https://pubmed.ncbi.nlm.nih.gov/${article.id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="article-link"
              >
                {articleContent}
              </a>
            ) : (
              <div key={article.id} className="article-compact">
                {articleContent}
              </div>
            );
          })
        ) : (
          <p className="articles-status">Nenhum artigo encontrado.</p>
        )}
      </div>

      <div className="insight-footer">
        <span className="source">
          <span className="material-symbols-outlined" aria-hidden="true">database</span>
          Fonte: PubMed API · E-utilities
        </span>
        {!loading && articles.length > 0 && <span className="article-count">{articles.length} resultados</span>}
      </div>
    </section>
  );
};

export default ClinicalInsights;
