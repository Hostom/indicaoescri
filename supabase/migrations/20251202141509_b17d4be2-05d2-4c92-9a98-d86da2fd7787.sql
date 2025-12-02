-- Políticas para gerenciamento de administradores (acesso público temporário para simplificar)
CREATE POLICY "Qualquer um pode inserir administradores" ON public.administradores FOR INSERT WITH CHECK (true);
CREATE POLICY "Qualquer um pode atualizar administradores" ON public.administradores FOR UPDATE USING (true);
CREATE POLICY "Qualquer um pode deletar administradores" ON public.administradores FOR DELETE USING (true);