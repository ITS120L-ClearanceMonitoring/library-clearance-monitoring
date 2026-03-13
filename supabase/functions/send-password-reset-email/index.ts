import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Content-Type': 'application/json',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { headers: corsHeaders, status: 405 }
    )
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error("Missing required field: email")
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format")
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "libraryclearancemonintoringsys@gmail.com"
    const senderName = Deno.env.get("SENDER_NAME") || "Library Clearance System"
    const appUrl = Deno.env.get("APP_URL") || "https://mu-lcms-admin.vercel.app"

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Server configuration error: Supabase credentials missing")
    }

    if (!brevoApiKey) {
      throw new Error("Server configuration error: Brevo API key missing")
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Check if user exists
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()

    if (getUserError) {
      throw new Error("Failed to verify user")
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      // Don't reveal if user exists or not for security reasons
      // Still return success to prevent email enumeration attacks
      return new Response(
        JSON.stringify({
          success: true,
          message: "If this email exists, a password reset link has been sent."
        }),
        { headers: corsHeaders, status: 200 }
      )
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/reset-password`
      }
    })

    if (linkError) {
      console.error("Generate link error:", linkError.message)
      throw new Error("Failed to generate reset link")
    }

    const resetLink = linkData?.properties?.action_link
    if (!resetLink) {
      throw new Error("Failed to generate reset link")
    }

    // Send email via Brevo
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Library Clearance System account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2c3e50; color: white; text-decoration: none; border-radius: 4px;">Reset Your Password</a></p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p><strong>This link expires in 1 hour.</strong></p>
      <p>If you did not request a password reset, please ignore this email or contact your system administrator.</p>
      <p style="margin-top: 30px; color: #7f8c8d;">
        Best regards,<br/>
        Library Clearance System
      </p>
      <p style="margin-top: 25px; font-size: 12px; color: #777777;">This is a system-generated message. Please do not reply to this email.</p>
    `

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [{ email }],
        sender: {
          email: senderEmail,
          name: senderName,
        },
        subject: "Reset Your Library Clearance System Password",
        htmlContent: emailHtml,
      }),
    })

    const brevoResult = await brevoResponse.json()

    if (!brevoResponse.ok) {
      console.error("Brevo email send failed:", brevoResult.message)
      throw new Error("Failed to send reset email")
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "If this email exists, a password reset link has been sent."
      }),
      { headers: corsHeaders, status: 200 }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
