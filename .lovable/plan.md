

# Plano de Implementacao - 8 Melhorias

## Visao Geral

Implementar 8 melhorias no sistema de indicacoes, organizadas por complexidade e dependencia.

---

## 1. Mascara de Telefone (Feature 8)
**Escopo**: Adicionar mascara `(00) 00000-0000` no campo de telefone do formulario publico.

- Criar funcao utilitaria `formatPhone` em `src/lib/utils.ts`
- Aplicar mascara no `onChange` do campo `tel_cliente` em `Index.tsx`
- Sem alteracoes no banco de dados

---

## 2. Dark Mode (Feature 10)
**Escopo**: Toggle de tema claro/escuro persistido no `localStorage`.

- Criar `ThemeProvider` context com toggle claro/escuro
- Adicionar botao de toggle no header do Dashboard e do formulario
- Usar a classe `.dark` ja definida no `index.css`
- Persistir preferencia no `localStorage`

---

## 3. Filtros Avancados no Dashboard (Feature 3)
**Escopo**: Adicionar filtros por periodo, consultor, cidade e status na aba Indicacoes.

- Adicionar barra de filtros no `IndicacoesTab` com: data inicio/fim, consultor, cidade, status
- Filtrar dados localmente (ja carregados em memoria)
- Botao "Limpar Filtros"

---

## 4. Historico/Timeline de Status (Feature 2)
**Escopo**: Registrar e exibir historico de mudancas de status por indicacao.

**Banco de dados** (migration):
- Criar tabela `indicacao_historico` com colunas: `id`, `indicacao_id` (FK), `status_anterior`, `status_novo`, `alterado_por`, `created_at`
- RLS: admins podem SELECT/INSERT
- Trigger para inserir automaticamente ao alterar status na tabela `indicacoes`

**Frontend**:
- Modal de timeline acessivel por botao na tabela de indicacoes
- Exibir lista cronologica de mudancas com data e usuario

---

## 5. Notificacoes em Tempo Real (Feature 1)
**Escopo**: Notificar no dashboard quando novas indicacoes sao criadas.

**Banco de dados**:
- Habilitar Realtime na tabela `indicacoes` via migration

**Frontend**:
- Usar `supabase.channel()` no Dashboard para ouvir `INSERT` em `indicacoes`
- Exibir toast de notificacao com dados da nova indicacao
- Atualizar lista automaticamente

---

## 6. Exportacao Excel/CSV (Feature 5)
**Escopo**: Adicionar exportacao Excel (XLSX) alem do CSV/PDF ja existente.

- Instalar `xlsx` (SheetJS)
- Adicionar botao "Exportar Excel" no `RelatoriosTab`
- Exportar dados filtrados com formatacao basica

---

## 7. Metricas de Conversao e Ranking (Feature 6)
**Escopo**: Melhorar analytics com metricas de conversao e ranking detalhado.

- Adicionar ao `AnalyticsCharts`: taxa de conversao por consultor (grafico de barras horizontal), tempo medio de atendimento, comparativo mensal
- Exibir ranking com barras de progresso visuais
- KPIs adicionais: tempo medio pendente, melhor consultor do mes

---

## 8. Alertas de SLA (Feature 7)
**Escopo**: Alertar quando indicacoes ficam pendentes por muito tempo.

**Frontend**:
- Definir SLA padrao (ex: 48h para primeiro atendimento)
- Destacar indicacoes vencidas com icone/cor na tabela
- Adicionar card de alerta no topo do dashboard com contagem de indicacoes em atraso
- Badge de alerta na aba Indicacoes

---

## Ordem de Implementacao

Dada a quantidade de mudancas, recomendo implementar em 2-3 rodadas:

**Rodada 1** (sem banco): Mascara telefone, Dark mode, Filtros avancados, Exportacao Excel
**Rodada 2** (com banco): Historico/Timeline, Notificacoes Realtime
**Rodada 3** (frontend): Metricas de conversao, Alertas SLA

## Detalhes Tecnicos

- Migration SQL para `indicacao_historico` com trigger `AFTER UPDATE` na tabela `indicacoes`
- Realtime habilitado via `ALTER PUBLICATION supabase_realtime ADD TABLE indicacoes`
- SheetJS (`xlsx`) para exportacao Excel
- Context API para ThemeProvider
- Todas as features usam dados ja carregados, sem queries extras (exceto historico)

