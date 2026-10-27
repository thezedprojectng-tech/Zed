/**
 * Email formatting and dispatch for contact messages.
 * Best-effort delivery using Resend API / SDK.
 */

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SendContactEmailParams {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

export async function sendContactEmail(params: SendContactEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Contact Email] RESEND_API_KEY is not configured. Skipping email dispatch.");
    return;
  }

  // Reuse verified From email if CONTACT_FROM_EMAIL is not explicitly set
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FUNDING_FROM_EMAIL;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (!fromEmail || !notifyEmail) {
    console.error(
      `[Contact Email] Missing required email config: ${
        !fromEmail ? "CONTACT_FROM_EMAIL (or FUNDING_FROM_EMAIL) " : ""
      }${!notifyEmail ? "CONTACT_NOTIFY_EMAIL" : ""}. Skipping email notification.`
    );
    return;
  }

  const cleanName = escapeHtml(params.name);
  const cleanEmail = escapeHtml(params.email);
  const cleanPhone = params.phone ? escapeHtml(params.phone) : null;
  const cleanSubject = escapeHtml(params.subject);
  const cleanMessage = escapeHtml(params.message).replace(/\n/g, "<br/>");

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
      <div style="border-bottom: 2px solid #2E82F7; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #2E82F7; font-weight: bold;">Zed Contact Portal</span>
        <h2 style="margin: 4px 0 0 0; color: #0B0B0C; font-size: 20px;">New Inquiry: ${cleanSubject}</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #707078; width: 120px;">From:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Email:</td>
          <td style="padding: 6px 0;"><a href="mailto:${cleanEmail}" style="color: #2E82F7; text-decoration: none;">${cleanEmail}</a></td>
        </tr>
        ${
          cleanPhone
            ? `<tr>
                <td style="padding: 6px 0; color: #707078;">Phone:</td>
                <td style="padding: 6px 0; color: #0B0B0C;">${cleanPhone}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="padding: 6px 0; color: #707078;">Subject:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanSubject}</td>
        </tr>
      </table>

      <div style="margin-top: 16px;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #707078; margin-bottom: 8px;">Message Content</h3>
        <div style="background: #F8F8F9; border: 1px solid #EAEAE6; border-radius: 8px; padding: 16px; font-size: 14px; color: #1C1C1E; line-height: 1.6; white-space: pre-wrap;">${cleanMessage}</div>
      </div>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EAEAE6; font-size: 12px; color: #8E8E93;">
        <p style="margin: 0;">You can respond directly to this email to reply to <strong>${cleanEmail}</strong>.</p>
        <p style="margin: 4px 0 0 0;">View all messages in the <a href="https://zedproject.ng/admin/contact" style="color: #2E82F7; text-decoration: none;">Zed Admin Console</a>.</p>
      </div>
    </div>
  `;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: fromEmail,
      to: notifyEmail,
      replyTo: params.email, // explicitly set replyTo to sender
      subject: `[Zed Contact] ${params.subject} - from ${params.name}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error("[Contact Email] Error sending email via Resend:", err);
  }
}
