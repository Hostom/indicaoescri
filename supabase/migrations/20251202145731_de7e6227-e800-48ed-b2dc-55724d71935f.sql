-- Remover políticas existentes da tabela indicacoes
DROP POLICY IF EXISTS "Indicações são públicas para leitura" ON public.indicacoes;
DROP POLICY IF EXISTS "Qualquer um pode criar indicação" ON public.indicacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar indicações" ON public.indicacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar indicações" ON public.indicacoes;

-- Recriar políticas como PERMISSIVE (padrão)
CREATE POLICY "Indicações são públicas para leitura" 
ON public.indicacoes 
FOR SELECT 
USING (true);

CREATE POLICY "Qualquer um pode criar indicação" 
ON public.indicacoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar indicações" 
ON public.indicacoes 
FOR UPDATE 
USING (true);

CREATE POLICY "Qualquer um pode deletar indicações" 
ON public.indicacoes 
FOR DELETE 
USING (true);