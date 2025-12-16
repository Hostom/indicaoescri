-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create indicacoes" ON public.indicacoes;

-- Create a new PERMISSIVE INSERT policy for public access
CREATE POLICY "Public can create indicacoes" 
ON public.indicacoes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);