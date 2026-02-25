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
    
    console.log('Edge Function received:', { email, first_name, last_name, role })

    // Validate required fields
    if (!email || !role) {
      throw new Error(`Missing required fields: email=${email}, role=${role}`)
    }

    // Initialize Admin Client with the Service Role Key (Server-side only!)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check - URL exists:', !!supabaseUrl, 'Key exists:', !!serviceRoleKey)
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Check if user already exists in the users table
    console.log('Checking if user already exists:', email)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.error('User already exists:', email)
      throw new Error(`Duplicated user data: This email address is already registered. Please use a different email or delete the existing account first.`)
    }

    // Create user in Supabase Auth with auto-generated password (user will set their own)
    console.log('Creating user in auth system:', email)
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-12), // Temporary random password
      email_confirm: false, // Require email confirmation
      user_metadata: { first_name, last_name, role }
    })

    if (createAuthError) {
      console.error('Auth creation error:', createAuthError)
      throw createAuthError
    }

    const userId = authData.user?.id
    console.log('User created in auth, ID:', userId)
    if (!userId) throw new Error('Failed to get user ID from auth creation')

    // Generate password reset link
    console.log('Generating password reset link')
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('REDIRECT_URL') || 'http://localhost:5173'}/change-password`
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      throw linkError
    }

    const resetLink = linkData?.properties?.action_link
    console.log('Password reset link generated')

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
      console.error('Insert error:', insertError)
      throw insertError
    }

    console.log('User profile inserted into database')

    // Format role name for email
    const formatRole = (roleStr: string): string => {
      if (roleStr === 'library_verifier') return 'Library Verifier'
      if (roleStr === 'library_admin') return 'Library Admin'
      return roleStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formattedRole = formatRole(role)

    // Send invitation email via Brevo only
    try {
      const senderEmail = Deno.env.get('SENDER_EMAIL') || 'gelay713@gmail.com'
      const senderName = Deno.env.get('SENDER_NAME') || 'Library Clearance System'
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')

      if (!brevoApiKey) {
        console.warn('BREVO_API_KEY not configured, skipping email')
      } else {
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

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error('Brevo error:', emailResult)
          console.warn(`Email could not be sent to ${email}, but user was created successfully`)
        } else {
          console.log(`Invitation email sent to ${email}:`, emailResult)
        }
      }
    } catch (emailErr) {
      console.warn('Email service error:', emailErr)
      console.warn('User was created successfully, but email notification could not be sent')
    }

    console.log('User successfully invited and profile created')
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Staff member invited successfully. Invitation email sent.',
      user: { email, first_name, last_name, role }
    }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Function error:', error)
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    const isDuplicateError = errorMessage.includes('Duplicated user data') || errorMessage.includes('user already exists')
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      code: isDuplicateError ? 'email_exists' : 'unknown_error',
    }), {
      headers: corsHeaders,
      status: isDuplicateError ? 400 : 400,
    })
  }
})