-- Remover políticas existentes da tabela consultores
DROP POLICY IF EXISTS "Consultores são públicos para leitura" ON public.consultores;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar consultores" ON public.consultores;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar consultores" ON public.consultores;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir consultores" ON public.consultores;

-- Recriar políticas como PERMISSIVE (padrão)
CREATE POLICY "Consultores são públicos para leitura" 
ON public.consultores 
FOR SELECT 
USING (true);

CREATE POLICY "Qualquer um pode inserir consultores" 
ON public.consultores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar consultores" 
ON public.consultores 
FOR UPDATE 
USING (true);

CREATE POLICY "Qualquer um pode deletar consultores" 
ON public.consultores 
FOR DELETE 
USING (true);