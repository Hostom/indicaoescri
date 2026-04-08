# Dashboard do Indicador

## Visão Geral
Criar um painel para corretores, síndicos e zeladores acompanharem suas indicações e comissões.

---

## 1. Banco de Dados

### Adicionar campos de comissão na tabela `indicacoes`:
- `valor_negocio` (numeric) — valor do negócio fechado, preenchido pelo admin
- `percentual_comissao` (numeric, default 5) — percentual da comissão
- `valor_comissao` (numeric, gerado) — calculado automaticamente
- `status_comissao` (text: INDICADO / A_PAGAR / PAGO, default INDICADO)
- `data_pagamento` (timestamp) — data em que a comissão foi paga

### Adicionar novo role `INDICADOR` ao enum `app_role`:
- Permite login separado para quem indica

### RLS para indicadores:
- Indicadores veem apenas suas próprias indicações (filtrado por `nome_corretor` ou `user_id` vinculado)
- Adicionar campo `indicador_user_id` (uuid, nullable) na tabela `indicacoes` para vincular ao usuário logado

### Vincular indicações ao usuário indicador:
- No formulário público, após login do indicador, gravar `indicador_user_id`
- Para indicações existentes, o admin pode vincular manualmente

## 2. Autenticação do Indicador

- Reutilizar o Supabase Auth existente
- Adicionar `INDICADOR` ao enum `app_role`
- Criar tela de login em `/painel` (redireciona para dashboard se logado)
- Admin pode cadastrar indicadores na aba de administração

## 3. Página `/painel` — Dashboard do Indicador

### Cards de KPI:
- **Total de Indicações** (todas)
- **Comissão Prevista** (soma de `valor_comissao` onde status_comissao = INDICADO)
- **A Pagar** (soma onde status_comissao = A_PAGAR)
- **Pago** (soma onde status_comissao = PAGO)

### Gráfico de comissões por mês (últimos 12 meses)

### Tabela de indicações:
- Cliente, Natureza, Cidade, Status da indicação, Valor do negócio, Comissão, Status da comissão, Data

## 4. Painel Admin — Gestão de Comissões

- Na aba de indicações, permitir que o admin informe:
  - Valor do negócio
  - Percentual de comissão
  - Status da comissão (INDICADO → A_PAGAR → PAGO)

## 5. Formulários públicos

- Adicionar link "Acompanhe suas indicações" nos formulários `/` e `/externo`
- Se o indicador estiver logado, vincular automaticamente o `indicador_user_id`

---

## Arquivos a criar/modificar

1. **Migration SQL** — campos de comissão + enum INDICADOR + RLS
2. `src/pages/PainelIndicador.tsx` — Dashboard do indicador
3. `src/pages/PainelLogin.tsx` — Login do indicador
4. `src/App.tsx` — novas rotas
5. `src/components/dashboard/IndicacoesTab.tsx` — gestão de comissão pelo admin
6. `src/lib/supabase-helpers.ts` — funções para indicadores
7. `src/pages/Index.tsx` e `src/pages/Externo.tsx` — link para painel
8. Edge function para cadastro de indicador (se necessário)
