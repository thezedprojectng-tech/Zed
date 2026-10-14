"use client";

import { LegalPageLayout } from "@/components/site/LegalPageLayout";
import { openCookieSettings } from "@/components/site/CookieBanner";
import { SlidersHorizontal } from "lucide-react";

const TOC = [
  { id: "section-1", title: "Introduction & Scope" },
  { id: "section-2", title: "What are Cookies & Local Storage Technologies?" },
  { id: "section-3", title: "Why Zed Uses Client-Side Storage" },
  { id: "section-4", title: "Categories of Cookies & Local Storage We Use" },
  { id: "section-5", title: "Comprehensive Storage Inventory Table" },
  { id: "section-6", title: "Interactive Preference Controls & Cookie Settings" },
  { id: "section-7", title: "Browser-Level Controls & Clearing Cache" },
  { id: "section-8", title: "Updates to this Policy" },
  { id: "section-9", title: "Contact Us" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before launch.
 */
export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie & Storage Policy"
      subtitle="Detailed technical inventory of how Zed utilizes cookies, local storage, and Service Worker caches to provide offline civil guides and privacy-preserving sessions."
      lastUpdated="October 14, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          1. Introduction &amp; Scope
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            This Cookie &amp; Storage Policy explains how Zed (&quot;we&quot;, 
            &quot;us&quot;) uses cookies, IndexedDB, and web storage mechanisms when you interact with our marketing 
            website and civil navigation application.
          </p>
          <p>
            Zed does not participate in behavioral ad retargeting networks. We use client-side storage technologies 
            primarily to ensure our playbooks remain accessible offline when you are physically present at government 
            centers with poor or zero cellular reception.
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          2. What are Cookies &amp; Local Storage Technologies?
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            Modern web applications utilize several distinct client-side storage technologies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>HTTP Cookies:</strong> Small strings of text placed on your device by a web server. Cookies may 
              be &quot;session cookies&quot; (deleted when you close your browser) or &quot;persistent cookies&quot; 
              (retained until an expiration date).
            </li>
            <li>
              <strong>HTML5 Web Storage (localStorage &amp; sessionStorage):</strong> Key-value data stores embedded 
              in your browser that allow persistent storage without transmitting data in HTTP request headers.
            </li>
            <li>
              <strong>IndexedDB:</strong> A transactional, client-side object database that enables Zed to store 
              high-volume civil guides, checklists, and document templates for offline execution.
            </li>
            <li>
              <strong>Service Worker Cache:</strong> A script running in the background that intercepts network requests 
              and serves cached assets during network dropouts.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          3. Why Zed Uses Client-Side Storage
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>We deploy storage technologies strictly for three primary operational objectives:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Essential Security &amp; Session Continuity:</strong> Maintaining authenticated state and verifying cross-site request forgery (CSRF) tokens.</li>
            <li><strong>Offline Resiliency:</strong> Persisting procedural checklists and fee audit templates so they operate in cellular dead zones.</li>
            <li><strong>User Experience Preferences:</strong> Remembering whether you prefer our light paper theme or inverted dark theme, and recording your cookie consent preferences.</li>
          </ol>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          4. Categories of Storage We Use
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>We categorize all client-side storage mechanisms into three functional tiers:</p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong>Tier 1: Strictly Essential (Always Active)</strong><br />
              These elements are indispensable for the website to function. They include authentication session tokens, 
              CSRF protection, and your cookie consent status. Because the site cannot operate safely without them, 
              they do not require prior consent under the NDPA.
            </li>
            <li>
              <strong>Tier 2: Functional &amp; Preferences (Configurable)</strong><br />
              These elements remember your chosen settings, such as your theme choice (Light vs Dark) 
              and locally pinned guide bookmarks. Disabling them may reset your visual theme between visits.
            </li>
            <li>
              <strong>Tier 3: Anonymous Diagnostics &amp; Telemetry (Optional)</strong><br />
              Aggregated, privacy-preserving performance counters measuring page load latency, network disconnect errors, 
              and Service Worker cache hit rates. No personal identifiers or phone numbers are linked to these metrics.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          5. Comprehensive Storage Inventory Table
        </h2>
        <div className="overflow-x-auto rounded-lg border border-[#E5E5E0] dark:border-white/10">
          <table className="w-full text-left font-mono text-xs text-[#0B0B0C] dark:text-[#FAFAF8] border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E0] dark:border-white/10 bg-[#f4f4f0] dark:bg-white/[0.04]">
                <th className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">Identifier</th>
                <th className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">Type</th>
                <th className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">Category</th>
                <th className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">Lifespan</th>
                <th className="p-3 font-bold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0] dark:divide-white/10">
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">sb-*-auth-token</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Cookie / Storage</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 text-[#0e7048] dark:text-[#3ecf8e] font-semibold">Essential</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Session (30 days)</td>
                <td className="p-3">Maintains encrypted user authentication session.</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">zed_cookie_consent_v1</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">localStorage</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 text-[#0e7048] dark:text-[#3ecf8e] font-semibold">Essential</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Persistent (1 year)</td>
                <td className="p-3">Records your cookie choices so banner does not reappear.</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">zed-theme-v2</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">localStorage</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Preferences</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Persistent</td>
                <td className="p-3">Saves your preferred theme (Light vs Dark).</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">zed_nav_checklists</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">IndexedDB</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Preferences</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Persistent</td>
                <td className="p-3">Stores your personal checklist progress offline.</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10 font-bold">zed_telemetry_diag</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">localStorage</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">Analytics</td>
                <td className="p-3 border-r border-[#E5E5E0] dark:border-white/10">30 days</td>
                <td className="p-3">Aggregated anonymous error counts (only with consent).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          6. Interactive Preference Controls &amp; Cookie Settings
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-4">
          <p>
            You retain sovereign control over which non-essential storage categories Zed may employ on this browser. 
            You can reopen your settings modal at any point to update or withdraw consent:
          </p>
          <div>
            <button
              type="button"
              onClick={openCookieSettings}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] hover:bg-[#f4f4f0] dark:hover:bg-white/[0.04] text-[#0B0B0C] dark:text-[#FAFAF8] font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#3ecf8e]" />
              <span>Open Cookie Preference Center</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          7. Browser-Level Controls &amp; Clearing Cache
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            In addition to our preference modal, you can delete or block cookies and storage directly through your 
            browser settings:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Apple Safari (iOS / macOS):</strong> Settings &rarr; Safari &rarr; Advanced &rarr; Website Data &rarr; Remove All.</li>
            <li><strong>Google Chrome (Android / Desktop):</strong> Settings &rarr; Privacy and Security &rarr; Clear Browsing Data &rarr; Cookies and other site data.</li>
            <li><strong>Mozilla Firefox:</strong> Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data &rarr; Clear Data.</li>
          </ul>
          <p>
            Please note that wiping IndexedDB will erase any locally bookmarked checklists that you have not synchronized 
            to an authenticated account.
          </p>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          8. Updates to this Policy
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We may update our Cookie &amp; Storage Policy to reflect changes in technical features or emerging standards 
            enforced by the Nigeria Data Protection Commission (NDPC). The latest revision date will always be visible 
            at the top of this page.
          </p>
        </div>
      </section>

      {/* ── Section 9 ──────────────────────────────────────────────── */}
      <section id="section-9" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          9. Contact Us
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            If you have technical questions regarding our storage mechanisms or offline cache implementation, reach out:
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#0B0B0C] dark:text-[#FAFAF8]">
            <strong>Technical Privacy Desk</strong><br />
            Zed<br />
            Email: <a href="mailto:privacy@zedproject.ng" className="text-[#3ecf8e] underline">privacy@zedproject.ng</a>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
