import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/site/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy – Compliance with NDPA 2023 & NDPR",
  description:
    "Comprehensive Privacy Policy of Zed. Technical details on zero raw NIN storage, salted SHA-256 server-side hashing, lawful bases, data subject rights, and NDPC regulatory recourse.",
  openGraph: {
    title: "Privacy Policy – Compliance with NDPA 2023 & NDPR",
    description:
      "Understand how Zed protects citizen data under the Nigeria Data Protection Act 2023.",
    url: "https://zedproject.ng/privacy",
  },
};

const TOC = [
  { id: "section-1", title: "Introduction & Identity of Data Controller" },
  { id: "section-2", title: "Information We Collect" },
  { id: "section-3", title: "Strict Prohibition of Raw NIN Storage & Cryptographic Hashing" },
  { id: "section-4", title: "Lawful Bases for Processing under NDPA 2023" },
  { id: "section-5", title: "Purposes of Data Processing" },
  { id: "section-6", title: "Data Retention & Storage Schedules" },
  { id: "section-7", title: "Disclosure & Sharing with Third-Party Processors" },
  { id: "section-8", title: "Cross-Border Data Transfers" },
  { id: "section-9", title: "Technical & Organizational Security Measures" },
  { id: "section-10", title: "Your Statutory Rights as a Data Subject" },
  { id: "section-11", title: "Protection of Minors & Children's Data" },
  { id: "section-12", title: "Complaints & Regulatory Recourse (NDPC)" },
  { id: "section-13", title: "Amendments & Modifications" },
  { id: "section-14", title: "Data Protection Officer Contact Information" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before launch.
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
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          1. Introduction &amp; Identity of the Data Controller
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates 
            the Zed civil navigation platform and Progressive Web Application (the &quot;Platform&quot;). 
            Zed is based in Lagos State, Nigeria.
          </p>
          <p>
            For the purposes of the <strong>Nigeria Data Protection Act 2023 (&quot;NDPA&quot;)</strong> and the 
            Nigeria Data Protection Regulation (&quot;NDPR&quot;), Zed acts as the <strong>Data Controller</strong> in 
            respect of the personal data collected through your interaction with our public marketing website, web application, 
            and associated communication channels.
          </p>
          <p>
            We are committed to operating our platform in accordance with the fundamental constitutional right to privacy 
            enshrined in Section 37 of the Constitution of the Federal Republic of Nigeria 1999 (as amended).
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          2. Information We Collect
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed adheres strictly to the principle of <em>Data Minimization</em> under Section 24 of the NDPA. 
            We collect only the minimum personal data strictly necessary to fulfill our civic advisory services:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account Authentication Data:</strong> Mobile telephone number (used for SMS OTP verification) 
              and optional display name.
            </li>
            <li>
              <strong>Cryptographically Hashed Identity Tokens:</strong> When you verify your National Identity Number (NIN), it is transmitted over an encrypted HTTPS connection to our backend server and converted into a one-way irreversible cryptographic digest using salted SHA-256. Under no circumstances is the raw 11-digit numerical NIN recorded or persisted in our databases.
            </li>
            <li>
              <strong>Inquiry &amp; Support Telemetry:</strong> Name, email address, inquiry topic, and message content 
              voluntarily provided when you communicate with our support desk via our contact interface.
            </li>
            <li>
              <strong>Local Checklist Preferences:</strong> Guide bookmarks, checklist completion flags, and chosen 
              procedural milestones. These are maintained directly within your local browser storage (IndexedDB / localStorage) 
              and are not synchronized to central servers unless you explicitly sign in.
            </li>
            <li>
              <strong>Aggregated Technical Telemetry:</strong> Anonymous performance diagnostics, including browser type, 
              operating system version, screen resolution, and error event logs, collected exclusively where consent has been granted.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          3. Strict Prohibition of Raw NIN Storage &amp; Cryptographic Hashing Protocol
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The National Identity Number (NIN) issued by the National Identity Management Commission (NIMC) 
            constitutes sensitive national identity data. In recognition of the extreme risks associated with 
            centralized identity theft and unauthorized profiling in Nigeria, Zed enforces the following architectural invariant:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono text-[#0B0B0C] dark:text-[#FAFAF8] space-y-2">
            <span className="font-bold text-[#3ecf8e] uppercase block">
              MANDATORY TECHNICAL PROTOCOL:
            </span>
            <p>
              1. Format checks on your NIN occur locally on your client device before submission.<br />
              2. When verification is initiated, the raw number is transmitted over an encrypted HTTPS connection to our backend server.<br />
              3. Verification currently operates in a demo sandbox environment (mock provider). On our server, the raw NIN is processed in volatile memory, converted into a one-way irreversible cryptographic digest using standard SHA-256 with a secret server salt, and the raw number is discarded immediately.<br />
              4. Only the salted SHA-256 hash is persisted in the database. Zed&apos;s infrastructure never writes, logs, caches, or persists plaintext NIN records on any physical disk or database.
            </p>
          </div>
          <p>
            Even in the hypothetical event of an unauthorized server breach, no adversary could extract your raw National 
            Identity Number from Zed infrastructure.
          </p>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          4. Lawful Bases for Processing under NDPA 2023
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Under Section 25 of the NDPA 2023, every processing activity conducted by Zed is founded upon a documented lawful basis:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Consent (Section 25(1)(a)):</strong> You provide specific, informed, and unambiguous consent when 
              opting in to account creation, submitting a contact inquiry, or activating analytics storage in our Cookie Banner.
            </li>
            <li>
              <strong>Contractual Necessity (Section 25(1)(b)):</strong> Processing necessary to provide the core civil 
              progress tracking and offline synchronization services requested by you.
            </li>
            <li>
              <strong>Legitimate Interests (Section 25(1)(f)):</strong> Maintaining the operational security, fraud prevention, 
              and technical resilience of the platform on Nigerian network infrastructure, balanced against your individual rights.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          5. Purposes of Data Processing
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>Zed processes collected information strictly for the following defined purposes:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>To verify mobile authentication tokens via SMS OTP to safeguard account access.</li>
            <li>To provide deterministic, personalized civil checklists for passport renewal, NYSC mobilization, and CAC registration.</li>
            <li>To perform local document auditing (checking image byte sizes against government 200KB limits).</li>
            <li>To provide timely responses to support queries, error reports, and user feedback.</li>
            <li>To comply with regulatory audit requirements established by the Nigeria Data Protection Commission (NDPC).</li>
          </ol>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          6. Data Retention &amp; Storage Schedules
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We retain personal data only for the duration necessary to satisfy the specific purposes outlined in this Policy:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Authentication Logs &amp; Session Tokens:</strong> Retained for a maximum of 30 days following session 
              inactivity, after which they are permanently invalidated and purged.
            </li>
            <li>
              <strong>Support Inquiries:</strong> Retained for 90 days following resolution of the support ticket, after which 
              transcripts are deleted.
            </li>
            <li>
              <strong>Client-Side Local Storage:</strong> Checklists and bookmarks remain on your physical device until you 
              manually clear your browser cache or select &quot;Reset Local Data&quot; in the application profile.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          7. Disclosure &amp; Sharing with Third-Party Processors
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed does not sell, lease, or monetize your personal data. We disclose information only to vetted third-party 
            sub-processors operating under strict Data Processing Agreements (DPAs) compliant with NDPA standards:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>SMS Telecommunications Gateways:</strong> Licensed Nigerian telecommunication aggregators solely for 
              delivering transactional one-time verification passwords.
            </li>
            <li>
              <strong>Cloud Infrastructure Providers:</strong> Secure, SOC2/ISO 27001 certified cloud database and hosting 
              partners utilizing enterprise-grade physical security and encrypted volumes.
            </li>
            <li>
              <strong>Law Enforcement &amp; Legal Process:</strong> We may disclose data only when strictly compelled by a 
              valid court order issued by a Nigerian court of competent jurisdiction under the laws of the Federal Republic of Nigeria.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          8. Cross-Border Data Transfers
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Where technical sub-processors (such as global distributed cloud networks) process telemetry outside the Federal 
            Republic of Nigeria, Zed ensures compliance with <strong>Part VI (Sections 41&ndash;43) of the NDPA 2023</strong>. 
            Transfers are executed only to jurisdictions offering adequate data protection mechanisms or pursuant to standard 
            contractual clauses approved by the NDPC.
          </p>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          9. Technical &amp; Organizational Security Measures
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed implements multi-layered security controls to protect citizen data against accidental destruction, unauthorized 
            access, and alteration:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enforced Transport Layer Security (TLS 1.3) with HTTP Strict Transport Security (HSTS) across all endpoints.</li>
            <li>Encrypted storage at rest using AES-256 for all persistent database volumes.</li>
            <li>Rate limiting and automated web application firewall (WAF) mitigation against brute force and credential stuffing attacks.</li>
            <li>Principle of Least Privilege (PoLP) governing internal engineering access with multi-factor hardware keys.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 10 ─────────────────────────────────────────────── */}
      <section id="section-10" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          10. Your Statutory Rights as a Data Subject
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Under Part V (Sections 34&ndash;40) of the NDPA 2023, you possess the following enforceable statutory rights:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Right to Confirmation &amp; Access (Section 34):</strong> Obtain confirmation of whether we process your data and receive a readable copy.</li>
            <li><strong>Right to Rectification (Section 35):</strong> Request prompt correction of inaccurate or incomplete personal records.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;, Section 36):</strong> Demand complete deletion of your records from our systems without undue delay.</li>
            <li><strong>Right to Restriction of Processing (Section 37):</strong> Restrict the scope of processing under contested accuracy circumstances.</li>
            <li><strong>Right to Data Portability (Section 38):</strong> Receive your personal data in a structured, machine-readable format (JSON).</li>
            <li><strong>Right to Object &amp; Withdraw Consent (Section 39):</strong> Object to any processing founded upon legitimate interests or withdraw consent at any time without penalty.</li>
          </ul>
          <p>
            To exercise any of these rights, transmit an electronic request to our Data Protection Officer at{" "}
            <a href="mailto:privacy@zedproject.ng" className="text-[#3ecf8e] underline font-mono">
              privacy@zedproject.ng
            </a>. We respond within statutory deadlines (maximum 30 calendar days).
          </p>
        </div>
      </section>

      {/* ── Section 11 ─────────────────────────────────────────────── */}
      <section id="section-11" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          11. Protection of Minors &amp; Children&apos;s Data
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            In compliance with Section 31 of the NDPA 2023, Zed does not knowingly process personal data of individuals 
            under the age of 13 without verifiable consent from a parent or legal guardian. Where our guides discuss minor 
            passports (under 18), instructions are directed to parents and legal guardians.
          </p>
        </div>
      </section>

      {/* ── Section 12 ─────────────────────────────────────────────── */}
      <section id="section-12" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          12. Regulatory Recourse &amp; Complaints (NDPC)
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            If you believe that Zed has processed your personal data in violation of the NDPA 2023 or that your data subject 
            rights have been compromised, you have the statutory right to file a formal complaint with the primary supervisory authority:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#0B0B0C] dark:text-[#FAFAF8]">
            <strong>NIGERIA DATA PROTECTION COMMISSION (NDPC)</strong><br />
            No. 5, Charles de Gaulle Street, Asokoro, Abuja, Nigeria.<br />
            Official Portal: <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] underline">ndpc.gov.ng</a><br />
            Email: info@ndpc.gov.ng
          </div>
          <p>
            We respectfully request that you notify our internal Data Protection Officer first so we may resolve your concern immediately.
          </p>
        </div>
      </section>

      {/* ── Section 13 ─────────────────────────────────────────────── */}
      <section id="section-13" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          13. Amendments &amp; Modifications to this Policy
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed reserves the right to amend this Privacy Policy to reflect evolving regulatory directives issued by the NDPC 
            or changes in technical infrastructure. Any material modifications will be prominently displayed on the marketing 
            site with an updated &quot;Effective Date&quot; at least 14 days prior to taking effect.
          </p>
        </div>
      </section>

      {/* ── Section 14 ─────────────────────────────────────────────── */}
      <section id="section-14" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          14. Data Protection Officer Contact Information
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            For all inquiries, subject access requests, or privacy concerns, contact our designated Data Protection Officer:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#0B0B0C] dark:text-[#FAFAF8]">
            <strong>Data Protection Officer</strong><br />
            Zed<br />
            Yaba Technology Corridor, Lagos State, Nigeria.<br />
            Email: <a href="mailto:privacy@zedproject.ng" className="text-[#3ecf8e] underline">privacy@zedproject.ng</a>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
