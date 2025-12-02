-- Add policy for public form to read active consultores (needed for roulette selection)
CREATE POLICY "Public can read active consultores for roulette"
ON public.consultores
FOR SELECT
USING (ativo_na_roleta = true);

-- Create edge function-only policy for updating consultant's last indication date
-- This will be done via service role in edge function instead