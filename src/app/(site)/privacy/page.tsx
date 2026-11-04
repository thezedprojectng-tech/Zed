import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/site/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy – Zed",
  description:
    "How Zed collects, uses and protects your personal data under the Nigeria Data Protection Act 2023.",
  openGraph: {
    title: "Privacy Policy – Zed",
    description:
      "How Zed collects, uses and protects your personal data under the Nigeria Data Protection Act 2023.",
    url: "https://zedproject.ng/privacy",
  },
};

const TOC = [
  { id: "section-1", title: "Who we are" },
  { id: "section-2", title: "What we collect" },
  { id: "section-3", title: "Why we use your data" },
  { id: "section-4", title: "What becomes public" },
  { id: "section-5", title: "Who we share data with" },
  { id: "section-6", title: "Transfers outside Nigeria" },
  { id: "section-7", title: "How long we keep data" },
  { id: "section-8", title: "Security" },
  { id: "section-9", title: "Your rights" },
  { id: "section-10", title: "Children" },
  { id: "section-11", title: "Cookies and local storage" },
  { id: "section-12", title: "Changes to this Policy" },
  { id: "section-13", title: "Contact" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian data protection lawyer before production launch.
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How Zed collects, uses and protects your personal data under the Nigeria Data Protection Act 2023."
      lastUpdated="Nov 4, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          1. Who we are
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed operates the Zed web app and Progressive Web App for Nigerian youth (the
            &ldquo;Platform&rdquo;). We are the data controller for personal data collected through
            the Platform under the Nigeria Data Protection Act 2023 (&ldquo;NDPA&rdquo;). Some
            modules shown as &ldquo;coming soon&rdquo; are not built yet and collect no data. We
            will update this Policy before launching any new feature that handles personal data.
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          2. What we collect
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account:</strong> your phone number (used to send a one-time SMS code to sign
              in), your name, and an optional profile picture.
            </li>
            <li>
              <strong>Profile:</strong> details you choose to add to your profile, such as your
              institution or state.
            </li>
            <li>
              <strong>Mining and ZED points:</strong> your daily claim records, point balance, and
              referral links.
            </li>
            <li>
              <strong>Internship Radar submissions:</strong> company name, role, location, stipend,
              application link, and your display name (all public after approval).
            </li>
            <li>
              <strong>Alumni Office Hours applications:</strong> full name, email address,
              graduation year, institution, field, occupation, short bio, topics, availability, and
              a contact URL. Email address is kept private; the rest appears publicly after
              approval.
            </li>
            <li>
              <strong>Mentor applications:</strong> display name, institution, field, bio, and
              contact details you choose to share, subject to your consent at submission.
            </li>
            <li>
              <strong>Technical data:</strong> IP address (hashed for rate-limiting, not stored in
              plain text), browser type, and pages visited, collected automatically when you use
              the Platform.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          3. Why we use your data
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>To provide the service:</strong> authenticate you, show your points balance,
              display your approved submissions, and operate the Platform.
            </li>
            <li>
              <strong>To moderate content:</strong> review internship, mentor, and alumni
              submissions before they go public.
            </li>
            <li>
              <strong>To prevent abuse:</strong> rate-limit form submissions using hashed IP
              addresses and Cloudflare Turnstile.
            </li>
            <li>
              <strong>To send transactional email:</strong> confirmation emails after you submit an
              application (sent via Resend; no marketing email without your separate consent).
            </li>
            <li>
              <strong>To comply with law:</strong> retain records as required under Nigerian law and
              respond to lawful requests from authorities.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          4. What becomes public
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Approved internship listings:</strong> all fields you submitted (company,
              role, location, stipend, link, display name).
            </li>
            <li>
              <strong>Approved alumni profiles:</strong> display name, graduation year,
              institution, field, occupation, bio, topics, availability, and contact URL. Your
              email address is never shown publicly.
            </li>
            <li>
              <strong>Approved mentor profiles:</strong> the fields you consented to share at
              submission.
            </li>
            <li>
              <strong>Your public profile:</strong> your display name and ZED point total, if you
              choose to make them visible.
            </li>
          </ul>
          <p>
            Nothing else is public. Private application data (email addresses, admin notes, IP
            hashes, status history) is never shown to other users.
          </p>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          5. Who we share data with
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We do not sell your personal data. We share it only with the processors listed below,
            each bound by a data processing agreement:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Supabase:</strong> database and authentication hosting (servers in EU West,
              covered under Section 6 below).
            </li>
            <li>
              <strong>Vercel:</strong> web hosting and edge functions.
            </li>
            <li>
              <strong>Resend:</strong> transactional email delivery.
            </li>
            <li>
              <strong>Cloudflare:</strong> DDoS protection, CDN, and Turnstile bot detection.
            </li>
            <li>
              <strong>Termii:</strong> SMS OTP delivery for phone-number sign-in.
            </li>
          </ul>
          <p>
            We may also disclose data to law-enforcement or regulatory authorities where required
            by Nigerian law.
          </p>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          6. Transfers outside Nigeria
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Some processors (Supabase, Vercel, Resend, Cloudflare) store or process data outside
            Nigeria. We rely on standard contractual clauses or the processor&apos;s adequacy
            status under the NDPA to legitimise those transfers. If you would like details of the
            safeguards in place for a specific transfer, contact us at the address in Section 13.
          </p>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          7. How long we keep data
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Active accounts:</strong> for as long as your account exists plus 90 days
              after deletion to allow for disputes.
            </li>
            <li>
              <strong>Declined or withdrawn applications:</strong> 180 days from the decision date,
              then deleted.
            </li>
            <li>
              <strong>Approved public profiles:</strong> until you request removal or we
              depublish them.
            </li>
            <li>
              <strong>IP hashes (rate-limiting):</strong> 30 days.
            </li>
            <li>
              <strong>Admin audit logs:</strong> 2 years for accountability purposes.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          8. Security
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We use TLS in transit, encrypted storage at rest, row-level security rules that limit
            database access to only the data each role needs, hashed IP addresses instead of raw
            ones, and Cloudflare Turnstile on public submission forms. No security measure is
            perfect; if you discover a vulnerability, please report it to{" "}
            <a
              href="mailto:privacy@zedproject.ng"
              className="text-[#2E82F7] underline"
            >
              privacy@zedproject.ng
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          9. Your rights
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Under the NDPA 2023 you have the right to access, correct, delete, or port your
            personal data, and to object to or restrict certain processing. To exercise any of
            these rights, email{" "}
            <a
              href="mailto:privacy@zedproject.ng"
              className="text-[#2E82F7] underline"
            >
              privacy@zedproject.ng
            </a>
            . We will respond within 30 days. If you are not satisfied with our response, you may
            lodge a complaint with the Nigeria Data Protection Commission at{" "}
            <a
              href="https://ndpc.gov.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2E82F7] underline"
            >
              ndpc.gov.ng
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── Section 10 ─────────────────────────────────────────────── */}
      <section id="section-10" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          10. Children
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The Platform is intended for users aged 16 and above. We do not knowingly collect
            personal data from anyone under 16. If we learn that we have done so, we will delete
            it promptly.
          </p>
        </div>
      </section>

      {/* ── Section 11 ─────────────────────────────────────────────── */}
      <section id="section-11" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          11. Cookies and local storage
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We use a session cookie to keep you signed in and browser local storage to cache your
            ZED point balance and preferences. We do not use advertising cookies or third-party
            tracking pixels. Cloudflare may set a short-lived security cookie (__cf_bm) to detect
            bots; this is a strictly necessary cookie.
          </p>
        </div>
      </section>

      {/* ── Section 12 ─────────────────────────────────────────────── */}
      <section id="section-12" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          12. Changes to this Policy
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We will update this Policy when we add features that affect how we handle personal
            data. The &ldquo;Last updated&rdquo; date at the top of the page will change, and for
            material changes we will notify signed-in users via an in-app banner. Continued use of
            the Platform after the effective date of a change constitutes acceptance of the revised
            Policy.
          </p>
        </div>
      </section>

      {/* ── Section 13 ─────────────────────────────────────────────── */}
      <section id="section-13" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          13. Contact
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            For any privacy question, subject access request, or complaint, contact us at{" "}
            <a
              href="mailto:privacy@zedproject.ng"
              className="text-[#2E82F7] underline"
            >
              privacy@zedproject.ng
            </a>
            . If we cannot resolve your concern, you may contact the Nigeria Data Protection
            Commission at{" "}
            <a
              href="https://ndpc.gov.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2E82F7] underline"
            >
              ndpc.gov.ng
            </a>
            .
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
