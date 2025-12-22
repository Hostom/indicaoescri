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

export interface UserRole {
  tipo: 'DIRETOR' | 'GERENTE';
  cidades: string[];
  nome: string;
  user_id: string;
}

// Get current user's role from user_roles table
export async function getUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    tipo: data.role as 'DIRETOR' | 'GERENTE',
    cidades: data.cidades || [],
    nome: data.nome,
    user_id: data.user_id
  };
}

// Check if current user is a director
export async function isDirector(): Promise<boolean> {
  const role = await getUserRole();
  return role?.tipo === 'DIRETOR';
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
  // A escolha do consultor e a criação da indicação acontecem no backend
  // para evitar problemas de RLS no formulário público.
  
  // Criar indicação (via backend function para evitar RLS no formulário público)
  const { data, error: indicacaoError } = await supabase.functions.invoke('create-indicacao', {
    body: dados,
  });

  if (indicacaoError) throw indicacaoError;

  const { indicacao, consultor: consultorFromFn } = (data || {}) as {
    indicacao: Indicacao;
    consultor: Consultor;
  };

  if (!indicacao || !consultorFromFn) {
    throw new Error('Resposta inválida do servidor ao criar indicação');
  }
  
  // Update consultant's last indication date via backend function
  // This uses service role to bypass RLS
  await supabase.functions
    .invoke('update-consultor-indicacao', {
      body: { consultorId: consultorFromFn.id },
    })
    .catch(() => {
      // Non-blocking - don't fail the entire operation
    });
  
  // Enviar email para o consultor (não bloqueia o retorno)
  enviarEmailIndicacao({
    consultorEmail: consultorFromFn.email,
    consultorNome: consultorFromFn.nome,
    nomeCliente: dados.nome_cliente,
    telCliente: dados.tel_cliente,
    nomeCorretor: dados.nome_corretor,
    unidadeCorretor: dados.unidade_corretor,
    natureza: dados.natureza,
    cidade: dados.cidade,
    descricaoSituacao: dados.descricao_situacao,
  }).catch(() => {
    // Silent fail for email
  });

  return { indicacao, consultor: consultorFromFn };
}

async function enviarEmailIndicacao(dados: {
  consultorEmail: string;
  consultorNome: string;
  nomeCliente: string;
  telCliente: string;
  nomeCorretor: string;
  unidadeCorretor: string;
  natureza: string;
  cidade: string;
  descricaoSituacao?: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-indicacao-email', {
    body: dados,
  });
  
  if (error) {
    throw error;
  }
}

export async function getIndicacoes(userRole?: UserRole): Promise<Indicacao[]> {
  let query = supabase
    .from('indicacoes')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Filtrar por cidades se for GERENTE
  if (userRole && userRole.tipo === 'GERENTE' && userRole.cidades.length > 0) {
    query = query.in('cidade', userRole.cidades);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getConsultores(userRole?: UserRole): Promise<Consultor[]> {
  let query = supabase
    .from('consultores')
    .select('*')
    .order('nome');
  
  // Filtrar por cidades se for GERENTE
  if (userRole && userRole.tipo === 'GERENTE' && userRole.cidades.length > 0) {
    query = query.in('cidade', userRole.cidades);
  }
  
  const { data, error } = await query;
  
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

export async function removerIndicacao(id: string): Promise<void> {
  const { error } = await supabase
    .from('indicacoes')
    .delete()
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

// New user management functions using Supabase Auth
export interface AdminUser {
  id: string;
  email: string;
  nome: string;
  role: 'DIRETOR' | 'GERENTE';
  cidades: string[];
  created_at: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('role', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(item => ({
    id: item.id,
    email: '', // Email comes from auth.users, not accessible directly
    nome: item.nome,
    role: item.role as 'DIRETOR' | 'GERENTE',
    cidades: item.cidades || [],
    created_at: item.created_at
  }));
}

export async function createAdminUser(dados: {
  email: string;
  password: string;
  nome: string;
  role: 'DIRETOR' | 'GERENTE';
  cidades: string[];
}): Promise<void> {
  // Create the user via edge function (uses service role)
  const { error } = await supabase.functions.invoke('create-admin-user', {
    body: dados
  });
  
  if (error) throw error;
}

export async function removeAdminUser(userId: string): Promise<void> {
  // Remove via edge function (uses service role)
  const { error } = await supabase.functions.invoke('remove-admin-user', {
    body: { userId }
  });
  
  if (error) throw error;
}