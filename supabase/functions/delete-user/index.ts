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
    
    console.log('Delete function received user_id:', userId)

    if (!userId) {
      throw new Error('Missing required field: userId')
    }

    // Initialize Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Step 1: Delete audit trail records for this user (foreign key constraint)
    console.log('Deleting audit trail records for user:', userId)
    const { error: deleteAuditError } = await supabaseAdmin
      .from('audit_trail')
      .delete()
      .eq('performed_by', userId)

    if (deleteAuditError) {
      console.error('Audit trail delete error:', deleteAuditError)
      throw deleteAuditError
    }

    console.log('Audit trail records deleted')

    // Step 2: Delete from users table
    console.log('Deleting user from database:', userId)
    const { error: deleteDbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (deleteDbError) {
      console.error('Database delete error:', deleteDbError)
      throw deleteDbError
    }

    console.log('User deleted from database')

    // Step 3: Delete from auth.users
    console.log('Deleting user from auth system:', userId)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Auth delete error:', deleteAuthError)
      throw deleteAuthError
    }

    console.log('User deleted from auth system')

    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
