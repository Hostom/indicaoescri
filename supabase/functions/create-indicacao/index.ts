import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CreateIndicacaoRequest = {
  natureza: string
  cidade: string
  nome_corretor: string
  unidade_corretor: string
  nome_cliente: string
  tel_cliente: string
  descricao_situacao: string
  origem?: string
  condominio?: string
  indicador_user_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body: CreateIndicacaoRequest = await req.json()

    const required = [
      body?.natureza,
      body?.cidade,
      body?.nome_corretor,
      body?.nome_cliente,
      body?.tel_cliente,
      body?.descricao_situacao,
    ]

    // unidade_corretor is required only for internal (CORRETOR) origin
    const origem = body?.origem || 'CORRETOR'
    if (origem === 'CORRETOR' && (!body?.unidade_corretor || String(body.unidade_corretor).trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (required.some((v) => !v || String(v).trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pick the consultant with the oldest (or null) last indication date.
    const { data: consultor, error: consultorError } = await supabaseAdmin
      .from('consultores')
      .select('*')
      .eq('natureza', body.natureza)
      .eq('cidade', body.cidade)
      .eq('ativo_na_roleta', true)
      .order('data_ultima_indicacao', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle()

    if (consultorError) throw consultorError

    if (!consultor) {
      return new Response(JSON.stringify({ error: 'Nenhum consultor disponível para esta natureza/cidade' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const insertData: Record<string, unknown> = {
      natureza: body.natureza,
      cidade: body.cidade,
      nome_corretor: body.nome_corretor,
      unidade_corretor: body.unidade_corretor || '',
      nome_cliente: body.nome_cliente,
      tel_cliente: body.tel_cliente,
      descricao_situacao: body.descricao_situacao,
      consultor_id: consultor.id,
      consultor_nome: consultor.nome,
      status: 'PENDENTE',
      origem,
      condominio: body.condominio || null,
      indicador_user_id: body.indicador_user_id || null,
    }

    const { data: indicacao, error: indicacaoError } = await supabaseAdmin
      .from('indicacoes')
      .insert(insertData)
      .select('*')
      .single()

    if (indicacaoError) throw indicacaoError

    return new Response(JSON.stringify({ indicacao, consultor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating indicacao:', error)
    return new Response(JSON.stringify({ error: 'Erro ao processar indicação' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
