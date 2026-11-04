/**
 * Email formatting and dispatch for Alumni Office Hours applications.
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

interface SendAlumniEmailParams {
  fullName: string;
  email: string;
  graduationYear: number;
  institution: string;
  field: string;
  occupation: string;
  bio: string;
  topics: string;
  availability: string;
  contactUrl: string;
}

export async function sendAlumniApplicationEmail(
  params: SendAlumniEmailParams
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Alumni Office Hours Email] RESEND_API_KEY is not configured. Skipping email dispatch."
    );
    return;
  }

  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || process.env.FUNDING_FROM_EMAIL;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (!fromEmail || !notifyEmail) {
    console.error(
      `[Alumni Office Hours Email] Missing required email config: ${
        !fromEmail ? "CONTACT_FROM_EMAIL (or FUNDING_FROM_EMAIL) " : ""
      }${!notifyEmail ? "CONTACT_NOTIFY_EMAIL" : ""}. Skipping email notification.`
    );
    return;
  }

  const cleanName = escapeHtml(params.fullName);
  const cleanEmail = escapeHtml(params.email);
  const cleanYear = String(params.graduationYear);
  const cleanInstitution = escapeHtml(params.institution);
  const cleanField = escapeHtml(params.field);
  const cleanOccupation = escapeHtml(params.occupation);
  const cleanBio = escapeHtml(params.bio).replace(/\n/g, "<br/>");
  const cleanTopics = escapeHtml(params.topics).replace(/\n/g, "<br/>");
  const cleanAvailability = escapeHtml(params.availability).replace(/\n/g, "<br/>");
  const cleanContactUrl = escapeHtml(params.contactUrl);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Alumni Office Hours Application</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f4f4f5; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px 0; color: #18181b; font-size: 20px;">New Alumni Office Hours Application</h2>
    <p style="margin: 0; color: #71717a; font-size: 14px;">An alumnus has submitted an application to host office hours and share advice with students.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold; width: 140px;">Applicant:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${cleanName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Email:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Graduation Year:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">Class of ${cleanYear}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Institution:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${cleanInstitution}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Field / Domain:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${cleanField}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Current Occupation:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${cleanOccupation}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Contact Link:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><a href="${cleanContactUrl}" target="_blank" rel="noopener noreferrer">${cleanContactUrl}</a></td>
    </tr>
  </table>

  <div style="margin-bottom: 20px;">
    <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #18181b;">Short Bio</h3>
    <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px; font-size: 14px;">
      ${cleanBio}
    </div>
  </div>

  <div style="margin-bottom: 20px;">
    <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #18181b;">Advising Topics</h3>
    <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px; font-size: 14px;">
      ${cleanTopics}
    </div>
  </div>

  <div style="margin-bottom: 20px;">
    <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #18181b;">Availability</h3>
    <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px; font-size: 14px;">
      ${cleanAvailability}
    </div>
  </div>

  <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #71717a;">
    <p style="margin: 0;">This application was submitted via Zed Alumni Office Hours. Review and approve in the <a href="https://zedproject.ng/admin/alumni-office-hours" style="color: #2563eb;">Admin Console</a>.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        reply_to: params.email,
        subject: `[Alumni Office Hours] Application: ${params.fullName} (${params.occupation})`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Alumni Office Hours Email] Resend API error:", res.status, errText);
    }
  } catch (err) {
    console.error("[Alumni Office Hours Email] Network error:", err);
  }
}

