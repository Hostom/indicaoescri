import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { email, password, nome } = await req.json()

    if (!email || !password || !nome) {
      return new Response(JSON.stringify({ error: 'Preencha todos os campos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof nome !== 'string' || nome.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Nome deve ter pelo menos 2 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email === email.trim().toLowerCase()
    )

    if (existingUser) {
      // Check if they already have a role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (existingRole) {
        return new Response(JSON.stringify({ error: 'Este email já está cadastrado. Tente fazer login.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // User exists but has no role - assign INDICADOR
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: existingUser.id,
          role: 'INDICADOR',
          nome: nome.trim(),
          cidades: [],
        })

      if (insertError) throw insertError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create new user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (createError) throw createError

    // Assign INDICADOR role
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'INDICADOR',
        nome: nome.trim(),
        cidades: [],
      })

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw insertError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error registering indicador:', error)
    return new Response(JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
