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
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { 
      headers: corsHeaders,
      status: 405 
    })
  }

  try {
    const { email, studentName, status, remarks } = await req.json()
    const apiKey = Deno.env.get("BREVO_API_KEY")
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "libraryclearancemonintoringsys@gmail.com"
    const senderName = Deno.env.get("SENDER_NAME") || "Library Clearance System"

    if (!apiKey) {
      throw new Error("BREVO_API_KEY not configured in Supabase secrets")
    }

    // Determine email content based on status
    const isCleared = status === "CLEARED"
    const emailSubject = isCleared 
      ? "Library Clearance Status: Approved" 
      : "Library Clearance Status: Not Approved"

    const emailBody = isCleared
      ? `
        <p>Dear ${studentName},</p>
        <p>This is an automated notification from the <strong>Library Clearance Monitoring System </strong> of Mapúa Library.</p>
        <p>Your library clearance request has been reviewed and marked as <strong style="color:green;">APPROVED</strong> in the system.</p>
        <p>No further action is required at this time.</p>
        <p>If you have any questions, please contact the library at <strong>library@mapua.edu</strong></p>
        <p style="margin-top:25px; font-size:12px; color:#777777;">This is a system-generated message. Please do not reply to this email.</p>
        <p style="margin-top: 30px; color: #7f8c8d;">
          Best regards,<br/>
          Library Clearance Monitoring System
        </p>
      `
      : `
        <p>Dear ${studentName},</p>
        <p>This is an automated notification from the <strong>Library Clearance Monitoring System </strong> of Mapúa Library.</p>
        <p>Your library clearance request has been reviewed and marked as <strong style="color:#3A86FF;">NOT APPROVED</strong> in the system.</p>
        <p>Based on the review, the following remarks were provided:</p>
        <p style="background: #ecf0f1; padding: 10px; border-left: 4px solid #3A86FF;">
          ${remarks || "No reason provided"}
        </p>
        <p>Please address the concern listed above before requesting clearance again.</p>
        <p>If you believe this status is incorrect, please contact the library directly at <strong>library@mapua.edu</strong></p>
        <p style="margin-top:25px; font-size:12px; color:#777777;">This is a system-generated message. Please do not reply to this email.</p>
        <p style="margin-top: 30px; color: #7f8c8d;">
          Best regards,<br/>
          Library Clearance Monitoring System
        </p>
      `

    // Send email via Brevo
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [{ email, name: studentName }],
        sender: {
          email: senderEmail,
          name: senderName,
        },
        subject: emailSubject,
        htmlContent: emailBody,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email send failed:", result.message)
      throw new Error(result.message || "Failed to send email via Brevo")
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        message: `Email sent to ${email}`,
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
