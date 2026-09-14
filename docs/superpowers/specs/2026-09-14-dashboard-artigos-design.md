# Dashboard de artigos veterinários — design

## Objetivo

Reduzir a densidade visual inicial do dashboard sem remover informação: o card de artigos será movido para o final do conteúdo e exibirá os mesmos artigos em formato compacto, com detalhes e links liberados após expansão.

## Escopo

- Alterar a ordem do `ClinicalInsights` para depois de “Sessões Recentes” no desktop e no mobile.
- Manter até quatro artigos retornados pela consulta.
- Iniciar o card recolhido.
- No estado recolhido, mostrar os quatro títulos com espaçamento e metadados reduzidos, sem links clicáveis.
- No estado expandido, mostrar cada artigo como bloco clicável para o respectivo PubMed, com periódico e ano.
- Restringir a pesquisa externa aos temas `veterinary physiotherapy`, `veterinary acupuncture` e `veterinary neurology`.
- Não alterar banco PostgreSQL, autenticação ou endpoints internos.

## Abordagem

O estado de expansão ficará dentro do componente `ClinicalInsights`, inicializado como `false`. O card usará um botão de cabeçalho acessível com `aria-expanded` e `aria-controls`. O conteúdo recolhido renderizará a mesma lista de artigos sem detalhes; o conteúdo expandido renderizará âncoras com `target="_blank"` e `rel="noopener noreferrer"`.

A busca continuará usando a API E-utilities do PubMed, com `retmax=4` e uma query única contendo somente os três termos veterinários aprovados. A etapa de detalhes continuará sendo feita apenas quando houver IDs retornados.

## Ordem visual

Desktop:

1. Próximos Atendimentos
2. Sessões Recentes
3. Nova Sessão Rápida
4. Card de Artigos

Mobile:

1. Nova Sessão Rápida
2. Próximos Agendamentos
3. Sessões Recentes
4. Card de Artigos

## Estados e comportamento

- Loading: mensagem compacta no card.
- Sem resultados: mensagem curta, mantendo o card recolhido.
- Recolhido: até quatro títulos, sem periódico/ano e sem navegação.
- Expandido: até quatro itens completos e clicáveis; o botão alterna para “Ocultar artigos”.
- A interação deve funcionar por teclado e não depender de hover.

## Validação

Executar somente `npm run lint` e `npm run build`, além de uma conferência estática da query, da ordem dos blocos e dos atributos de acessibilidade. Não executar a suíte completa de testes.

