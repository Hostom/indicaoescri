-- Add INDICADOR to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'INDICADOR';

-- Add commission fields to indicacoes
ALTER TABLE public.indicacoes
  ADD COLUMN IF NOT EXISTS indicador_user_id uuid,
  ADD COLUMN IF NOT EXISTS valor_negocio numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS percentual_comissao numeric DEFAULT 5,
  ADD COLUMN IF NOT EXISTS valor_comissao numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status_comissao text DEFAULT 'INDICADO',
  ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone DEFAULT NULL;