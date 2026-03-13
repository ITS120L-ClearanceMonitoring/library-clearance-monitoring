import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      headers: corsHeaders,
      status: 405,
    })
  }

  try {
    const body = await req.json()
    const { email, first_name, last_name, role } = body

    // Validate required fields
    if (!email || !role) {
      throw new Error('Missing required fields: email and role')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Initialize Admin Client with the Service Role Key (Server-side only!)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server configuration error')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Check if user already exists in the users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('This email address is already registered. Please use a different email or delete the existing account first.')
    }

    // Create user in Supabase Auth with auto-generated password (user will set their own)
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: crypto.randomUUID(), // Secure random temporary password
      email_confirm: false,
      user_metadata: { first_name, last_name, role }
    })

    if (createAuthError) {
      console.error('Auth creation error:', createAuthError.message)
      throw createAuthError
    }

    const userId = authData.user?.id
    if (!userId) throw new Error('Failed to create user account')

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://mu-lcms-admin.vercel.app/change-password'
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError.message)
      throw linkError
    }

    const resetLink = linkData?.properties?.action_link

    // Insert user profile into users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        user_id: userId,
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role,
        created_at: new Date().toISOString(),
        last_login: null,
        must_change_password: true
      })

    if (insertError) {
      console.error('Insert error:', insertError.message)
      throw insertError
    }

    // Format role name for email
    const formatRole = (roleStr: string): string => {
      if (roleStr === 'library_verifier') return 'Library Verifier'
      if (roleStr === 'library_admin') return 'Library Admin'
      return roleStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formattedRole = formatRole(role)

    // Send invitation email via Brevo only
    try {
      const senderEmail = Deno.env.get('SENDER_EMAIL') || 'libraryclearancemonintoringsys@gmail.com'
      const senderName = Deno.env.get('SENDER_NAME') || 'Library Clearance System'
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')

      if (brevoApiKey) {
        const emailHtml = `
          <h2>Welcome to Library Clearance System</h2>
          <p>Hello ${first_name} ${last_name},</p>
          <p>You have been invited to join the Library Clearance System as a <strong>${formattedRole}</strong>.</p>
          <p>Click the link below to set your password:</p>
          <p><a href="${resetLink}">Set Your Password</a></p>
          <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
          <p>Best regards,<br>Library Clearance System</p>
        `

        const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email, name: `${first_name} ${last_name}` }],
            sender: {
              email: senderEmail,
              name: senderName,
            },
            subject: `Welcome to Library Clearance System - ${formattedRole}`,
            htmlContent: emailHtml,
          }),
        })

        if (!emailResponse.ok) {
          const emailResult = await emailResponse.json()
          console.error('Email send error:', emailResult.message)
        }
      }
    } catch (emailErr) {
      console.warn('Email service error - user was created but email failed')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Staff member invited successfully.',
      user: { email, first_name, last_name, role }
    }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Invite staff error:', error?.message)
    
    const errorMessage = error?.message || 'Unknown error'
    const isEmailError = errorMessage.includes('already registered')
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      code: isEmailError ? 'email_exists' : 'unknown_error',
    }), {
      headers: corsHeaders,
      status: 400,
    })
  }
})