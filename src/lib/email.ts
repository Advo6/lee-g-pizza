interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Lee-G's Pizza <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[Email Mock] To ${to}: ${subject}\n${text}`);
    return {
      sent: false,
      mock: true,
      recipient: to,
      error: "Resend API key is not configured.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  const responseBody = await res.json().catch(async () => {
    const raw = await res.text().catch(() => "");
    return raw ? { raw } : null;
  });

  if (!res.ok) {
    const error =
      typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
    console.error(`[Email] Failed to send to ${to}: ${error}`);
    return {
      sent: false,
      mock: false,
      recipient: to,
      error: explainResendError(error),
      rawError: error,
    };
  }

  console.log(`[Email] Message accepted for ${to}: ${JSON.stringify(responseBody)}`);
  return { sent: true, mock: false, recipient: to, response: responseBody };
}

function explainResendError(error: string) {
  const lower = error.toLowerCase();

  if (lower.includes("api key")) {
    return "Resend rejected the email. Check RESEND_API_KEY in .env and restart the dev server.";
  }

  if (lower.includes("domain") || lower.includes("from")) {
    return "Resend rejected the sender email. Verify your domain in Resend or use a valid RESEND_FROM_EMAIL.";
  }

  if (lower.includes("audience") || lower.includes("recipient")) {
    return "Resend rejected the recipient email. Check the customer's email address.";
  }

  return "Resend rejected the email. Check the server terminal for the full Resend error.";
}
