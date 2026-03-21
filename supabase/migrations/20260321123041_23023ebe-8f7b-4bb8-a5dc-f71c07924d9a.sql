
-- Create status history table
CREATE TABLE public.indicacao_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicacao_id uuid REFERENCES public.indicacoes(id) ON DELETE CASCADE NOT NULL,
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  alterado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indicacao_historico ENABLE ROW LEVEL SECURITY;

-- RLS policies: admins can read and insert
CREATE POLICY "Admins can view historico" ON public.indicacao_historico
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert historico" ON public.indicacao_historico
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Trigger function to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.indicacao_historico (indicacao_id, status_anterior, status_novo, alterado_por)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_indicacao_status_change
  AFTER UPDATE ON public.indicacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();

-- Enable realtime on indicacoes
ALTER PUBLICATION supabase_realtime ADD TABLE public.indicacoes;
