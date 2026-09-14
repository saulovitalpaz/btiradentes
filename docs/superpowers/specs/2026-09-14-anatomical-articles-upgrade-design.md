# Upgrade de artigos clínicos e diagrama anatômico

## Objetivo

Atualizar o card de artigos veterinários para apresentar seis resultados focados nos temas de fisioterapia/acupuntura veterinária e neurologia veterinária, priorizando pelo menos quatro registros em português, e substituir o diagrama geométrico da sessão por um SVG anatômico clicável que muda entre canino e felino conforme a espécie do paciente.

## Escopo aprovado

### Card de artigos

- O card continua na área inferior do dashboard, depois do conteúdo operacional.
- A busca fica restrita aos temas clínicos aprovados:
  - fisioterapia veterinária;
  - acupuntura veterinária;
  - neurologia veterinária.
- A seleção usa duas consultas PubMed no mesmo ciclo de carregamento:
  - uma consulta com `portuguese[lang]` para priorizar quatro artigos em português;
  - uma consulta complementar dos mesmos temas para preencher as duas posições restantes.
- IDs repetidos são removidos antes da consulta de detalhes.
- A interface exibe no máximo seis resultados, sem repetir artigos.
- O modo recolhido mantém os seis resultados visíveis em linhas compactas, com título truncado de forma legível.
- O modo expandido exibe seis cards com título completo, idioma, periódico, ano, tema quando disponível e link direto para o artigo no PubMed.
- Os links abrem em nova aba com `rel="noopener noreferrer"`.
- A expansão é controlada por botão semântico, com `aria-expanded` e `aria-controls`.
- O layout expandido usa duas colunas em telas amplas e uma coluna em telas estreitas.
- Cada card possui estados visuais de repouso, hover, foco visível e ativação, com contornos e sombra discretos.
- A animação respeita `prefers-reduced-motion` e não usa `transition: all`.
- O carregamento e o estado vazio permanecem explícitos e acessíveis.

### Diagrama anatômico

- `BodyDiagram` recebe uma propriedade `species` e normaliza os valores cadastrados `Canino` e `Felino`.
- A versão canina e a felina são SVGs vetoriais próprios, com proporções anatômicas reconhecíveis e sem polígonos geométricos aparentes.
- As duas versões usam a mesma chave de regiões clínicas para preservar os dados salvos nas sessões:
  `head`, `neck`, `thorax`, `lumbar`, `sacrum`, `front_right`, `front_left`, `rear_right`, `rear_left`, `abdomen`.
- Cada região selecionável é um grupo SVG com `role="button"`, `tabIndex="0"`, `aria-label` e `aria-pressed`.
- Clique, toque, Enter e Espaço alternam a região.
- Os chips de legenda continuam sendo botões nativos e oferecem o mesmo controle do SVG.
- O SVG informa a espécie no nome acessível e exibe um rótulo visual curto (`Canino` ou `Felino`).
- O componente mantém um fallback canino para registros antigos, ausentes ou com espécie diferente de felino.
- A seleção é controlada pelo `PatientProfile`, que passa `patient.species` e mantém `bodyRegions` inalterado.
- A legenda e o resumo de regiões selecionadas permanecem legíveis em mobile.

## Direção visual

- Usar a paleta existente do projeto, com preenchimento neutro para o corpo e cor primária para regiões selecionadas.
- Dar prioridade a contraste, contornos claros e hierarquia de informação sobre efeitos decorativos.
- Usar uma superfície elevada sutil para o painel e os cards internos, sem excesso de sombras.
- Manter alvos de toque confortáveis e foco visível em controles e regiões.
- Evitar ícones em emoji e preservar os ícones Material existentes com `aria-hidden` quando decorativos.

## Compatibilidade e desempenho

- Não adicionar dependências.
- Reutilizar o endpoint PubMed já usado pelo componente.
- Fazer as duas buscas PubMed em paralelo e uma única consulta de detalhes para evitar cascatas desnecessárias.
- O componente não deve fazer novas requisições ao alternar entre recolhido e expandido.
- Não alterar o formato persistido de `bodyRegions` nem exigir migração de banco.
- A validação automatizada será limitada a lint e build, além de uma verificação pontual do comportamento novo, para respeitar a cota solicitada.

## Critérios de aceite

1. O dashboard tenta renderizar seis artigos únicos e o card mostra os seis quando a API fornece resultados suficientes.
2. A seleção da busca prioriza até quatro artigos com idioma português e completa com resultados dos três temas aprovados.
3. No estado recolhido, todos os seis artigos aparecem compactados; no expandido, os seis possuem detalhes e link individual.
4. O card não apresenta transição global e mantém foco visível em seu botão e links.
5. O perfil de paciente canino mostra o SVG canino; o perfil felino mostra o SVG felino; registros desconhecidos usam o fallback canino.
6. Todas as regiões clínicas continuam selecionáveis por mouse/toque, teclado e chips.
7. O `bodyRegions` salvo continua usando os IDs existentes.
8. `npm run lint` e `npm run build` concluem sem erro.
