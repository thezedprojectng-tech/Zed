/**
 * Email formatting and dispatch for funding idea submissions.
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

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SendFundingEmailsParams {
  fullName: string;
  email: string;
  phone: string;
  projectTitle: string;
  category: string;
  stage: string;
  fundingNeededNgn: number;
  summary: string;
  problem: string;
  plan: string;
  link?: string | null;
}

export async function sendFundingEmails(params: SendFundingEmailsParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Funding Email] RESEND_API_KEY not configured. Skipping email dispatch.");
    return;
  }

  const fromEmail = process.env.FUNDING_FROM_EMAIL || "Zed Funding <onboarding@resend.dev>";
  const notifyEmail = process.env.FUNDING_NOTIFY_EMAIL || "thezedprojectng@gmail.com";

  const cleanName = escapeHtml(params.fullName);
  const cleanEmail = escapeHtml(params.email);
  const cleanPhone = escapeHtml(params.phone);
  const cleanTitle = escapeHtml(params.projectTitle);
  const cleanCategory = escapeHtml(params.category);
  const cleanStage = escapeHtml(params.stage);
  const cleanFunding = escapeHtml(formatNaira(params.fundingNeededNgn));
  const cleanSummary = escapeHtml(params.summary).replace(/\n/g, "<br/>");
  const cleanProblem = escapeHtml(params.problem).replace(/\n/g, "<br/>");
  const cleanPlan = escapeHtml(params.plan).replace(/\n/g, "<br/>");
  const cleanLink = params.link ? escapeHtml(params.link) : null;

  // 1. Notification to Team
  const teamHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h2 style="color: #2E82F7; border-bottom: 2px solid #2E82F7; padding-bottom: 8px;">
        New Funding Submission
      </h2>
      <p>A new idea pitch has been submitted through the Zed portal:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Project Title:</td><td>${cleanTitle}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Applicant:</td><td>${cleanName}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${cleanEmail}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Phone / WhatsApp:</td><td>${cleanPhone}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Category:</td><td>${cleanCategory}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Stage:</td><td>${cleanStage}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Funding Needed:</td><td>${cleanFunding}</td></tr>
        ${cleanLink ? `<tr><td style="padding: 6px 0; font-weight: bold;">Pitch / Link:</td><td><a href="${cleanLink}">${cleanLink}</a></td></tr>` : ""}
      </table>
      
      <h3 style="margin-top: 24px; color: #222;">Summary</h3>
      <div style="background: #f7f7f8; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.6;">${cleanSummary}</div>

      <h3 style="margin-top: 20px; color: #222;">The Problem</h3>
      <div style="background: #f7f7f8; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.6;">${cleanProblem}</div>

      <h3 style="margin-top: 20px; color: #222;">Execution Plan</h3>
      <div style="background: #f7f7f8; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.6;">${cleanPlan}</div>

      <p style="margin-top: 32px; font-size: 12px; color: #777;">
        Review this submission in the Zed Admin Console under /admin/funding.
      </p>
    </div>
  `;

  // 2. Confirmation to Applicant
  const applicantHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
      <h2 style="color: #2E82F7;">We Received Your Project Idea</h2>
      <p>Hello ${cleanName},</p>
      <p>
        Thank you for submitting <strong>${cleanTitle}</strong> to Zed. We have received your pitch and our team will review the details.
      </p>
      <div style="background: #f4f6fa; border-left: 4px solid #2E82F7; padding: 14px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 6px 0; font-weight: bold; color: #1e3a8a;">Next steps</p>
        <p style="margin: 0; font-size: 14px; color: #334155;">
          The Zed team will review your application. If your project is shortlisted for the next stage, we will contact you directly via email.
        </p>
      </div>
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        Note: Submitting an idea does not guarantee funding.
      </p>
      <p style="font-size: 13px; color: #94a3b8;">
        The Zed Project &bull; <a href="https://zedproject.ng" style="color: #2E82F7; text-decoration: none;">zedproject.ng</a>
      </p>
    </div>
  `;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await Promise.allSettled([
      // Send to team
      resend.emails.send({
        from: fromEmail,
        to: notifyEmail,
        subject: `[Zed Funding] New Submission: ${params.projectTitle}`,
        html: teamHtml,
      }),
      // Send confirmation to applicant
      resend.emails.send({
        from: fromEmail,
        to: params.email,
        subject: `We received your pitch for ${params.projectTitle} - Zed`,
        html: applicantHtml,
      }),
    ]);
  } catch (err) {
    console.error("[Funding Email] Error dispatching emails via Resend:", err);
  }
}
