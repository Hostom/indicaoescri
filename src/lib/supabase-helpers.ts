import { supabase } from "@/integrations/supabase/client";

export interface Consultor {
  id: string;
  nome: string;
  email: string;
  natureza: string;
  cidade: string;
  ativo_na_roleta: boolean;
  data_ultima_indicacao: string | null;
  created_at: string;
}

export interface Indicacao {
  id: string;
  nome_corretor: string;
  unidade_corretor: string;
  natureza: string;
  cidade: string;
  nome_cliente: string;
  tel_cliente: string;
  descricao_situacao: string | null;
  consultor_id: string | null;
  consultor_nome: string | null;
  status: string;
  created_at: string;
}

export async function getConsultoresAtivos(natureza: string, cidade: string): Promise<Consultor[]> {
  const { data, error } = await supabase
    .from('consultores')
    .select('*')
    .eq('natureza', natureza)
    .eq('cidade', cidade)
    .eq('ativo_na_roleta', true)
    .order('data_ultima_indicacao', { ascending: true, nullsFirst: true });
  
  if (error) throw error;
  return data || [];
}

export async function sortearConsultor(natureza: string, cidade: string): Promise<Consultor | null> {
  const consultores = await getConsultoresAtivos(natureza, cidade);
  
  if (consultores.length === 0) return null;
  
  // Retorna o consultor com a data de indicação mais antiga (roleta)
  return consultores[0];
}

export async function criarIndicacao(dados: {
  natureza: string;
  cidade: string;
  nome_corretor: string;
  unidade_corretor: string;
  nome_cliente: string;
  tel_cliente: string;
  descricao_situacao: string;
}): Promise<{ indicacao: Indicacao; consultor: Consultor }> {
  // Sortear consultor
  const consultor = await sortearConsultor(dados.natureza, dados.cidade);
  
  if (!consultor) {
    throw new Error('Nenhum consultor disponível para esta natureza/cidade');
  }
  
  // Criar indicação
  const { data: indicacao, error: indicacaoError } = await supabase
    .from('indicacoes')
    .insert({
      ...dados,
      consultor_id: consultor.id,
      consultor_nome: consultor.nome,
      status: 'PENDENTE'
    })
    .select()
    .single();
  
  if (indicacaoError) throw indicacaoError;
  
  // Atualizar data da última indicação do consultor
  await supabase
    .from('consultores')
    .update({ data_ultima_indicacao: new Date().toISOString() })
    .eq('id', consultor.id);
  
  return { indicacao, consultor };
}

export async function getIndicacoes(): Promise<Indicacao[]> {
  const { data, error } = await supabase
    .from('indicacoes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getConsultores(): Promise<Consultor[]> {
  const { data, error } = await supabase
    .from('consultores')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data || [];
}

export async function atualizarStatusIndicacao(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('indicacoes')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

export async function toggleConsultorAtivo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase
    .from('consultores')
    .update({ ativo_na_roleta: ativo })
    .eq('id', id);
  
  if (error) throw error;
}

export async function adicionarConsultor(dados: {
  nome: string;
  email: string;
  natureza: string;
  cidade: string;
}): Promise<Consultor> {
  const { data, error } = await supabase
    .from('consultores')
    .insert(dados)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removerConsultor(id: string): Promise<void> {
  const { error } = await supabase
    .from('consultores')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
