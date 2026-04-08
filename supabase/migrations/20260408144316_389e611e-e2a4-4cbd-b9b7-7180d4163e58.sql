-- Create is_indicador function
CREATE OR REPLACE FUNCTION public.is_indicador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'INDICADOR'
  )
$$;

-- RLS: Indicadores can view their own indicacoes
CREATE POLICY "Indicadores can view own indicacoes"
ON public.indicacoes
FOR SELECT
TO authenticated
USING (
  is_indicador(auth.uid()) AND indicador_user_id = auth.uid()
);

-- RLS: Indicadores can view active consultores
CREATE POLICY "Indicadores can view active consultores"
ON public.consultores
FOR SELECT
TO authenticated
USING (
  is_indicador(auth.uid()) AND ativo_na_roleta = true
);