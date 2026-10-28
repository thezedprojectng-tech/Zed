/**
 * Email formatting and dispatch for Campus Ambassador applications.
 * Best-effort delivery using Resend API / SDK to CONTACT_NOTIFY_EMAIL.
 */

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SendAmbassadorEmailParams {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  state: string;
  course: string;
  level: string;
  socialHandle?: string | null;
  whyAmbassador: string;
  referralCode?: string | null;
}

export async function sendAmbassadorEmail(
  params: SendAmbassadorEmailParams
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Ambassador Email] RESEND_API_KEY is not configured. Skipping email dispatch."
    );
    return;
  }

  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || process.env.FUNDING_FROM_EMAIL;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (!fromEmail || !notifyEmail) {
    console.error(
      `[Ambassador Email] Missing required email config: ${
        !fromEmail ? "CONTACT_FROM_EMAIL (or FUNDING_FROM_EMAIL) " : ""
      }${!notifyEmail ? "CONTACT_NOTIFY_EMAIL" : ""}. Skipping email notification.`
    );
    return;
  }

  const cleanName = escapeHtml(params.fullName);
  const cleanEmail = escapeHtml(params.email);
  const cleanPhone = escapeHtml(params.phone);
  const cleanInstitution = escapeHtml(params.institution);
  const cleanState = escapeHtml(params.state);
  const cleanCourse = escapeHtml(params.course);
  const cleanLevel = escapeHtml(params.level);
  const cleanSocial = params.socialHandle ? escapeHtml(params.socialHandle) : null;
  const cleanReferral = params.referralCode ? escapeHtml(params.referralCode) : null;
  const cleanWhy = escapeHtml(params.whyAmbassador).replace(/\n/g, "<br/>");

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
      <div style="border-bottom: 2px solid #2E82F7; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #2E82F7; font-weight: bold;">Campus Ambassador Program</span>
        <h2 style="margin: 4px 0 0 0; color: #0B0B0C; font-size: 20px;">New Ambassador Application: ${cleanName}</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #707078; width: 140px;">Applicant:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Email:</td>
          <td style="padding: 6px 0;"><a href="mailto:${cleanEmail}" style="color: #2E82F7; text-decoration: none;">${cleanEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Phone / WhatsApp:</td>
          <td style="padding: 6px 0; color: #0B0B0C;">${cleanPhone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Institution:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanInstitution} (${cleanState})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Course & Level:</td>
          <td style="padding: 6px 0; color: #0B0B0C;">${cleanCourse} — ${cleanLevel}</td>
        </tr>
        ${
          cleanSocial
            ? `<tr>
                <td style="padding: 6px 0; color: #707078;">Social Handle:</td>
                <td style="padding: 6px 0; color: #0B0B0C;">${cleanSocial}</td>
              </tr>`
            : ""
        }
        ${
          cleanReferral
            ? `<tr>
                <td style="padding: 6px 0; color: #707078;">Referral Code:</td>
                <td style="padding: 6px 0; color: #0B0B0C; font-family: monospace;">${cleanReferral}</td>
              </tr>`
            : ""
        }
      </table>

      <div style="margin-top: 16px;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #707078; margin-bottom: 8px;">Why They Want to Be an Ambassador</h3>
        <div style="background: #F8F8F9; border: 1px solid #EAEAE6; border-radius: 8px; padding: 16px; font-size: 14px; color: #1C1C1E; line-height: 1.6; white-space: pre-wrap;">${cleanWhy}</div>
      </div>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EAEAE6; font-size: 12px; color: #8E8E93;">
        <p style="margin: 0;">Reply directly to this email to contact <strong>${cleanEmail}</strong>.</p>
        <p style="margin: 4px 0 0 0;">Review applications in the <a href="https://zedproject.ng/admin/ambassadors" style="color: #2E82F7; text-decoration: none;">Zed Admin Console</a>.</p>
      </div>
    </div>
  `;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: fromEmail,
      to: notifyEmail,
      replyTo: params.email,
      subject: `[Campus Ambassador] Application from ${params.fullName} (${params.institution})`,
      html: emailHtml,
    });
    console.info(`[Ambassador Email] Dispatched notification for applicant email to ${notifyEmail}`);
  } catch (error) {
    console.error("[Ambassador Email] Failed to send email via Resend:", error);
  }
}

