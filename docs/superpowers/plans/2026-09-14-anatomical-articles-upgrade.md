# Upgrade de artigos clínicos e diagrama anatômico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar seis artigos veterinários priorizando quatro em português e substituir o diagrama geométrico por SVGs anatômicos canino/felino clicáveis no atendimento.

**Architecture:** Extrair regras puras de seleção de artigos e normalização de espécie para módulos JavaScript pequenos e testáveis. `ClinicalInsights` fará duas buscas PubMed em paralelo e uma consulta de detalhes; `BodyDiagram` usará mapas SVG por espécie, mantendo os IDs de regiões existentes e oferecendo interação SVG e chips.

**Tech Stack:** React 19, Vite 6, JavaScript ES modules, SVG inline, CSS existente, Node test runner.

## Global Constraints

- Não adicionar dependências.
- Manter a busca limitada a fisioterapia veterinária, acupuntura veterinária e neurologia veterinária.
- Exibir no máximo seis artigos únicos, priorizando quatro registros com `portuguese[lang]`.
- Manter os IDs persistidos de `bodyRegions` sem migração.
- Suportar `Canino`, `Felino` e fallback canino.
- Garantir teclado, foco visível, alvos de toque e `prefers-reduced-motion`.
- Evitar `transition: all`.
- Validar com testes pontuais, `npm run lint` e `npm run build`; não executar suítes excessivas.

---

### Task 1: Regras puras para artigos e espécies

**Files:**
- Create: `src/components/clinicalInsightsData.js`
- Create: `src/components/bodyDiagramData.js`
- Create: `tests/clinical-insights-data.test.js`
- Create: `tests/body-diagram-data.test.js`

**Interfaces:**
- `clinicalInsightsData.js` exporta `ARTICLE_LIMIT`, `PORTUGUESE_ARTICLE_TARGET`, `PUBMED_TOPIC_QUERY`, `buildPubMedQueries()`, `mergeArticleIds(portugueseIds, complementaryIds)` e `mapArticleSummary(id, item)`.
- `bodyDiagramData.js` exporta `BODY_ZONES`, `normalizeSpecies(species)` e `ANIMAL_SVG_BY_SPECIES`.

- [ ] **Step 1: Write the failing tests for article selection.**

```js
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
```

- [ ] **Step 2: Run the focused tests and confirm the expected missing-module failure.**

Run: `node --test tests/clinical-insights-data.test.js`

Expected: FAIL because `src/components/clinicalInsightsData.js` does not exist yet.

- [ ] **Step 3: Write the failing tests for species normalization and stable region IDs.**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { BODY_ZONES, normalizeSpecies } from '../src/components/bodyDiagramData.js';

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
```

- [ ] **Step 4: Run the focused species tests and confirm the expected missing-module failure.**

Run: `node --test tests/body-diagram-data.test.js`

Expected: FAIL because `src/components/bodyDiagramData.js` does not exist yet.

- [ ] **Step 5: Implement the article data helpers.**

Create constants for the limit and approved topic expression. Make `buildPubMedQueries()` return `{ portuguese: { term, retmax: 4 }, complementary: { term, retmax: 6 } }`; the Portuguese expression must append `AND portuguese[lang]`, and the complementary expression must append `NOT portuguese[lang]`. Implement `mergeArticleIds()` with insertion order and a `Set`, slicing to six. Implement `mapArticleSummary()` so `lang` arrays containing Portuguese variants become `Português`, all other values become `Outro idioma`, and missing title/journal/date values become readable em dashes.

- [ ] **Step 6: Implement the shared body-zone data and species normalization.**

Create `BODY_ZONES` with the ten existing IDs and labels. Implement `normalizeSpecies()` as a case-insensitive check for `felino`; every other input returns `canino`. Export `ANIMAL_SVG_BY_SPECIES` with `canino` and `felino` keys, each containing the anatomy layer paths and zone path data used by `BodyDiagram`.

- [ ] **Step 7: Run both focused test files and confirm they pass.**

Run: `node --test tests/clinical-insights-data.test.js tests/body-diagram-data.test.js`

Expected: PASS with all focused assertions passing.

- [ ] **Step 8: Commit the pure helper task.**

```bash
git add src/components/clinicalInsightsData.js src/components/bodyDiagramData.js tests/clinical-insights-data.test.js tests/body-diagram-data.test.js
git commit -m "feat: add article and anatomy data helpers"
```

### Task 2: Atualizar o card de artigos

**Files:**
- Modify: `src/components/ClinicalInsights.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes the helpers from Task 1.
- Produces six compact rows when collapsed and six detailed PubMed links when expanded.

- [ ] **Step 1: Change the PubMed effect to fetch the two search queries in parallel.**

Use `Promise.all()` with `buildPubMedQueries()`, request each `esearch.fcgi` URL with its own `retmax`, combine IDs using `mergeArticleIds()`, then make one `esummary.fcgi` request for the combined IDs. Map each summary through `mapArticleSummary()` and set the resulting array. Do not fetch again when `isExpanded` changes.

- [ ] **Step 2: Render all six results in both states.**

Replace `articles.slice(0, 4)` with `articles.map()`. In compact mode render a non-link row with a numeric index, title and language badge. In expanded mode render a semantic `<a>` containing the title, language, journal/year and an external-link icon. Keep `target="_blank"`, `rel="noopener noreferrer"`, and the existing `aria-expanded`/`aria-controls` contract.

- [ ] **Step 3: Replace the inline style block with focused card styles in `src/App.css`.**

Add styles for `.dynamic-insight`, `.articles-list.compact`, `.articles-list.expanded`, `.article-compact`, `.article-link`, `.article-index`, `.article-language`, and `.article-meta`. Use a two-column expanded grid above `720px` and one column below it. Use explicit transitions for background, border-color, box-shadow and transform; add `:focus-visible`, `:active`, and a reduced-motion media query. Keep titles clamped/truncated without causing horizontal overflow.

- [ ] **Step 4: Run the lint check for the card changes.**

Run: `npm run lint`

Expected: exit code 0 with no errors.

- [ ] **Step 5: Commit the article card task.**

```bash
git add src/components/ClinicalInsights.jsx src/App.css
git commit -m "feat: show six prioritized veterinary articles"
```

### Task 3: Implementar os SVGs anatômicos canino e felino

**Files:**
- Modify: `src/components/BodyDiagram.jsx`
- Modify: `src/views/PatientProfile.jsx`

**Interfaces:**
- `BodyDiagram({ selectedZones, onChange, species })` consumes normalized species data and preserves the controlled selection API.
- `PatientProfile` passes `species={patient.species}` and keeps saving the unchanged `bodyRegions` array.

- [ ] **Step 1: Add keyboard interaction before wiring the new SVG.**

Implement a small `handleZoneKeyDown(event, id)` that calls the same toggle action on Enter or Space and calls `preventDefault()` for Space. Use the existing controlled `selectedZones` and `onChange` behavior.

- [ ] **Step 2: Replace geometric paths with the selected species anatomy map.**

Read `normalizeSpecies(species)` and `ANIMAL_SVG_BY_SPECIES[normalizedSpecies]`. Render the anatomy base paths from the map with neutral fills, then render each zone path as an interactive `<g>` with `role="button"`, `tabIndex={0}`, `aria-label={`${zone.label} — ${speciesLabel}`}`, `aria-pressed={selected}`, and click/key handlers. Give the SVG a `<title>` and `aria-labelledby` so the species is announced.

- [ ] **Step 3: Keep chips synchronized and improve their accessible names.**

Reuse `BODY_ZONES` for the chips. Set `aria-pressed` on each chip and retain the selected-regions summary with `aria-live="polite"`. Add a visible species label near the diagram title and rename the form label to `Mapa anatômico — Regiões corporais`.

- [ ] **Step 4: Pass the patient species from the profile.**

Change the `BodyDiagram` usage to `<BodyDiagram species={patient.species} selectedZones={bodyRegions} onChange={setBodyRegions} />`. The existing patient values `Canino` and `Felino` choose their illustrations; legacy/unknown values use the canino fallback.

- [ ] **Step 5: Run focused tests and lint after the anatomy wiring.**

Run: `node --test tests/body-diagram-data.test.js; npm run lint`

Expected: exit code 0 and no lint errors.

- [ ] **Step 6: Commit the anatomy task.**

```bash
git add src/components/BodyDiagram.jsx src/views/PatientProfile.jsx
git commit -m "feat: add species-specific anatomical SVGs"
```

### Task 4: Refinar contornos, profundidade e responsividade

**Files:**
- Modify: `src/App.css`
- Modify: `src/views/Dashboard.jsx`

**Interfaces:**
- Consumes the existing design tokens and class names from Tasks 2 and 3.
- Produces consistent card and diagram states on desktop, mobile, keyboard focus and reduced-motion settings.

- [ ] **Step 1: Style the anatomy surface and selectable zones.**

Give `.body-diagram-wrapper` a solid outline, layered surface, and subtle shadow. Add `.body-diagram-svg` overflow-safe sizing, `.animal-anatomy` neutral fills/strokes, `.body-zone` transparent-but-outlined hit areas, `.body-zone:hover`, `.body-zone:focus`, and `.body-zone.selected` states. Use `vector-effect="non-scaling-stroke"` on SVG strokes and avoid visual dependence on color alone by adding a selected stroke/dash treatment.

- [ ] **Step 2: Make the diagram controls touch-friendly and responsive.**

Set interactive SVG groups to use `touch-action: manipulation` through the SVG container, keep chips at a comfortable minimum height, and reduce only spacing—not readability—below the existing mobile breakpoint. Ensure the anatomy stays within its container without horizontal scrolling.

- [ ] **Step 3: Use semantic buttons for dashboard appointment cards.**

Change the four clickable `.appointment-item` elements in `src/views/Dashboard.jsx` from `<div>` to `<button type="button">`, preserving their child layout, click handlers and per-item visual styles. Add an accessible label identifying whether the action opens the patient's appointment or history. Reset button typography and alignment in CSS, and add a visible `:focus-visible` outline.

- [ ] **Step 4: Run the final targeted verification for styles.**

Run: `npm run lint; npm run build`

Expected: both commands exit 0 and Vite produces `dist` successfully.

- [ ] **Step 5: Commit the visual refinement task.**

```bash
git add src/App.css src/views/Dashboard.jsx
git commit -m "style: refine dashboard cards and anatomy controls"
```

### Task 5: Revisão final, publicação e deploy

**Files:**
- Review: `src/components/ClinicalInsights.jsx`
- Review: `src/components/clinicalInsightsData.js`
- Review: `src/components/BodyDiagram.jsx`
- Review: `src/components/bodyDiagramData.js`
- Review: `src/views/PatientProfile.jsx`
- Review: `src/App.css`

- [ ] **Step 1: Review the complete diff against the approved spec.**

Confirm that the diff contains no unrelated changes, no remaining `slice(0, 4)` in the article card, no `transition: all` in the changed card styles, and no changed persisted region IDs.

- [ ] **Step 2: Run the minimal final verification.**

Run: `npm run lint; npm run build; git status --short`

Expected: lint and build exit 0; only intentionally committed changes are present.

- [ ] **Step 3: Request a code review before publishing.**

Review the final commit range against the pre-feature SHA and fix any critical or important findings before push.

- [ ] **Step 4: Push `main` to `origin`.**

```bash
git push origin main
```

Expected: push completes without rejection.

- [ ] **Step 5: Start the Railway deployment requested by the user.**

```bash
railway up --service "BTiradentes fisiovet"
```

Expected: Railway accepts the upload and starts a deployment for the app service.
