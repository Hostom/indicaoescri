-- Tabela de administradores com senhas e permissões
CREATE TABLE public.administradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  senha TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('DIRETOR', 'GERENTE')),
  cidades TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (necessário para verificar login)
CREATE POLICY "Administradores são públicos para leitura" ON public.administradores FOR SELECT USING (true);

-- Inserir administradores com as senhas especificadas
INSERT INTO public.administradores (nome, senha, tipo, cidades) VALUES
('Diretor Geral', 'Diretoria2025', 'DIRETOR', '{}'),
('Gerente BC/Itajaí', 'Adimbc2025', 'GERENTE', ARRAY['Balneario Camboriu', 'Itajai']),
('Gerente Itapema', 'Itapema2025', 'GERENTE', ARRAY['Itapema']);