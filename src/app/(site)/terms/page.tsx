import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/site/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service – Legal Agreement & Platform Conditions",
  description:
    "Terms of Service governing the use of the Zed digital operating system, including Zed Nav civil playbooks, Zed Market escrow micro-gigs, Zed Meet networking, campus community hubs, and $ZED rewards.",
  openGraph: {
    title: "Terms of Service – Legal Agreement & Platform Conditions",
    description:
      "Review the Terms of Service for Zed, including marketplace escrow, community conduct, and civil guide disclaimers.",
    url: "https://zedproject.ng/terms",
  },
};

const TOC = [
  { id: "section-1", title: "Acceptance of Terms & Platform Definition" },
  { id: "section-2", title: "Eligibility & Age Requirements" },
  { id: "section-3", title: "Civic Guides & Non-Affiliation Disclaimer" },
  { id: "section-4", title: "User Accounts, Authentication & Anti-Bot Protection" },
  { id: "section-5", title: "Zed Market: Services Marketplace & Freelance Terms" },
  { id: "section-6", title: "Zed Meet & Live Audio: Trust, Safety & Audio Buffers" },
  { id: "section-7", title: "Campus Hubs & Academic Vault Guidelines" },
  { id: "section-8", title: "$ZED Token Rules & Dynamic Treasury Liquidity" },
  { id: "section-9", title: "Zed SOS: Geospatial Transit Safety Disclaimers" },
  { id: "section-10", title: "Acceptable Use & Prohibited Conduct" },
  { id: "section-11", title: "Intellectual Property Rights" },
  { id: "section-12", title: "Disclaimers & Limitation of Warranties" },
  { id: "section-13", title: "Limitation of Liability" },
  { id: "section-14", title: "Governing Law & Dispute Resolution" },
  { id: "section-15", title: "Modifications to Terms & Contact Information" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before production launch.
 */
export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="The contractual framework and operating conditions governing your access to and use of the Zed digital operating system, software applications, escrow marketplace, and documentation."
      lastUpdated="Oct 30, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          1. Acceptance of Terms &amp; Platform Definition
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you 
            (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and the Zed Project 
            (&quot;Zed&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the Zed marketing website, 
            Progressive Web Application (PWA), and associated modular digital services (collectively, the &quot;Platform&quot;).
          </p>
          <p>
            The Platform provides an integrated digital operating system for Nigerian youth, integrating: 
            <strong>Zed Nav</strong> (procedural civil state machines), <strong>Zed Skill</strong> (learning tracks), 
            <strong>Zed Market</strong> (escrow-backed micro-gigs), <strong>Zed Meet</strong> (WebRTC speed networking and drop-in audio rooms), 
            <strong>Campus Hubs &amp; Academic Vault</strong> (university departmental resources and Alumni Office Hours), 
            <strong>Zed SOS</strong> (geospatial transit safety alerts), and the <strong>$ZED Token Engine</strong> (proof-of-engagement reward system).
          </p>
          <p>
            By accessing or utilizing any portion of the Platform, you acknowledge that you have read, understood, and unconditionally agree 
            to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately cease use of the Platform.
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          2. Eligibility &amp; Age Requirements
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            You must be at least 16 years of age to access civic guides and educational materials on the Platform. 
            To enter into binding freelance contracts, execute escrow payments, or receive cash disbursements in Zed Market, 
            you must be at least 18 years of age or possess the legal capacity to enter into binding contracts under 
            the Laws of the Federal Republic of Nigeria.
          </p>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          3. Civic Guides &amp; Non-Affiliation Disclaimer
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono text-[#FAFAF8] space-y-2">
            <span className="font-bold text-[#2E82F7] uppercase block">
              CRITICAL STATUTORY DISCLAIMER:
            </span>
            <p>
              ZED IS AN INDEPENDENT CIVIC TECHNOLOGY PLATFORM OPERATED BY NIGERIAN TECHNOLOGISTS. ZED IS NOT AFFILIATED, ASSOCIATED, 
              AUTHORIZED, ENDORSED BY, OR IN ANY WAY OFFICIALLY CONNECTED WITH THE FEDERAL GOVERNMENT OF NIGERIA, 
              THE NIGERIA IMMIGRATION SERVICE (NIS), THE NATIONAL YOUTH SERVICE CORPS (NYSC), THE NATIONAL IDENTITY 
              MANAGEMENT COMMISSION (NIMC), THE CORPORATE AFFAIRS COMMISSION (CAC), OR ANY FEDERAL OR STATE MINISTRY.
            </p>
          </div>
          <p>
            Zed does not issue Nigerian passports, national identity slips, NYSC call-up letters, or CAC business certificates. 
            Zed provides plain-language educational playbooks and document dimension checkers.
            All official filings and statutory payments must be concluded directly through official government portals.
          </p>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          4. User Accounts, Authentication &amp; Anti-Bot Protection
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            To access personalized features, you must authenticate using a verified Nigerian mobile phone number via SMS OTP. 
            You are solely responsible for maintaining the confidentiality of your session credentials and for all activities 
            conducted under your account.
          </p>
          <p>
            To prevent botting, Sybil attacks, and automated $ZED mining fraud, Zed utilizes Cloudflare Turnstile verification 
            and hardware fingerprinting. Operating automated scripts, headless browsers, or multiple fraudulent accounts on 
            a single physical device constitutes a material breach of these Terms, resulting in immediate multiplier revocation 
            and account termination.
          </p>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          5. Zed Market: Services Marketplace &amp; Freelance Terms
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed Market is a platform connecting Nigerian youth offering freelance, creative, technical, and trade services with clients:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Services Only Policy:</strong> Zed Market is strictly dedicated to services (including graphic design, software development, academic tutoring, writing and translation, photography and video, beauty and fashion services, repairs and maintenance, errands and delivery, event coordination, and business administration). The listing or sale of physical goods, packaged consumer items, electronics, or retail merchandise is strictly prohibited.</li>
            <li><strong>Provider Responsibility:</strong> Service providers warrant that they have the skills, qualifications and lawful authority to deliver the services they list. Verification is optional; accounts may display a Verified or Not verified label.</li>
            <li><strong>Direct Contact &amp; Terms:</strong> Clients and providers connect directly via WhatsApp. Starting prices are indicators; final deliverables, timelines, and payment structures must be agreed clearly in writing between parties before work commences.</li>
            <li><strong>Safety &amp; Payment Rules:</strong> Clients are strictly advised never to pay the full agreed amount before seeing completed work or verifiable milestones. Deposits or partial advance payments should be governed by clear written milestones.</li>
            <li><strong>Prohibited Activities:</strong> Listings or transactions involving academic dishonesty (e.g., impersonation, writing examination papers, cheating services), adult or sexually explicit services, counterfeit work, intellectual property infringement, illicit substances, or any unlawful trade under Nigerian law are strictly prohibited and will result in immediate listing removal and account termination.</li>
            <li><strong>Tax Responsibility:</strong> Service providers operate as independent contractors and remain solely responsible for reporting income and fulfilling applicable personal income tax or VAT obligations under the Laws of the Federal Republic of Nigeria.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          6. Zed Meet &amp; Live Audio: Trust, Safety &amp; Audio Buffers
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed Meet facilitates 1-on-1 WebRTC speed networking and community audio rooms. You agree to adhere to our strict Community Standards:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Zero tolerance for hate speech, harassment, cyber-stalking, financial fraud (&quot;419&quot; scams), phone number farming, or explicit adult content.</li>
            <li>Users must hold Level 1+ verified status (phone/NIN verification) to initiate randomized matching.</li>
            <li>
              <strong>Consent to Moderation Buffering:</strong> You acknowledge and expressly consent that during Zed Meet sessions, 
              the client software maintains a temporary 30-second rolling audio buffer in volatile device memory. If a counterparty triggers 
              the 1-Tap Block/Report button, this buffer is transmitted for human moderator review. In all other circumstances, 
              conversations remain ephemeral and unrecorded.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          7. Campus Hubs &amp; Academic Vault Guidelines
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Campus Hubs (for universities such as UNILAG, OAU, UI, FUTA, and ABU) are student-centered educational spaces:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Materials contributed to the Academic Vault (past questions, lecture summaries, SIWES guides) must be shared solely for non-commercial educational study.</li>
            <li>You may not upload live examination question papers, leaked assessments, or copyright-infringing commercial textbooks.</li>
            <li>Alumni participating in 15-minute Office Hours do so as volunteer mentors. Mentorship does not guarantee academic grades, employment, or internship placements.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          8. $ZED Token Rules &amp; Dynamic Treasury Liquidity
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The $ZED Token is an off-chain engagement loyalty point mechanism designed to encourage active civic learning and community contribution:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Non-Securities Status:</strong> $ZED Tokens are not fiat currency, legal tender, investment contracts, shares, or digital asset securities under Nigerian law. They carry no voting rights or equity in the Zed project.</li>
            <li><strong>Zero-Fintech Architecture:</strong> Rewards are calculated off-chain. Conversions to Naira cashouts are funded via monthly platform revenue pools (ad revenue, recruitment fees, merchant voucher commissions) using the Dynamic Treasury Formula: <em>Conversion Rate = Monthly Cash Pool (NGN) / Total $ZED Submitted</em>.</li>
            <li><strong>Data Bundle Redemption:</strong> Tokens may alternatively be redeemed for discounted MTN, Airtel, Glo, and 9mobile data top-ups via third-party telecom APIs.</li>
            <li><strong>No Guaranteed Yield:</strong> Zed makes no warranty regarding the ongoing cash conversion rate of $ZED points. Fraudulent claims, script automation, or multiplier manipulation result in immediate token balance forfeiture.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          9. Zed SOS: Geospatial Transit Safety Disclaimers
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed SOS provides crowd-sourced geospatial awareness for road hazards, police checkpoints, and transit emergencies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Alerts are submitted in real time by community members and are advisory in nature. Zed does not independently verify physical roadway conditions on the ground.</li>
            <li>Zed SOS is <strong>not</strong> an official armed emergency dispatch or law enforcement response service. In life-threatening emergencies, immediately contact official Nigerian emergency lines (such as 112).</li>
            <li>Submitting false, fabricated, or malicious hazard reports is strictly prohibited and constitutes grounds for permanent banning.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 10 ─────────────────────────────────────────────── */}
      <section id="section-10" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          10. Acceptable Use &amp; Prohibited Conduct
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>You agree not to engage in any prohibited conduct, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Harvesting personal phone numbers or identity data from community boards or Zed Meet sessions.</li>
            <li>Deploying bots, spiders, or automated scrapers against Zed API endpoints or PWA caches.</li>
            <li>Attempting to reverse-engineer, decompile, or compromise the integrity of our salted hashing architecture.</li>
            <li>Using the Platform for money laundering, terrorism financing, or fraudulent financial schemes.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 11 ─────────────────────────────────────────────── */}
      <section id="section-11" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          11. Intellectual Property Rights
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            All software code, user interface designs, logos, and proprietary workflow state machines are the exclusive intellectual 
            property of the Zed Project. Creator Asset Lab resources (drum kits, overlays, Canva templates) are licensed 
            for personal and commercial creative projects under the terms specified in each asset download.
          </p>
        </div>
      </section>

      {/* ── Section 12 ─────────────────────────────────────────────── */}
      <section id="section-12" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          12. Disclaimers &amp; Limitation of Warranties
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED. ZED DISCLAIMS ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
            AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT PROCEDURAL GUIDES WILL REFLECT REAL-TIME GOVERNMENT GAZETTE CHANGES 
            WITHOUT DELAY, OR THAT GOVERNMENT OFFICIALS WILL ACCEPT INDEPENDENTLY PREPARED DOCUMENTATION.
          </p>
        </div>
      </section>

      {/* ── Section 13 ─────────────────────────────────────────────── */}
      <section id="section-13" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          13. Limitation of Liability
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED UNDER NIGERIAN LAW, ZED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OPPORTUNITY, ARISING OUT OF YOUR USE OF 
            CIVIC GUIDES, MARKETPLACE GIG TRANSACTIONS, OR TRANSIT SAFETY MAPS.
          </p>
        </div>
      </section>

      {/* ── Section 14 ─────────────────────────────────────────────── */}
      <section id="section-14" className="space-y-4 scroll-mt-28 pb-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          14. Governing Law &amp; Dispute Resolution
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            These Terms shall be governed by, construed, and enforced exclusively in accordance with the 
            <strong>Laws of the Federal Republic of Nigeria</strong>. Any dispute arising out of or in connection with these Terms 
            shall first be referred to good-faith mediation in Lagos State, Nigeria. If unresolved within 30 days, the dispute 
            shall be submitted to the exclusive jurisdiction of the competent courts of Lagos State.
          </p>
        </div>
      </section>

      {/* ── Section 15 ─────────────────────────────────────────────── */}
      <section id="section-15" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          15. Modifications to Terms &amp; Contact Information
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed reserves the right to amend these Terms at any time. When material changes are made, we will notify users 
            via the Platform interface with at least 14 days&apos; notice. Continued use of the Platform after the effective date 
            constitutes full acceptance of the revised Terms.
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#FAFAF8] ">
            <strong>Legal Inquiries &amp; Compliance Desk</strong><br />
            Zed Project<br />
            Lagos, Nigeria.<br />
            Email: <a href="mailto:legal@zedproject.ng" className="text-[#2E82F7] underline">legal@zedproject.ng</a>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
