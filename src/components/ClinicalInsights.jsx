import React, { useEffect, useState } from 'react';

const PUBMED_QUERY = '(veterinary physiotherapy OR veterinary acupuncture OR veterinary neurology)';

const ClinicalInsights = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchPubMed = async () => {
      try {
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(PUBMED_QUERY)}&retmode=json&retmax=4&sort=date`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const ids = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) return;

        const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        const results = ids
          .map((id) => {
            const item = detailsData.result?.[id];
            if (!item) return null;

            return {
              id,
              title: item.title,
              journal: item.source,
              date: item.pubdate?.substring(0, 4) || '—',
            };
          })
          .filter(Boolean);

        setArticles(results);
      } catch (error) {
        console.error('Falha ao buscar artigos no PubMed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPubMed();
  }, []);

  return (
    <div className="insight-card dynamic-insight">
      <div className="insight-header">
        <div className="insight-title">
          <span className="material-symbols-outlined insight-icon">science</span>
          <span>Artigos veterinários</span>
        </div>
        <button
          type="button"
          className="articles-toggle"
          aria-expanded={isExpanded}
          aria-controls="clinical-articles-list"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span>{isExpanded ? 'Ocultar artigos' : 'Ver artigos'}</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      <p className="insight-description">
        Pesquisas recentes sobre fisioterapia, acupuntura e neurologia veterinária.
      </p>

      <div
        id="clinical-articles-list"
        className={`articles-list ${isExpanded ? 'expanded' : 'compact'}`}
      >
        {loading ? (
          <div className="articles-status">Buscando artigos...</div>
        ) : articles.length > 0 ? (
          articles.slice(0, 4).map((article) => {
            const content = (
              <>
                <h5 className="article-title">{article.title}</h5>
                {isExpanded && (
                  <span className="article-meta">{article.journal} • {article.date}</span>
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
                {content}
              </a>
            ) : (
              <div key={article.id} className="article-compact">
                {content}
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
          FONTE: PUBMED API (E-UTILITIES)
        </span>
      </div>

      <style jsx>{`
        .dynamic-insight {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .insight-header {
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .insight-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .articles-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          padding: 6px 8px;
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-full);
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .articles-toggle:hover {
          background: var(--surface-container-low);
        }

        .articles-toggle:focus-visible {
          outline: 3px solid rgba(109, 94, 0, 0.22);
          outline-offset: 2px;
        }

        .insight-description {
          margin-bottom: 12px;
          color: var(--on-surface-variant);
          font-size: 0.76rem;
          line-height: 1.4;
        }

        .articles-list {
          display: flex;
          flex-direction: column;
        }

        .articles-list.compact {
          gap: 4px;
        }

        .articles-list.expanded {
          gap: 10px;
          margin-bottom: 16px;
        }

        .article-compact,
        .article-link {
          min-width: 0;
          padding: 8px 10px;
          border-radius: var(--radius-default);
          background-color: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
        }

        .article-compact {
          padding-block: 5px;
          border-color: transparent;
          background: transparent;
        }

        .article-link {
          display: block;
          color: inherit;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .article-link:hover {
          background-color: var(--surface-container-low);
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(109, 94, 0, 0.05);
        }

        .article-title {
          overflow: hidden;
          color: var(--on-surface);
          font-size: 0.82rem;
          line-height: 1.35;
          text-overflow: ellipsis;
        }

        .articles-list.compact .article-title {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 0.76rem;
          font-weight: 600;
        }

        .article-meta {
          display: block;
          margin-top: 6px;
          color: var(--primary);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .articles-status {
          padding: 8px 0;
          color: var(--on-surface-variant);
          font-size: 0.78rem;
          text-align: center;
        }

        .insight-footer {
          margin-top: auto;
        }

        .source {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 520px) {
          .insight-header {
            align-items: flex-start;
          }

          .articles-toggle {
            font-size: 0.62rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ClinicalInsights;
