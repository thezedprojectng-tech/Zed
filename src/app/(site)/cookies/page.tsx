"use client";

import { LegalPageLayout } from "@/components/site/LegalPageLayout";
import { openCookieSettings } from "@/components/site/CookieBanner";
import { SlidersHorizontal, HardDrive, Wifi, ShieldCheck, Zap } from "lucide-react";

const TOC = [
  { id: "section-1", title: "Introduction & Scope" },
  { id: "section-2", title: "PWA Low-Data Architecture & Offline Storage" },
  { id: "section-3", title: "Storage Technologies We Deploy" },
  { id: "section-4", title: "Categories of Client-Side Storage" },
  { id: "section-5", title: "Comprehensive Storage Inventory Table" },
  { id: "section-6", title: "Interactive Preference Controls & Cookie Settings" },
  { id: "section-7", title: "Browser-Level Controls & Cache Management" },
  { id: "section-8", title: "Updates to this Policy & Contact Information" },
];

/**
 * LEGAL REVIEW NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before production launch.
 */
export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie & Storage Policy"
      subtitle="Detailed technical inventory of how Zed utilizes cookies, local storage, and Service Worker caches to provide offline civil playbooks and privacy-preserving sessions across Nigerian networks."
      lastUpdated="October 14, 2026"
      toc={TOC}
    >
      {/* ── Section 1 ──────────────────────────────────────────────── */}
      <section id="section-1" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          1. Introduction &amp; Scope
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            This Cookie &amp; Storage Policy explains how Zed (&quot;we&quot;, &quot;us&quot;) utilizes cookies, 
            HTML5 Web Storage, IndexedDB, and Service Worker caches across our public website and Progressive Web Application (PWA).
          </p>
          <p>
            Zed does <strong>not</strong> deploy behavioral advertising retargeting networks, cross-site trackers, or marketing pixels. 
            We utilize client-side storage mechanisms primarily to fulfill our core architectural directive: 
            ensuring civil administrative playbooks, course notes, and requirement checklists remain 100% operational offline 
            when Nigerian citizens are inside government capture basements with zero cellular connectivity.
          </p>
        </div>
      </section>

      {/* ── Section 2 ──────────────────────────────────────────────── */}
      <section id="section-2" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C]">
          2. PWA Low-Data Architecture &amp; Offline Storage
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            The Zed platform is engineered as a mobile-first PWA with an ultra-light bundle footprint (&lt; 1.8MB). 
            To accommodate weak 3G and 4G networks (MTN, Airtel, Glo, 9mobile), Zed uses aggressive local caching:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] space-y-2">
              <Wifi className="h-4 w-4 text-[#3ecf8e]" />
              <h4 className="font-display font-semibold text-xs text-[#fafaf8] ">Zero Data Waste</h4>
              <p className="text-xs text-[#57575e] dark:text-[#9c9ca4]">Core JSON playbooks are downloaded once and re-validated only when official fees update.</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] space-y-2">
              <HardDrive className="h-4 w-4 text-[#3ecf8e]" />
              <h4 className="font-display font-semibold text-xs text-[#fafaf8] ">Basement Resiliency</h4>
              <p className="text-xs text-[#57575e] dark:text-[#9c9ca4]">Checklists and photo dimension audits run client-side in physical capture centers with zero signal.</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] space-y-2">
              <ShieldCheck className="h-4 w-4 text-[#3ecf8e]" />
              <h4 className="font-display font-semibold text-xs text-[#0B0B0C] ">Zero Cloud Tracking</h4>
              <p className="text-xs text-[#57575e] dark:text-[#9c9ca4]">Unsubmitted form drafts remain stored locally on your device rather than on remote servers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 ──────────────────────────────────────────────── */}
      <section id="section-3" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          3. Storage Technologies We Deploy
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>HTTP Cookies:</strong> Encrypted text tokens placed on your device to maintain secure authentication sessions and verify CSRF tokens.
            </li>
            <li>
              <strong>HTML5 LocalStorage:</strong> Key-value browser storage used for persistent client preferences, such as your dark/light theme choice and cookie consent records.
            </li>
            <li>
              <strong>IndexedDB:</strong> A client-side transactional database used by Zed to cache complex step-by-step state machine guides, checklist states, and downloadable PDF summaries for offline access.
            </li>
            <li>
              <strong>Service Worker Cache:</strong> Background scripts that intercept network requests to instantly deliver cached application shells and static icons during internet outages.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 4 ──────────────────────────────────────────────── */}
      <section id="section-4" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          4. Categories of Client-Side Storage
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>We classify our client-side storage technologies into three operational categories:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Strictly Necessary Storage (Always Active):</strong> Essential for session authentication, 
              CSRF protection, Cloudflare Turnstile anti-bot hardware verification, and offline PWA capability. These cannot be disabled.
            </li>
            <li>
              <strong>Functional &amp; Preference Storage:</strong> Remembers your chosen theme mode, collapsed sidebar state, 
              and active module filters.
            </li>
            <li>
              <strong>Performance &amp; Diagnostic Telemetry (Optional):</strong> Measures load times and client error events 
              to troubleshoot weak network performance across Nigerian telecommunications networks.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Section 5 ──────────────────────────────────────────────── */}
      <section id="section-5" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          5. Comprehensive Storage Inventory Table
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-[#fafaf8]  font-mono uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Identifier</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Lifespan</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0] dark:divide-white/10 text-[#57575e] dark:text-[#9c9ca4]">
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">zed_session</td>
                <td className="py-3 px-4">HTTP Cookie</td>
                <td className="py-3 px-4">Session / 30 Days</td>
                <td className="py-3 px-4 text-[#3ecf8e] font-semibold">Essential</td>
                <td className="py-3 px-4">Cryptographically authenticated user session token.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">cf_clearance</td>
                <td className="py-3 px-4">HTTP Cookie</td>
                <td className="py-3 px-4">1 Year</td>
                <td className="py-3 px-4 text-[#3ecf8e] font-semibold">Essential</td>
                <td className="py-3 px-4">Cloudflare Turnstile token to verify genuine human activity and block bot mining.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">zed_cookie_consent_v1</td>
                <td className="py-3 px-4">LocalStorage</td>
                <td className="py-3 px-4">Persistent</td>
                <td className="py-3 px-4 text-[#3ecf8e] font-semibold">Essential</td>
                <td className="py-3 px-4">Records your cookie choices so the banner does not repeatedly disrupt browsing.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">zed_nav_cache</td>
                <td className="py-3 px-4">IndexedDB</td>
                <td className="py-3 px-4">Persistent</td>
                <td className="py-3 px-4 text-[#3ecf8e] font-semibold">Essential</td>
                <td className="py-3 px-4">Stores procedural JSON playbooks for offline zero-connectivity navigation.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">zed_theme</td>
                <td className="py-3 px-4">LocalStorage</td>
                <td className="py-3 px-4">Persistent</td>
                <td className="py-3 px-4">Functional</td>
                <td className="py-3 px-4">Maintains your light/dark user interface preference.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-medium text-[#0B0B0C] ">zed_flow_progress</td>
                <td className="py-3 px-4">LocalStorage</td>
                <td className="py-3 px-4">Persistent</td>
                <td className="py-3 px-4">Functional</td>
                <td className="py-3 px-4">Retains active checklist step positions on your device before cloud synchronization.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 6 ──────────────────────────────────────────────── */}
      <section id="section-6" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          6. Interactive Preference Controls &amp; Cookie Settings
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-4">
          <p>
            You can modify your cookie and local storage preferences at any time. You can choose to enable or disable 
            functional preferences and anonymous telemetry without affecting your access to free civic playbooks.
          </p>
          <div>
            <button
              type="button"
              onClick={openCookieSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B0B0C] dark:bg-white text-white dark:text-[#0B0B0C] text-xs font-semibold hover:bg-[#1a1a1e] dark:hover:bg-[#E5E5E0] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#3ecf8e]" />
              <span>Open Cookie &amp; Storage Settings</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 7 ──────────────────────────────────────────────── */}
      <section id="section-7" className="space-y-4 scroll-mt-28 border-b border-[#E5E5E0] dark:border-white/10 pb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          7. Browser-Level Controls &amp; Cache Management
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            In addition to our interactive settings, modern web browsers allow you to block cookies or clear local storage caches manually:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Google Chrome &amp; Edge:</strong> Settings &gt; Privacy and Security &gt; Clear Browsing Data &gt; Cookies and Other Site Data.</li>
            <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Clear Data.</li>
            <li><strong>Apple Safari:</strong> Settings &gt; Safari &gt; Clear History and Website Data.</li>
          </ul>
          <p>
            Please note that clearing IndexedDB or blocking storage will remove offline playbooks from your device, 
            requiring an internet connection to re-download the guides upon your next visit.
          </p>
        </div>
      </section>

      {/* ── Section 8 ──────────────────────────────────────────────── */}
      <section id="section-8" className="space-y-4 scroll-mt-28">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0B0C] ">
          8. Updates to this Policy &amp; Contact Information
        </h2>
        <div className="font-sans text-sm text-[#57575e] dark:text-[#9c9ca4] leading-relaxed space-y-3">
          <p>
            We may update this Cookie &amp; Storage Policy as new modules are deployed to the Zed platform. 
            All modifications will be posted here with an updated effective date.
          </p>
          <div className="p-4 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#141416] text-xs font-mono space-y-1 text-[#fafaf8] ">
            <strong>Privacy &amp; Technical Governance</strong><br />
            Zed Technologies Nigeria<br />
            Email: <a href="mailto:privacy@zedproject.ng" className="text-[#3ecf8e] underline">privacy@zedproject.ng</a>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
