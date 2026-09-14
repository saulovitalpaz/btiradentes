# BTiradentes Portal — PWA e metadata mobile

## Objetivo

Transformar o portal React/Vite existente em uma Progressive Web App instalável em Android e iPhone, usando a identidade visual já presente em `public/logo.png`. A mudança não altera autenticação, banco de dados, rotas clínicas ou respostas da API.

## Abordagem escolhida

Usar arquivos estáticos e um service worker mínimo, sem adicionar dependências de PWA. Essa abordagem preserva o setup atual do Vite, reduz o tamanho da mudança e evita cachear dados clínicos.

## Componentes

- `public/manifest.webmanifest`: nome curto e completo, idioma `pt-BR`, modo `standalone`, orientação `portrait`, cores do tema e ícones Android `192x192`, `512x512` e `maskable`.
- `public/icons/`: derivados do logo atual para Android e iPhone, com dimensões e preenchimento adequados aos respectivos launchers.
- `public/sw.js`: service worker de escopo raiz com cache mínimo de recursos estáticos; requisições de API e dados de pacientes nunca serão persistidos pelo cache.
- `src/main.jsx`: registro do service worker apenas quando o navegador oferecer suporte.
- `index.html`: link para o manifesto, metatags Apple de instalação/status bar, viewport seguro para notch e referências aos ícones.

## Identidade e metadata

O nome exibido será `BTiradentes Portal`, com descrição clínica já usada pelo projeto. A cor de tema continuará alinhada ao dourado existente (`#6d5e00`). O logo atual será a fonte visual, com fundo seguro para ícones quadrados; não será criada uma marca nova.

## Fluxo e segurança

Após o primeiro carregamento, o navegador poderá instalar o app e reutilizar o shell estático. O service worker fará fallback somente para recursos da aplicação; endpoints, uploads, tokens e conteúdo clínico ficarão fora do cache. Atualizações do service worker usarão uma versão de cache explícita para permitir invalidação simples.

## Validação

Para limitar consumo de cota, serão executados somente:

1. `npm run lint`
2. `npm run build`
3. conferência dos arquivos PWA e dos assets gerados no diretório de saída

Não será executada a suíte completa de testes automatizados nesta mudança.

## Fora de escopo

- modo offline completo;
- sincronização ou armazenamento local de prontuários;
- push notifications;
- mudanças de autenticação, backend, banco ou UI clínica.
