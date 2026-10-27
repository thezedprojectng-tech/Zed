/**
 * Best-effort email notification for new internship submissions.
 */

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NewInternshipEmailParams {
  id: string;
  title: string;
  organization: string;
  location: string;
  workMode: string;
  field: string;
  paidStatus: string;
}

export async function sendInternshipSubmissionNotification(params: NewInternshipEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FUNDING_FROM_EMAIL;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;
  if (!fromEmail || !notifyEmail) return;

  const cleanTitle = escapeHtml(params.title);
  const cleanOrg = escapeHtml(params.organization);
  const cleanLoc = escapeHtml(params.location);

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="border-bottom: 2px solid #2E82F7; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #2E82F7; font-weight: bold;">Zed Internship Radar</span>
        <h2 style="margin: 4px 0 0 0; color: #0B0B0C; font-size: 20px;">New Opportunity Lead Submitted</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #707078; width: 120px;">Role:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Organization:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0B0B0C;">${cleanOrg}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Location / Mode:</td>
          <td style="padding: 6px 0;">${cleanLoc} (${escapeHtml(params.workMode)})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Field:</td>
          <td style="padding: 6px 0;">${escapeHtml(params.field)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #707078;">Compensation:</td>
          <td style="padding: 6px 0;">${escapeHtml(params.paidStatus)}</td>
        </tr>
      </table>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EAEAE6; font-size: 13px;">
        <p>Review and publish this lead in the <a href="https://zedproject.ng/admin/internships" style="color: #2E82F7; text-decoration: none; font-weight: 600;">Zed Admin Console &rarr;</a></p>
      </div>
    </div>
  `;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: fromEmail,
      to: notifyEmail,
      subject: `[Internship Radar] New Lead: ${params.title} at ${params.organization}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error("[Internship Email] Error dispatching notification:", err);
  }
}
