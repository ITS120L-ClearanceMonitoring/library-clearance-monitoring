import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!userId) {
      throw new Error('Missing required field: userId')
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing authorization header'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Initialize Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server configuration error')
    }

    // Verify the requester is a LIBRARY_ADMIN using the token
    try {
      const token = authHeader.replace('Bearer ', '')
      const supabaseClient = createClient(supabaseUrl, anonKey || '')
      
      // Get user from token
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      if (userError || !user) {
        return new Response(JSON.stringify({ 
          error: 'Invalid or expired token'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      // Get admin client for database operations
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

      // Check if requester is LIBRARY_ADMIN
      const { data: requesterData, error: requesterError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (requesterError || !requesterData || requesterData.role !== 'LIBRARY_ADMIN') {
        return new Response(JSON.stringify({ 
          error: 'Only LIBRARY_ADMIN users can delete users'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        })
      }

      // Step 1: Delete audit trail records for this user (foreign key constraint)
      const { error: deleteAuditError } = await supabaseAdmin
        .from('audit_trail')
        .delete()
        .eq('performed_by', userId)

      if (deleteAuditError) {
        console.error('Audit trail delete error:', deleteAuditError.message)
        throw deleteAuditError
      }

      // Step 2: Delete from users table
      const { error: deleteDbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('user_id', userId)

      if (deleteDbError) {
        console.error('Database delete error:', deleteDbError.message)
        throw deleteDbError
      }

      // Step 3: Delete from auth.users
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteAuthError) {
        console.error('Auth delete error:', deleteAuthError.message)
        throw deleteAuthError
      }

      return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (authError) {
      console.error('Delete user failed:', authError.message)
      return new Response(JSON.stringify({ 
        error: 'Authorization verification failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

  } catch (error) {
    console.error('Delete user error:', error.message)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to delete user'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
