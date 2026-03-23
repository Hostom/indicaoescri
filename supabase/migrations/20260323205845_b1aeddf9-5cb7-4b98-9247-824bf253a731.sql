
ALTER TABLE public.indicacao_historico ADD COLUMN observacao text;

-- Update trigger to not conflict - we'll keep trigger for auto-insert but frontend will update with observacao after
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.indicacao_historico (indicacao_id, status_anterior, status_novo, alterado_por)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
