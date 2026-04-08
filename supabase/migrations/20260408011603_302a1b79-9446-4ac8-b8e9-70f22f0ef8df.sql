ALTER TABLE public.indicacoes 
ADD COLUMN origem text NOT NULL DEFAULT 'CORRETOR',
ADD COLUMN condominio text;