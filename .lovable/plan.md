

# Plano de Melhorias UI/UX

## Melhorias a implementar

### 1. Tooltips nos botoes de acao da tabela
Os icones de Transferir, Historico e Excluir nao tem texto visivel. Adicionar `Tooltip` do Radix em cada botao para que ao passar o mouse apareca a descricao da acao.

- Arquivo: `IndicacoesTab.tsx`
- Envolver cada botao de acao com `Tooltip` + `TooltipTrigger` + `TooltipContent`
- Adicionar `TooltipProvider` no componente

### 2. Zebra striping na tabela
Alternar cor de fundo nas linhas para facilitar leitura.

- Arquivo: `IndicacoesTab.tsx`
- Adicionar classe condicional `even:bg-muted/20` nas `TableRow`

### 3. Skeleton loading no conteudo das tabs
Quando `loading` esta ativo, mostrar skeletons ao inves de conteudo vazio.

- Arquivo: `Dashboard.tsx`
- Passar prop `loading` para as tabs
- Renderizar `Skeleton` placeholders dentro de `IndicacoesTab` quando carregando

### 4. Animacao count-up nos StatsCards
Animar os numeros dos cards de estatisticas de 0 ate o valor real.

- Criar hook `useCountUp(target, duration)` em `src/hooks/use-count-up.ts`
- Usar no `Dashboard.tsx` nos valores dos `StatsCard`

### 5. Empty states ilustrados para filtros sem resultado
Melhorar o `EmptyState` quando filtros ativos nao retornam dados, com icone contextual e botao para limpar filtros.

- Arquivo: `IndicacoesTab.tsx`
- Passar callback `clearFilters` para o `EmptyState` quando ha filtros ativos

### 6. Formulario publico - validacao inline
Adicionar feedback visual em tempo real nos campos obrigatorios (borda verde/vermelha apos interacao).

- Arquivo: `Index.tsx`
- Rastrear campos "tocados" via estado
- Aplicar classes condicionais `border-success` / `border-destructive` nos inputs apos blur

### 7. Responsividade mobile nos StatsCards
Garantir que os cards de estatistica funcionem bem em telas pequenas.

- Arquivo: `Dashboard.tsx`
- Ajustar grid para `grid-cols-2` em mobile e `grid-cols-5` em desktop (incluindo SLA)

## Detalhes tecnicos

- Tooltip: componente ja existe em `src/components/ui/tooltip.tsx`
- Count-up: `requestAnimationFrame` com easing, ~800ms duracao
- Skeleton: componente ja existe em `src/components/ui/skeleton.tsx`
- Validacao inline: estado `touchedFields` com `Set<string>`, logica no `onBlur`
- Nenhuma alteracao no banco de dados

## Arquivos alterados

1. `src/hooks/use-count-up.ts` (novo)
2. `src/pages/Dashboard.tsx`
3. `src/pages/Index.tsx`
4. `src/components/dashboard/IndicacoesTab.tsx`

