import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RemoveAdminRequest {
  userId: string
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
        persistSession: false
      }
    })

    // Verify the requesting user is a director
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if requesting user is a director
    const { data: requestingUserRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || requestingUserRole?.role !== 'DIRETOR') {
      return new Response(JSON.stringify({ error: 'Apenas diretores podem remover administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: RemoveAdminRequest = await req.json()
    const { userId } = body

    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID do usuário não informado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the user_role entry to find the actual auth user id
    const { data: roleData, error: getRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('id', userId)
      .single()

    if (getRoleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Administrador não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prevent self-deletion
    if (roleData.user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Você não pode remover sua própria conta' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete the user role first (cascades from auth.users deletion, but explicit is cleaner)
    const { error: deleteRoleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', userId)

    if (deleteRoleError) {
      throw deleteRoleError
    }

    // Delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(roleData.user_id)

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      // Role already deleted, but user deletion failed - log but don't fail
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error removing admin user:', error)
    return new Response(JSON.stringify({ error: 'Erro ao remover administrador' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})