# Dashboard de artigos: proporção de idiomas, tradução e atualização diária

## Objetivo

Exibir seis artigos no dashboard, priorizando uma composição de três artigos em português e três em outros idiomas. Para artigos não portugueses, o título apresentado no card será traduzido para português, enquanto a etiqueta `Outro idioma` continuará informando o idioma original.

## Comportamento

- Buscar seis artigos recentes do PubMed sobre fisioterapia, acupuntura e neurologia veterinária.
- Buscar separadamente artigos em português e artigos que não sejam em português.
- Compor a lista com até três artigos portugueses e até três não portugueses.
- Se uma categoria tiver menos de três resultados, completar com a outra categoria até seis artigos, sem duplicatas.
- Usar `title` como título original e `displayTitle` como título apresentado.
- Para artigos não portugueses, traduzir `title` para português antes de exibir. Se a tradução não estiver disponível ou falhar, exibir o título original.
- Exibir a etiqueta `Português` ou `Outro idioma`, independentemente do título traduzido.
- Buscar ao montar o componente e novamente na próxima virada de dia local do navegador, mantendo o dashboard aberto atualizado.
- Não persistir artigos nem traduções em localStorage ou no service worker.

## Arquitetura

As regras puras de composição e normalização ficarão em `clinicalInsightsData.js`. O componente `ClinicalInsights` continuará responsável por consultar o PubMed, solicitar traduções para títulos não portugueses e controlar o timer diário. A tradução será encapsulada em uma função de serviço pequena, com fallback individual por artigo para não impedir a exibição dos demais resultados.

## Testes

- consultas solicitam três artigos por idioma;
- composição resulta em três portugueses e três de outro idioma quando há resultados suficientes;
- composição completa a lista quando uma categoria tem poucos resultados e remove duplicatas;
- resumo mantém a tag `Outro idioma` e separa título original do título exibido;
- falha de tradução preserva o título original;
- lint, build e suíte de testes passam após a alteração.

