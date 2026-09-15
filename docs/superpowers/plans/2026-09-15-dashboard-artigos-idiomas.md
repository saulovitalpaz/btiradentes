# Dashboard Article Language Mix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir seis artigos atuais no dashboard como três em português e três em outro idioma quando houver resultados, traduzindo apenas os títulos não portugueses e atualizando diariamente.

**Architecture:** Manter seleção e normalização puras em `clinicalInsightsData.js`; manter tradução, busca e timer diário em `ClinicalInsights.jsx`. Falhas de tradução usam o título original.

**Tech Stack:** React 19, Vite 6, Node test runner, PubMed E-utilities.

## Global Constraints

- Evitar chamadas externas desnecessárias: no máximo três traduções por atualização diária.
- Manter a tag `Outro idioma` nos artigos não portugueses.
- Atualizar ao montar e na próxima meia-noite local, sem cache persistente.
- Preservar expansão e links atuais.

---

### Task 1: Ajustar seleção e metadata

**Files:** Modify `src/components/clinicalInsightsData.js`; Test `tests/clinical-insights-data.test.js`.

- [ ] Adicionar um teste focado na composição 3+3 e no `displayTitle`.
- [ ] Rodar o teste para confirmar a falha.
- [ ] Implementar os ajustes mínimos.
- [ ] Rodar o teste focado.

### Task 2: Implementar tradução e atualização diária

**Files:** Modify `src/components/ClinicalInsights.jsx`.

- [ ] Traduzir somente títulos não portugueses, com fallback individual.
- [ ] Atualizar a busca na próxima virada de dia e limpar o timer.
- [ ] Renderizar `displayTitle`.
- [ ] Rodar lint e build.

### Task 3: Verificação e entrega

- [ ] Rodar teste focado, lint, build e `git diff --check`.
- [ ] Criar commit, fazer push para `origin main` e executar `railway up --service "BTiradentes fisiovet"`.

