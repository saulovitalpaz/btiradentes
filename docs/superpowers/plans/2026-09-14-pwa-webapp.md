# PWA Webapp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o BTiradentes Portal instalável como PWA em Android e iPhone, com manifesto, ícones, metadata mobile e cache estático seguro.

**Architecture:** Usar os arquivos públicos do Vite e um service worker manual, sem novas dependências. O service worker terá cache versionado apenas para o shell estático; API, uploads e conteúdo clínico ficarão fora do cache.

**Tech Stack:** React 19, Vite 6, JavaScript ES modules, Service Worker API, PNG e Web App Manifest.

## Global Constraints

- Nome exibido: `BTiradentes Portal`.
- Idioma: `pt-BR`; tema: `#6d5e00`.
- Fonte visual: `public/logo.png`; não criar nova marca.
- Não alterar autenticação, banco, endpoints, uploads ou fluxo clínico.
- Não cachear tokens, respostas de API, prontuários ou dados clínicos.
- Não adicionar dependências de PWA.
- Validar somente com lint, build e conferência de artefatos; não executar a suíte completa de testes.

---

### Task 1: Criar assets de ícone

**Files:**
- Source: `public/logo.png`
- Create: `public/icons/icon-180.png`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-512-maskable.png`

**Interfaces:**
- Consumes: logo existente `1781x1541`.
- Produces: PNGs quadrados `180x180`, `192x192`, `512x512` e `512x512`; fundo branco, logo centralizado, maskable com área segura maior.

- [ ] **Step 1: Criar o diretório**
  ```powershell
  New-Item -ItemType Directory -Force -Path 'public/icons' | Out-Null
  ```
  Expected: `public/icons` existe.

- [ ] **Step 2: Renderizar os PNGs com System.Drawing**
  Use um script PowerShell temporário somente para gerar os binários, com `System.Drawing`: carregue `public/logo.png`; para cada par `(180, 0.82)`, `(192, 0.82)`, `(512, 0.82)` e `(512, 0.70)`, crie bitmap quadrado branco, escale o logo mantendo proporção dentro de `size * safeArea`, centralize e salve em PNG nos quatro nomes definidos acima.
  Expected: quatro arquivos PNG quadrados em `public/icons/`, sem dependência adicionada ao projeto.

- [ ] **Step 3: Conferir dimensões**
  ```powershell
  Add-Type -AssemblyName System.Drawing
  Get-ChildItem -LiteralPath 'public/icons' -Filter '*.png' | ForEach-Object {
    $i = [System.Drawing.Image]::FromFile($_.FullName)
    "$($_.Name)=$($i.Width)x$($i.Height)"
    $i.Dispose()
  }
  ```
  Expected: `180x180`, `192x192`, `512x512`, `512x512`.

### Task 2: Adicionar manifesto e metadata mobile

**Files:**
- Create: `public/manifest.webmanifest`
- Modify: `index.html`

**Interfaces:**
- Consumes: ícones de `public/icons/`.
- Produces: manifesto referenciado pelo HTML e configuração de instalação para Android/iPhone.

- [ ] **Step 1: Criar `public/manifest.webmanifest`**
  Escrever JSON válido com os campos:
  ```json
  {
    "name": "BTiradentes Portal",
    "short_name": "BTiradentes",
    "description": "Portal clínico de fisioterapia e acupuntura veterinária.",
    "lang": "pt-BR",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#ffffff",
    "theme_color": "#6d5e00",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
      { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```
  Expected: manifesto válido e alinhado ao escopo aprovado.

- [ ] **Step 2: Atualizar `index.html`**
  Manter SEO/Open Graph existentes, trocar viewport por `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` e adicionar:
  ```html
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="BTiradentes" />
  <meta name="format-detection" content="telephone=no" />
  ```
  Expected: navegadores descobrem o manifesto e iPhone recebe ícone, título e configuração standalone.

### Task 3: Registrar service worker sem cachear dados clínicos

**Files:**
- Create: `public/sw.js`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: escopo raiz `/` e requisições same-origin.
- Produces: registro somente em build de produção; API e uploads sempre fora do cache.

- [ ] **Step 1: Criar `public/sw.js`**
  Implementar cache versionado `btiradentes-shell-v1` com `install` para precachear somente `/`, `/index.html`, `/manifest.webmanifest` e os ícones 192/512; em `activate`, excluir versões antigas com esse prefixo; em `fetch`, responder somente GET same-origin, ignorar `/api/` e `/uploads/`, usar network-first e fallback para cache/index quando a rede falhar.
  Expected: shell pode carregar offline, mas respostas e arquivos clínicos não são armazenados pelo service worker.

- [ ] **Step 2: Registrar em `src/main.jsx`**
  Após `createRoot(...).render(...)`, adicionar:
  ```js
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Falha ao registrar o service worker:', error);
      });
    });
  }
  ```
  Expected: falha de registro não impede o carregamento do app.

### Task 4: Validar, commitar e publicar

**Files:**
- Verify: `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*.png`.
- Verify: `dist/manifest.webmanifest`, `dist/sw.js`, `dist/icons/*.png`.

**Interfaces:**
- Consumes: Tasks 1–3 concluídas.
- Produces: commit de implementação publicado em `origin/main`.

- [ ] **Step 1: Rodar lint**
  ```powershell
  npm run lint
  ```
  Expected: exit code `0`.

- [ ] **Step 2: Rodar build**
  ```powershell
  npm run build
  ```
  Expected: exit code `0` e `dist/` contém manifesto, service worker e ícones.

- [ ] **Step 3: Conferir artefatos PWA**
  ```powershell
  Test-Path 'dist/manifest.webmanifest'
  Test-Path 'dist/sw.js'
  Get-ChildItem -LiteralPath 'dist/icons' -Filter '*.png' | Select-Object -ExpandProperty Name
  ```
  Expected: os dois primeiros resultados são `True` e a lista contém os quatro PNGs.

- [ ] **Step 4: Criar commit**
  ```powershell
  git diff --check
  git add -- 'docs/superpowers/plans/2026-09-14-pwa-webapp.md' 'public/manifest.webmanifest' 'public/sw.js' 'public/icons' 'index.html' 'src/main.jsx'
  git commit -m "feat: add installable PWA metadata"
  ```
  Expected: commit contém somente mudanças da PWA.

- [ ] **Step 5: Publicar na branch solicitada**
  ```powershell
  git push origin main
  ```
  Expected: `origin/main` é atualizado com o commit de implementação.

