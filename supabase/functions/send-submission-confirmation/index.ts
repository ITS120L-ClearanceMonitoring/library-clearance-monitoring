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
    const { email, studentName, studentNumber, program, purpose } = await req.json()
    
    const apiKey = Deno.env.get("BREVO_API_KEY")
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "libraryclearancemonintoringsys@gmail.com"
    const senderName = Deno.env.get("SENDER_NAME") || "Library Clearance System"

    if (!apiKey) {
      console.error("Email service configuration error")
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { headers: corsHeaders, status: 500 }
      )
    }

    if (!email || !studentName) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: email and studentName" }),
        { headers: corsHeaders, status: 400 }
      )
    }

    const emailSubject = "Clearance Request Submission Confirmation"

    const emailBody = `
      <p>Dear ${studentName},</p>
      <p>This is to confirm that your library clearance request has been successfully submitted to the <strong>Library Clearance Monitoring System</strong> of Mapua Library.</p>
      
      <h3 style="color: #2c3e50; margin-top: 20px;">Submission Details:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="background: #ecf0f1;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #bdc3c7;">Student Number:</td>
          <td style="padding: 8px; border: 1px solid #bdc3c7;">${studentNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #bdc3c7;">Full Name:</td>
          <td style="padding: 8px; border: 1px solid #bdc3c7;">${studentName}</td>
        </tr>
        <tr style="background: #ecf0f1;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #bdc3c7;">Program:</td>
          <td style="padding: 8px; border: 1px solid #bdc3c7;">${program}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #bdc3c7;">Purpose of Clearance:</td>
          <td style="padding: 8px; border: 1px solid #bdc3c7;">${purpose}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">Your clearance request is now being processed by the library staff. You will receive a notification email once your clearance status has been determined (Approved or Not Approved).</p>
      
      <p style="background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;">
        <strong>Processing Time:</strong> The review process typically takes 1-2 business days. Please check your inbox regularly for updates.
      </p>

      <p>If you have any questions or believe there is an error in your submission, please contact the library at <strong>library@mapua.edu</strong> and reference your student number.</p>

      <p style="margin-top: 25px; font-size: 12px; color: #777777;">This is a system-generated message. Please do not reply to this email.</p>
      <p style="margin-top: 30px; color: #7f8c8d;">
        Best regards,<br/>
        Library Clearance Monitoring System
      </p>
    `

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
      return new Response(
        JSON.stringify({ success: false, error: result.message || "Failed to send email" }),
        { headers: corsHeaders, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        message: `Confirmation email sent to ${email}`,
      }),
      { headers: corsHeaders, status: 200 }
    )
  } catch (error) {
    console.error("Error in send-submission-confirmation:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
