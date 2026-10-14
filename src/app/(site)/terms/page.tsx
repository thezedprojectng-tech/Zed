import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/site/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service – Legal Agreement & Platform Conditions",
  description:
    "Terms of Service governing the use of Zed civil navigation playbooks, document auditing tools, and platform interfaces. Non-affiliation with government agencies and verification requirements.",
  openGraph: {
    title: "Terms of Service – Legal Agreement & Platform Conditions",
    description:
      "Review the Terms of Service for Zed Technologies Nigeria Ltd.",
    url: "https://zedproject.ng/terms",
  },
};

const TOC = [
  { id: "section-1", title: "Acceptance of Terms & Binding Agreement" },
  { id: "section-2", title: "Eligibility & Age Requirements" },
  { id: "section-3", title: "Nature of the Service & Non-Affiliation Disclaimer" },
  { id: "section-4", title: "User Accounts, Authentication & Security" },
  { id: "section-5", title: "Acceptable Use & Prohibited Conduct" },
  { id: "section-6", title: "Intellectual Property Rights" },
  { id: "section-7", title: "No Legal, Financial, or Official Government Advice" },
  { id: "section-8", title: "Statutory Fee Estimates & External Portals" },
  { id: "section-9", title: "Disclaimers & Limitation of Warranties" },
  { id: "section-10", title: "Limitation of Liability" },
  { id: "section-11", title: "Indemnification" },
  { id: "section-12", title: "Suspension, Termination & Access Restriction" },
  { id: "section-13", title: "Governing Law & Dispute Resolution" },
  { id: "section-14", title: "Modifications to Terms" },
  { id: "section-15", title: "Contact Information" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before launch.
 */
export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The contractual framework and operating terms governing your access to and use of Zed civil playbooks, software applications, and documentation."
      lastUpdated="October 14, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          1. Acceptance of Terms &amp; Binding Agreement
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding contractual agreement between you 
            (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Zed Technologies Nigeria Ltd (&quot;Zed&quot;, 
            &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the Zed marketing website, 
            Progressive Web Application, and associated civil tools (collectively, the &quot;Platform&quot;).
          </p>
          <p>
            By accessing, browsing, downloading, or utilizing any portion of the Platform, you acknowledge that you have 
            read, understood, and unconditionally agree to be bound by these Terms and our Privacy Policy. If you do not 
            agree to these Terms, you must discontinue use of the Platform immediately.
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          2. Eligibility &amp; Age Requirements
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            You must be at least 18 years of age or possess the legal capacity to enter into binding contracts under 
            the Laws of the Federal Republic of Nigeria to create an account or use interactive features on the Platform. 
            If you are accessing the Platform on behalf of an incorporated entity, company, or organization, you represent 
            and warrant that you possess full corporate authority to bind that entity to these Terms.
          </p>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          3. Nature of the Service &amp; Non-Affiliation Disclaimer
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-xs font-mono text-[#0B0B0C] dark:text-[#FAFAF8] space-y-2">
            <span className="font-bold text-[#3ecf8e] uppercase block">
              CRITICAL STATUTORY NOTICE:
            </span>
            <p>
              ZED TECHNOLOGIES NIGERIA LTD IS AN INDEPENDENT CIVIC TECHNOLOGY COMPANY AND IS NOT AFFILIATED, ASSOCIATED, 
              AUTHORIZED, ENDORSED BY, OR IN ANY WAY OFFICIALLY CONNECTED WITH THE FEDERAL GOVERNMENT OF NIGERIA, 
              THE NIGERIA IMMIGRATION SERVICE (NIS), THE NATIONAL YOUTH SERVICE CORPS (NYSC), THE NATIONAL IDENTITY 
              MANAGEMENT COMMISSION (NIMC), THE CORPORATE AFFAIRS COMMISSION (CAC), OR ANY OF THEIR SUBSIDIARIES OR AFFILIATES.
            </p>
          </div>
          <p>
            Zed does not issue international passports, national identity slips, NYSC discharge/exemption certificates, 
            or CAC certificates of incorporation. Zed provides deterministic organizational playbooks, statutory fee calculations, 
            and educational guidelines designed to assist citizens in self-navigating official public services.
          </p>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          4. User Accounts, Authentication &amp; Security
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Certain features of the Platform may require authentication via a valid Nigerian mobile phone number and 
            One-Time Password (OTP). You agree to provide true, accurate, and current information. You are solely responsible 
            for safeguarding your mobile device and authentication tokens, and you agree to notify Zed immediately upon 
            discovering any unauthorized access or breach of security.
          </p>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          5. Acceptable Use &amp; Prohibited Conduct
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>You agree to use the Platform strictly for lawful purposes. You expressly covenant NOT to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Submit fabricated, forged, altered, or stolen national identity credentials or documents.</li>
            <li>Use the Platform to facilitate unauthorized commercial touting, illegal document fabrication, or extortion of fellow citizens.</li>
            <li>Interfere with, intercept, or reverse engineer any software, scripts, or security controls deployed on the Platform.</li>
            <li>Scrape, harvest, or bulk-extract Zed playbooks, checklists, or data using automated spiders, bots, or scrapers without express written authorization.</li>
            <li>Transmit malware, viruses, worms, or malicious code designed to disrupt client devices or our infrastructure.</li>
          </ul>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          6. Intellectual Property Rights
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The Platform, including its user interface design, visual identity, branding (&quot;ZED&quot;, &quot;ZED.NG&quot;), 
            typography, proprietary checklists, editorial flowcharts, and source code, is the exclusive intellectual property 
            of Zed Technologies Nigeria Ltd and is protected under the Copyright Act 2022 of Nigeria and international intellectual 
            property treaties.
          </p>
          <p>
            Subject to your compliance with these Terms, Zed grants you a personal, revocable, non-exclusive, non-transferable 
            license to view and interact with the content strictly for personal, non-commercial civic navigation.
          </p>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          7. No Legal, Financial, or Official Government Advice
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The content, playbooks, calculators, and explanations provided on Zed are for general informational, educational, 
            and navigational guidance only. <strong>They do not constitute formal legal advice, certified tax advisory, 
            or official government pronouncements.</strong>
          </p>
          <p>
            Government administrative rules, circulars, and executive directives in Nigeria change frequently. Users are 
            obligated to verify all procedural requirements and statutory rates directly with the designated statutory 
            authority (e.g., official NIS, NYSC, NIMC, or CAC gazettes and counter desks).
          </p>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          8. Statutory Fee Estimates &amp; External Portals
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed publishes statutory fee estimates based on published government gazettes and Remita gateway schedules. 
            However, Zed does not control payment gateways or banking transaction fees. When you leave Zed to complete 
            payments on external government portals (e.g., Remita, NIS portal, CAC CRP), you are governed by the third-party 
            terms and privacy policies of those independent entities.
          </p>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          9. Disclaimers &amp; Limitation of Warranties
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
            PURPOSE, TIMELINESS, OR NON-INFRINGEMENT.
          </p>
          <p>
            Zed does not warrant that the Platform will be uninterrupted, error-free, secure, or that governmental authorities 
            will approve your specific passport application, NYSC mobilization, or business name filing.
          </p>
        </div>
      </section>

      {/* ── Section 10 ─────────────────────────────────────────────── */}
      <section id="section-10" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          10. Limitation of Liability
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY NIGERIAN LAW, IN NO EVENT SHALL ZED TECHNOLOGIES NIGERIA LTD, ITS DIRECTORS, 
            EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
            INCLUDING LOSS OF PROFITS, TRAVEL CANCELLATIONS, EMPLOYMENT MISSED DEADLINES, OR DELAYS RESULTING FROM 
            GOVERNMENTAL ACTIONS, HOWSOEVER ARISING.
          </p>
          <p>
            OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THESE TERMS SHALL NOT EXCEED THE TOTAL 
            SUM OF ₦10,000 (TEN THOUSAND NAIRA) OR THE TOTAL FEES PAID BY YOU TO ZED IN THE PRECEDING THREE MONTHS, 
            WHICHEVER IS LESS.
          </p>
        </div>
      </section>

      {/* ── Section 11 ─────────────────────────────────────────────── */}
      <section id="section-11" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          11. Indemnification
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            You agree to defend, indemnify, and hold harmless Zed Technologies Nigeria Ltd, its officers, directors, 
            and employees from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses 
            (including reasonable legal fees) arising out of or relating to your violation of these Terms, your misuse 
            of the Platform, or your submission of fraudulent documents to statutory authorities.
          </p>
        </div>
      </section>

      {/* ── Section 12 ─────────────────────────────────────────────── */}
      <section id="section-12" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          12. Suspension, Termination &amp; Access Restriction
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed reserves the right, in its sole discretion and without prior notice, to terminate or suspend your access 
            to all or part of the Platform for conduct that Zed believes violates these Terms, harms other citizens, 
            or infringes upon third-party rights.
          </p>
        </div>
      </section>

      {/* ── Section 13 ─────────────────────────────────────────────── */}
      <section id="section-13" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          13. Governing Law &amp; Dispute Resolution
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            These Terms and any dispute or claim arising out of them shall be governed by, and construed in accordance with, 
            the <strong>Laws of the Federal Republic of Nigeria</strong>.
          </p>
          <p>
            Any dispute arising out of or in connection with these Terms shall first be submitted to good-faith mediation 
            at the Lagos Multi-Door Courthouse (LMDC). Where mediation fails within 30 days of notice, the dispute shall 
            be referred to and finally resolved by arbitration in Lagos under the Arbitration and Mediation Act 2023.
          </p>
        </div>
      </section>

      {/* ── Section 14 ─────────────────────────────────────────────── */}
      <section id="section-14" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          14. Modifications to Terms
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Zed may revise these Terms from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; 
            date at the top of this document. Continued use of the Platform after such modifications constitutes acceptance 
            of the updated Terms.
          </p>
        </div>
      </section>

      {/* ── Section 15 ─────────────────────────────────────────────── */}
      <section id="section-15" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          15. Contact Information
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            For legal inquiries or notices regarding these Terms, contact our legal counsel:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#0B0B0C] dark:text-[#FAFAF8]">
            <strong>Legal Department</strong><br />
            Zed Technologies Nigeria Ltd.<br />
            Yaba Technology Corridor, Lagos State, Nigeria.<br />
            Email: <a href="mailto:legal@zedproject.ng" className="text-[#3ecf8e] underline">legal@zedproject.ng</a>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
