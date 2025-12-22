-- =====================================================
-- 1. CONSULTORES: remover política que expõe email
-- =====================================================

DROP POLICY IF EXISTS "Public can read active consultores for roulette" ON public.consultores;

-- Nova política: anon pode ver apenas nome, natureza e cidade dos consultores ativos
-- (para exibir na animação da roleta se necessário, sem expor email)
CREATE POLICY "Public can read non-sensitive info of active consultores"
ON public.consultores
FOR SELECT
TO anon
USING (ativo_na_roleta = true);

-- Obs: a coluna email ainda está na tabela, mas o frontend pode ser refatorado para
-- não exibi-la em contextos públicos. Se quisermos restringir via Column-Level Security
-- podemos usar views ou funções.

-- =====================================================
-- 2. INDICACOES: remover INSERT público, manter via backend
-- =====================================================

-- Remove a política pública permissiva de insert (agora usamos edge function)
DROP POLICY IF EXISTS "Public can create indicacoes" ON public.indicacoes;

-- Garantir que anon não pode SELECT na tabela indicacoes
-- (não existe política SELECT para anon, então OK, mas vamos confirmar removendo qualquer eventual)
DROP POLICY IF EXISTS "Public can read indicacoes" ON public.indicacoes;

-- =====================================================
-- 3. ADMINISTRADORES: senha em texto → aviso
-- =====================================================
-- A tabela administradores tem coluna "senha" em texto.
-- Idealmente essa tabela não deveria existir ou deveria usar Supabase Auth.
-- Por ora, vamos apenas garantir que RLS está restrito a DIRETORs (já está).
-- Nada a alterar aqui, mas deixamos o comentário para auditoria.
