-- Tabela de consultores
CREATE TABLE public.consultores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  natureza TEXT NOT NULL CHECK (natureza IN ('Locacao', 'Captacao', 'Venda')),
  cidade TEXT NOT NULL,
  ativo_na_roleta BOOLEAN NOT NULL DEFAULT true,
  data_ultima_indicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de indicações
CREATE TABLE public.indicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_corretor TEXT NOT NULL,
  unidade_corretor TEXT NOT NULL,
  natureza TEXT NOT NULL,
  cidade TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  tel_cliente TEXT NOT NULL,
  descricao_situacao TEXT,
  consultor_id UUID REFERENCES public.consultores(id),
  consultor_nome TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM ATENDIMENTO', 'NEGÓCIO FECHADO', 'CANCELADA')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (formulário de indicação precisa acessar consultores)
CREATE POLICY "Consultores são públicos para leitura" ON public.consultores FOR SELECT USING (true);
CREATE POLICY "Indicações são públicas para leitura" ON public.indicacoes FOR SELECT USING (true);

-- Políticas públicas para inserção (qualquer um pode criar indicação)
CREATE POLICY "Qualquer um pode criar indicação" ON public.indicacoes FOR INSERT WITH CHECK (true);

-- Políticas para atualização e exclusão (requer autenticação)
CREATE POLICY "Usuários autenticados podem atualizar indicações" ON public.indicacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar indicações" ON public.indicacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir consultores" ON public.consultores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar consultores" ON public.consultores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar consultores" ON public.consultores FOR DELETE TO authenticated USING (true);

-- Inserir consultores iniciais
INSERT INTO public.consultores (nome, email, natureza, cidade, ativo_na_roleta) VALUES
('Israel Fogaça', 'isreal@adimimoveis.com.br', 'Locacao', 'Balneario Camboriu', true),
('Matheus Giacomini', 'matheus@adimimoveis.com.br', 'Locacao', 'Balneario Camboriu', true),
('Bruna Kleis', 'brunakleis@adimimoveis.com.br', 'Locacao', 'Balneario Camboriu', true),
('Stephanie Maron', 'stephanie@adimimoveis.com.br', 'Locacao', 'Balneario Camboriu', true),
('Kerolin Valles', 'kerolin@adimimoveis.com.br', 'Locacao', 'Balneario Camboriu', true),
('Michele Oliveira', 'michele@adimimoveis.com.br', 'Captacao', 'Balneario Camboriu', true),
('Morgana Barreto', 'morgana@adimimoveis.com.br', 'Captacao', 'Balneario Camboriu', true);