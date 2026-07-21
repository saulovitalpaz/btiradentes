import React, { useState, useEffect } from 'react';

const ClinicalInsights = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPubMed = async () => {
      try {
        // Query PubMed for recent articles on veterinary physiotherapy or rehabilitation
        const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=veterinary+physiotherapy+OR+veterinary+rehabilitation&retmode=json&retmax=4&sort=date';
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const ids = searchData.esearchresult.idlist.join(',');

        if (!ids) {
          setLoading(false);
          return;
        }

        // Fetch details for those IDs
        const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        const results = searchData.esearchresult.idlist.map(id => {
          const item = detailsData.result[id];
          return {
            id,
            title: item.title,
            journal: item.source,
            date: item.pubdate.substring(0, 4)
          };
        });

        setArticles(results);
      } catch (err) {
        console.error('Failed to fetch from PubMed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPubMed();
  }, []);

  return (
    <div className="insight-card dynamic-insight">
      <div className="insight-header">
        <span className="material-symbols-outlined insight-icon">science</span>
        <span>Science & Insights</span>
      </div>
      
      <p style={{fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '16px'}}>
        Últimos artigos publicados sobre Fisioterapia e Reabilitação Veterinária:
      </p>

      {loading ? (
        <div style={{padding: '20px 0', textAlign: 'center', opacity: 0.5}}>Buscando no PubMed...</div>
      ) : articles.length > 0 ? (
        <div className="articles-list">
          {articles.map(article => (
            <a 
              key={article.id} 
              href={`https://pubmed.ncbi.nlm.nih.gov/${article.id}/`}
              target="_blank" 
              rel="noopener noreferrer"
              className="article-link"
            >
              <h5 className="article-title">{article.title}</h5>
              <span className="article-meta">{article.journal} • {article.date}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="insight-text">
          "Pacientes que recebem laserterapia de baixa intensidade dentro de 48h após a cirurgia apresentam uma recuperação inicial 30% mais rápida na mobilidade articular."
        </p>
      )}

      <div className="insight-footer">
        <span className="source" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>database</span>
          FONTE: PUBMED API (E-UTILITIES)
        </span>
      </div>

      <style jsx>{`
        .dynamic-insight {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .articles-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .article-link {
          text-decoration: none;
          color: inherit;
          display: block;
          padding: 12px;
          border-radius: var(--radius-default);
          background-color: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          transition: all var(--transition-fast);
        }
        .article-link:hover {
          background-color: var(--surface-container-low);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(109, 94, 0, 0.05);
        }
        .article-title {
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 6px;
          color: var(--on-surface);
        }
        .article-meta {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default ClinicalInsights;
