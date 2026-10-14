import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/site/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy – Compliance with NDPA 2023 & NDPR",
  description:
    "Comprehensive Privacy Policy of Zed. Technical details on zero raw NIN storage, salted SHA-256 server-side hashing, escrow financial data protection, WebRTC safety moderation, and NDPC regulatory recourse.",
  openGraph: {
    title: "Privacy Policy – Compliance with NDPA 2023 & NDPR",
    description:
      "Understand how Zed protects citizen data across civic guides, marketplace escrow, campus hubs, and safety mapping under the Nigeria Data Protection Act 2023.",
    url: "https://zedproject.ng/privacy",
  },
};

const TOC = [
  { id: "section-1", title: "Introduction & Platform Scope" },
  { id: "section-2", title: "Information We Collect Across Modules" },
  { id: "section-3", title: "Strict Prohibition of Raw NIN Storage & Salted SHA-256 Protocol" },
  { id: "section-4", title: "Lawful Bases for Processing under NDPA 2023" },
  { id: "section-5", title: "Purposes of Data Processing" },
  { id: "section-6", title: "Financial Privacy & Zero-Fintech Compliance Model" },
  { id: "section-7", title: "Real-Time WebRTC Audio & Safety Buffer Protocol" },
  { id: "section-8", title: "Geospatial Data & Safety Mapping (Zed SOS)" },
  { id: "section-9", title: "Data Retention & Storage Schedules" },
  { id: "section-10", title: "Disclosure & Sharing with Third-Party Processors" },
  { id: "section-11", title: "Cross-Border Data Transfers" },
  { id: "section-12", title: "Technical & Organizational Security Measures" },
  { id: "section-13", title: "Your Statutory Rights as a Data Subject" },
  { id: "section-14", title: "Protection of Minors & Student Data" },
  { id: "section-15", title: "Regulatory Recourse (NDPC) & Data Protection Officer Contact" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian data protection lawyer before production launch.
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Formal documentation of our data governance protocols, technical privacy controls, and adherence to the Nigeria Data Protection Act 2023 (NDPA) and Nigeria Data Protection Regulation (NDPR)."
      lastUpdated="October 14, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          1. Introduction &amp; Platform Scope
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates 
            the Zed digital operating system for Nigerian youth, encompassing the web application, Progressive Web Application (PWA), 
            and associated sub-systems (collectively, the &quot;Platform&quot;).
          </p>
          <p>
            The Platform provides an integrated ecosystem including: <strong>Zed Nav</strong> (civil administrative state machines and capture center trackers), 
            <strong>Zed Skill</strong> (data-light learning tracks and verified badging), <strong>Zed Market</strong> (escrow-backed micro-gigs), 
            <strong>Zed Meet</strong> (real-time WebRTC 1-on-1 networking and live audio spaces), <strong>Campus Hubs &amp; Academic Vault</strong> (university departmental networks and Alumni Office Hours), 
            <strong>Zed SOS</strong> (geospatial transit safety alerts), and the <strong>$ZED Token Engine</strong> (gamified proof-of-engagement reward system).
          </p>
          <p>
            For the purposes of the <strong>Nigeria Data Protection Act 2023 (&quot;NDPA&quot;)</strong> and the 
            Nigeria Data Protection Regulation (&quot;NDPR&quot;), Zed acts as the <strong>Data Controller</strong> in 
            respect of personal data collected through your interaction with the Platform. We are committed to operating in full accordance with the constitutional right to privacy under Section 37 of the Constitution of the Federal Republic of Nigeria 1999 (as amended).
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          2. Information We Collect Across Modules
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed adheres strictly to the principle of <em>Data Minimization</em> under Section 24 of the NDPA 2023. 
            We collect only the minimum personal data strictly necessary to deliver each modular service:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account Authentication Data:</strong> Mobile telephone number (utilized for transactional SMS/OTP verification), 
              full name, and optional avatar URL.
            </li>
            <li>
              <strong>Cryptographically Hashed Identity Data:</strong> When verifying your National Identity Number (NIN), it is processed strictly through a salted SHA-256 one-way cryptographic digest. The raw 11-digit numerical NIN is never written to physical disk or persisted in any database.
            </li>
            <li>
              <strong>Campus &amp; University Profiles:</strong> University affiliation (e.g., UNILAG, OAU, UI, FUTA, ABU, Covenant), department name, matriculation/graduation year, and student or alumni verification credentials.
            </li>
            <li>
              <strong>Marketplace Escrow Telemetry:</strong> Payout destination bank account numbers and account holder names (for disbursements to GTB, Kuda, OPay, Moniepoint, Zenith, etc.) and transaction reference tokens. Zed never collects or stores debit/credit card PANs or security PINs.
            </li>
            <li>
              <strong>Proof-of-Engagement &amp; Mining Logs:</strong> Daily mining timestamps, current streak counts, level progression status (Levels 1–5), and Cloudflare Turnstile hardware verification hashes used to detect automated bot manipulation.
            </li>
            <li>
              <strong>Voluntary Support &amp; Community Feedback:</strong> Inquiry logs, center wait-time reports, and PPA salary ratings voluntarily submitted by community members.
            </li>
            <li>
              <strong>Client-Side Local Storage:</strong> Procedural checklists, offline guide caches, and course notes stored locally on your device via IndexedDB and Service Worker caches.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          3. Strict Prohibition of Raw NIN Storage &amp; Cryptographic Hashing Protocol
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The National Identity Number (NIN) issued by the National Identity Management Commission (NIMC) 
            is a sensitive sovereign identifier. In recognition of the severe risks associated with centralized identity theft, 
            Zed enforces an architectural invariant:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono text-[#fafaf8]  space-y-2">
            <span className="font-bold text-[#3ecf8e] uppercase block">
              MANDATORY TECHNICAL PROTOCOL:
            </span>
            <p>
              1. 11-digit format audits occur client-side in the browser before network transmission.<br />
              2. Transmission to the backend server occurs strictly over an encrypted TLS 1.3 HTTPS connection.<br />
              3. Verification operates in sandbox demo mode. In volatile RAM, the raw string is combined with a secret cryptographic salt and transformed using SHA-256 into a 64-character hexadecimal digest.<br />
              4. The raw plaintext NIN is discarded immediately from memory. Only the salted hash token is persisted in the database.<br />
              5. Under no circumstances is a plaintext NIN written, logged, cached, or backed up on any physical storage media.
            </p>
          </div>
          <p>
            In the event of an unauthorized infrastructure breach, an adversary cannot reconstruct or extract your raw National 
            Identity Number from Zed records.
          </p>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          4. Lawful Bases for Processing under NDPA 2023
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Under Section 25 of the NDPA 2023, every data processing activity conducted by Zed is founded upon an explicit lawful basis:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Consent (Section 25(1)(a)):</strong> You provide specific, informed consent when registering an account, 
              initiating a speed match in Zed Meet, or enabling optional diagnostics in our Cookie Settings.
            </li>
            <li>
              <strong>Contractual Necessity (Section 25(1)(b)):</strong> Processing necessary to provide requested services, 
              such as milestone escrow releases in Zed Market, offline checklist synchronization, and token balance accounting.
            </li>
            <li>
              <strong>Legitimate Interests (Section 25(1)(f)):</strong> Maintaining platform security, executing anti-bot hardware 
              fingerprinting, and conducting NLP-based moderation to prevent scams and protect student safety.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          5. Purposes of Data Processing
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>Zed processes personal data strictly for defined and transparent operational purposes:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>To authenticate users via secure SMS OTP tokens without insecure permanent passwords.</li>
            <li>To run deterministic, client-side civil checklists for passport renewal, NYSC mobilization, and CAC registration.</li>
            <li>To manage escrow milestone disbursements for freelance gigs through licensed payment processors.</li>
            <li>To calculate proof-of-engagement mining multipliers and verify daily claim caps.</li>
            <li>To verify university student badges and facilitate 15-minute Alumni Office Hours sessions.</li>
            <li>To render crowd-sourced transit hazard alerts in Zed SOS without continuous personal tracking.</li>
            <li>To comply with regulatory audit requirements established by the Nigeria Data Protection Commission (NDPC).</li>
          </ol>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          6. Financial Privacy &amp; Zero-Fintech Compliance Model
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed operates under a zero-fintech compliance architecture. All $ZED tokens are engagement loyalty points calculated 
            off-chain. When users withdraw funds earned from marketplace gigs or convert $ZED tokens via monthly platform revenue pools:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Transactions route directly through Central Bank of Nigeria (CBN) licensed payment processors (Paystack, Flutterwave, and Monnify).</li>
            <li>Payment processors hold PCI-DSS Level 1 certification. Zed never captures, processes, or stores debit card PANs, CVVs, expiry dates, or banking PINs.</li>
            <li>Zed retains only settlement reference tokens and payout account metadata (bank name and account number) strictly necessary to facilitate bank transfers to verified Nigerian accounts.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          7. Real-Time WebRTC Audio &amp; Safety Buffer Protocol
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed Meet and Live Audio Rooms utilize WebRTC protocols for direct peer-to-peer audio and signaling communication:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Standard audio conversations in Zed Meet are transmitted in real time and are <strong>never recorded, transcribed, or stored</strong> on Zed servers during routine operation.</li>
            <li>
              <strong>Trust &amp; Safety Moderation Buffer:</strong> To protect young Nigerians from abuse, harassment, scams, and sexual solicitation, our client application maintains a temporary rolling 30-second audio buffer in volatile device memory. If and only if a user activates the <strong>1-Tap Block / Report</strong> trigger, this 30-second buffer is encrypted and transmitted securely to human moderators for incident verification. Unreported buffers are continuously overwritten and never reach our servers.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          8. Geospatial Data &amp; Safety Mapping (Zed SOS)
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed SOS powers a crowd-sourced geospatial map highlighting transit hazards, police checkpoints, and road conditions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Zed does <strong>not</strong> track, log, or record continuous 24/7 background geolocation data.</li>
            <li>Location access is requested only when a user explicitly submits a safety report or queries nearby alerts. Coordinates are processed via PostGIS spatial indexing with coarse precision to prevent pinpointing individual domestic dwellings.</li>
            <li>Hazard alerts automatically expire from the active map layer within 6 hours to preserve timeliness and prevent historical movement profiling.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          9. Data Retention &amp; Automated Deletion Schedules
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We retain personal data only for as long as strictly necessary to fulfill the specific purposes defined in this Policy:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Session Authentication Tokens:</strong> Invalidated after 30 days of inactivity.</li>
            <li><strong>Support Inquiries:</strong> Retained for 90 days following ticket resolution, then permanently purged.</li>
            <li><strong>Safety Incident Buffers:</strong> Deleted within 14 days following moderator review, unless preservation is required by a valid Nigerian court order.</li>
            <li><strong>Client-Side Local Storage:</strong> Procedural checklists and course summaries remain on your physical device until manually cleared or until selecting &quot;Reset Local Data&quot; in profile settings.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 10 ─────────────────────────────────────────────── */}
      <section id="section-10" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          10. Disclosure &amp; Sharing with Third-Party Processors
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed does not sell, lease, or trade personal data to advertising networks or data brokers. Data is shared exclusively 
            with vetted sub-processors bound by formal Data Processing Agreements (DPAs) compliant with NDPA 2023 standards:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Payment &amp; Escrow Gateways:</strong> Paystack, Flutterwave, and Monnify for domestic Nigerian bank transfers and milestone settlements.</li>
            <li><strong>SMS &amp; Telecommunication Aggregators:</strong> Licensed Nigerian telecommunication partners for transactional OTP delivery.</li>
            <li><strong>Cloud Infrastructure:</strong> SOC2 and ISO 27001 certified edge cloud hosting providers for encrypted database storage.</li>
            <li><strong>Law Enforcement &amp; Legal Compliance:</strong> Data disclosed only when strictly mandated by a valid subpoena or court order issued by a Nigerian court of competent jurisdiction.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 11 ─────────────────────────────────────────────── */}
      <section id="section-11" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          11. Cross-Border Data Transfers
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Where cloud edge infrastructure is hosted in distributed data centers (e.g., AWS Cape Town or edge CDN nodes), 
            Zed ensures full compliance with <strong>Part VI (Sections 41–43) of the NDPA 2023</strong>. Cross-border transfers 
            occur exclusively pursuant to standard contractual clauses ensuring equivalent safeguards to Nigerian legal standards.
          </p>
        </div>
      </section>

      {/* ── Section 12 ─────────────────────────────────────────────── */}
      <section id="section-12" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          12. Technical &amp; Organizational Security Measures
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed deploys rigorous technical safeguards engineered to protect citizen data:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enforced TLS 1.3 encryption in transit with HTTP Strict Transport Security (HSTS).</li>
            <li>Encrypted storage at rest using AES-256 for all persistent database volumes.</li>
            <li>Cloudflare Turnstile verification and rate-limiting to neutralize credential stuffing and automated mining bots.</li>
            <li>Principle of Least Privilege (PoLP) governing internal engineering access with hardware multi-factor authentication.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 13 ─────────────────────────────────────────────── */}
      <section id="section-13" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          13. Your Statutory Rights as a Data Subject
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>Under Part V of the NDPA 2023, you hold enforceable rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Right of Access &amp; Portability:</strong> Request a complete machine-readable copy of your profile data.</li>
            <li><strong>Right to Rectification:</strong> Update inaccurate phone numbers, profile names, or campus affiliations.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request the permanent deletion of your account and hashed identifiers.</li>
            <li><strong>Right to Object &amp; Withdraw Consent:</strong> Revoke consent for non-essential storage or close your account at any time.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 14 ─────────────────────────────────────────────── */}
      <section id="section-14" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          14. Protection of Minors &amp; Student Data
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed is designed for Nigerian youth aged 16 and above (including university undergraduates and NYSC corps members). 
            In compliance with Section 31 of the NDPA 2023, we do not knowingly solicit or process the personal data of children under 13 years of age. 
            If we discover that personal data of a child under 13 has been collected without verifiable parental consent, it will be deleted immediately.
          </p>
        </div>
      </section>

      {/* ── Section 15 ─────────────────────────────────────────────── */}
      <section id="section-15" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          15. Regulatory Recourse (NDPC) &amp; Data Protection Officer Contact
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            If you have questions, subject access requests, or believe your rights have not been respected, contact our Data Protection Officer:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#fafaf8] ">
            <strong>Data Protection Officer</strong><br />
            Zed Technologies Nigeria<br />
            Yaba Technology Corridor, Lagos State, Nigeria.<br />
            Email: <a href="mailto:privacy@zedproject.ng" className="text-[#3ecf8e] underline">privacy@zedproject.ng</a>
          </div>
          <p className="pt-2">
            You also have the statutory right to lodge a complaint directly with the primary supervisory authority:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#fafaf8] ">
            <strong>NIGERIA DATA PROTECTION COMMISSION (NDPC)</strong><br />
            No. 5, Charles de Gaulle Street, Asokoro, Abuja, Nigeria.<br />
            Official Portal: <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] underline">ndpc.gov.ng</a><br />
            Email: info@ndpc.gov.ng
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
