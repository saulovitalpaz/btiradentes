# Dashboard Artigos Compactos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposicionar o card de artigos do dashboard e torná-lo compacto por padrão, expandível com links detalhados e busca restrita aos temas veterinários aprovados.

**Architecture:** Manter toda a lógica externa no componente `ClinicalInsights`, usando um estado booleano local para expansão. O `Dashboard` controlará apenas a ordem dos blocos; nenhum endpoint interno ou banco será alterado.

**Tech Stack:** React 19, Vite 6, PubMed E-utilities, CSS existente em `src/components/ClinicalInsights.jsx`.

## Global Constraints

- O card ficará depois de “Sessões Recentes” no desktop e no mobile.
- Recolhido: até quatro títulos, compactos e sem links/metadados.
- Expandido: até quatro artigos completos, cada um clicável para o PubMed em nova aba.
- Query limitada a `veterinary physiotherapy`, `veterinary acupuncture` e `veterinary neurology`.
- Não alterar PostgreSQL, autenticação ou API interna.
- Validar somente com `npm run lint`, `npm run build` e conferências estáticas; não executar a suíte completa de testes.

---

### Task 1: Restringir a consulta PubMed e preparar o estado do card

**Files:**
- Modify: `src/components/ClinicalInsights.jsx`

**Interfaces:**
- Consumes: API E-utilities atual.
- Produces: `articles` com no máximo quatro resultados e `isExpanded` inicializado como `false`.

- [ ] **Step 1: Fixar a query aprovada**
  Substituir a URL de pesquisa por uma URL construída com:
  ```js
  const PUBMED_QUERY = '(veterinary physiotherapy OR veterinary acupuncture OR veterinary neurology)';
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(PUBMED_QUERY)}&retmode=json&retmax=4&sort=date`;
  ```
  Remover o termo genérico `veterinary rehabilitation`.

- [ ] **Step 2: Adicionar estado de expansão**
  No início do componente, manter `articles` e `loading` e adicionar:
  ```js
  const [isExpanded, setIsExpanded] = useState(false);
  ```
  O valor inicial deve continuar recolhido mesmo após a busca concluir.

### Task 2: Renderizar o card compacto e expandível

**Files:**
- Modify: `src/components/ClinicalInsights.jsx`

**Interfaces:**
- Consumes: `articles`, `loading`, `isExpanded`.
- Produces: botão acessível `articles-toggle`, lista compacta recolhida e âncoras detalhadas expandidas.

- [ ] **Step 1: Tornar o cabeçalho acionável**
  Substituir o cabeçalho visual por:
  ```jsx
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
  ```

- [ ] **Step 2: Renderizar o conteúdo por estado**
  Usar `id="clinical-articles-list"` e renderizar:
  ```jsx
  {loading ? (
    <div className="articles-status">Buscando artigos...</div>
  ) : articles.length > 0 ? (
    <div id="clinical-articles-list" className={`articles-list ${isExpanded ? 'expanded' : 'compact'}`}>
      {articles.slice(0, 4).map((article) => {
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
      })}
    </div>
  ) : (
    <p id="clinical-articles-list" className="articles-status">Nenhum artigo encontrado.</p>
  )}
  ```
  Manter a fonte PubMed no rodapé do card.

- [ ] **Step 3: Ajustar os estilos inline do componente**
  Atualizar os estilos para que `.insight-header` alinhe título e botão, `.articles-list.compact` use gap/padding reduzidos e `.articles-list.expanded` preserve os blocos atuais. O botão deve ter contraste, foco visível e não depender de hover. O título compacto deve usar uma linha limitada com `overflow: hidden`, `text-overflow: ellipsis` e `white-space: nowrap`.

### Task 3: Mover o card para o final do dashboard

**Files:**
- Modify: `src/views/Dashboard.jsx`

**Interfaces:**
- Consumes: componente `ClinicalInsights` sem novas props.
- Produces: ordem visual aprovada em desktop e mobile.

- [ ] **Step 1: Reordenar o mobile**
  Mover a seção:
  ```jsx
  <section className="mobile-section">
    <ClinicalInsights />
  </section>
  ```
  para depois da seção de “Sessões Recentes”, deixando a ordem Nova Sessão, Próximos Agendamentos, Sessões Recentes e Artigos.

- [ ] **Step 2: Reordenar o desktop**
  Remover `<div className="insights-panel"><ClinicalInsights /></div>` de dentro de `.quick-actions` e adicionar um bloco após `.quick-actions` no `main-grid`:
  ```jsx
  <div className="dashboard-insights">
    <ClinicalInsights />
  </div>
  ```
  O bloco deve ocupar a largura do grid e ficar abaixo das operações e ações rápidas; ajustar o CSS somente se necessário para `.dashboard-insights { min-width: 0; grid-column: 1 / -1; }`.

### Task 4: Validar e publicar

**Files:**
- Verify: `src/components/ClinicalInsights.jsx`
- Verify: `src/views/Dashboard.jsx`
- Verify: `src/App.css`

**Interfaces:**
- Consumes: Tasks 1–3 concluídas.
- Produces: commit publicado em `origin/main` e deploy iniciado no serviço Railway `BTiradentes fisiovet`.

- [ ] **Step 1: Conferir a implementação sem testes completos**
  ```powershell
  rg -n "veterinary rehabilitation|veterinary physiotherapy|veterinary acupuncture|veterinary neurology|aria-expanded|clinical-articles-list|ClinicalInsights" src/components/ClinicalInsights.jsx src/views/Dashboard.jsx
  git diff --check
  ```
  Expected: não aparece `veterinary rehabilitation`; aparecem os três termos aprovados, os atributos de expansão e o componente nas duas posições finais.

- [ ] **Step 2: Rodar lint e build**
  ```powershell
  npm run lint
  npm run build
  ```
  Expected: ambos terminam com exit code `0`.

- [ ] **Step 3: Commit e push**
  ```powershell
  git add -- 'docs/superpowers/plans/2026-09-14-dashboard-artigos.md' 'src/components/ClinicalInsights.jsx' 'src/views/Dashboard.jsx'
  git commit -m "feat: compact dashboard article card"
  git push origin main
  ```
  Expected: commit criado e branch remota `main` atualizada.

- [ ] **Step 4: Iniciar deploy Railway**
  ```powershell
  railway up --service "BTiradentes fisiovet"
  ```
  Expected: upload aceito pelo serviço correto e deployment iniciado.

