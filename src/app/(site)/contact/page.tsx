import type { Metadata } from "next";
import Image from "next/image";
import { Mail, Sparkles, ArrowRight, MessageSquare } from "lucide-react";
import { FadeIn } from "@/components/site/FadeIn";
import { Accordion, type AccordionItemData } from "@/components/site/Accordion";
import { ClosingCTA } from "@/components/site/ClosingCTA";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Get in touch with Zed",
  description:
    "Have questions or need support? Zed is designed to help businesses and individuals capture, engage, and grow. Reach out to our dedicated support team today.",
  openGraph: {
    title: "Get in touch with Zed",
    description:
      "Zed is designed to help businesses and individuals capture, engage, and grow, all in one powerful platform.",
    url: "https://zedproject.ng/contact",
    type: "website",
  },
};

const FAQ_ITEMS: AccordionItemData[] = [
  {
    question: "What is Zed?",
    answer:
      "Zed is an all-in-one digital operating system and civic management platform that helps individuals and businesses navigate paperwork, track progress, and acquire modern digital skills faster using intelligent insights.",
  },
  {
    question: "Does Zed integrate with CRM tools?",
    answer:
      "Yes! Zed provides modern REST APIs and real-time webhook endpoints that integrate seamlessly with popular CRM platforms, email notifications, and automated workflow suites.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, you can get started immediately with full access to standard civic guides, verification tracking, and core learning modules without needing a credit card.",
  },
  {
    question: "How do I get dedicated onboarding for my organization?",
    answer:
      "Our team provides white-glove onboarding and dedicated technical assistance for institutions, universities, and enterprise teams. Simply leave a note in the form above.",
  },
  {
    question: "What is the typical response time for support inquiries?",
    answer:
      "Our support specialists typically respond within 1 to 2 business hours. For urgent inquiries, our direct phone desk and community channels are monitored continuously.",
  },
];

export default function ContactPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start overflow-hidden">
      {/* ── Main Top Section: Hero + Contact Cards & Form ── */}
      <section
        aria-labelledby="contact-heading"
        className="w-full pt-10 sm:pt-16 pb-12 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Hero Title & Subtitle */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <h1
            id="contact-heading"
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]"
          >
            Get in touch with Zed
          </h1>
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Zed is designed to help businesses of all sizes capture, engage, and grow, all in one powerful platform.
          </p>
        </FadeIn>

        {/* 2-Column Contact Container */}
        <FadeIn delay={0.1} className="w-full max-w-5xl mx-auto">
          <div className="bg-[#f8f8fa] dark:bg-white/[0.02] border border-[#EAEAE6] dark:border-white/10 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Email Information Card */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="bg-white dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4 transition-all hover:border-[#2E82F7]/30 hover:shadow-sm">
                  <div className="h-11 w-11 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center shrink-0 text-[#0B0B0C] dark:text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-display text-sm sm:text-base font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Email information
                    </h2>
                    <div className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 space-y-0.5">
                      <p>
                        General:{" "}
                        <a
                          href="mailto:hello@zedproject.ng"
                          className="text-[#0B0B0C] dark:text-zinc-200 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                        >
                          hello@zedproject.ng
                        </a>
                      </p>
                      <p>
                        Support:{" "}
                        <a
                          href="mailto:support@zedproject.ng"
                          className="text-[#0B0B0C] dark:text-zinc-200 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                        >
                          support@zedproject.ng
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-[#EAEAE6]/70 dark:border-white/5 text-xs text-[#57575e] dark:text-zinc-400 space-y-2">
                  <p className="font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Prompt Response Guarantee
                  </p>
                  <p className="leading-relaxed">
                    Our team reviews submissions continuously. Inquiries received through the portal receive direct responses within 1 to 2 business hours.
                  </p>
                </div>
              </div>

              {/* Right Column: Send Us A Message Form */}
              <div id="contact-form" className="lg:col-span-7">
                <ContactForm />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Middle Section: "Got Questions?" FAQ ── */}
      <section
        aria-labelledby="faq-section-heading"
        className="w-full py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#EAEAE6] dark:border-white/10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Heading + Image Banner */}
          <div className="lg:col-span-5 space-y-6">
            <FadeIn className="space-y-3">
              {/* Help Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
                
                <span>Help</span>
              </div>

              <h2
                id="faq-section-heading"
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]"
              >
                Got Questions?
              </h2>

              <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
                Everything you need to know about using Zed, from plans and integrations to any other features.
              </p>
            </FadeIn>

            {/* Support Agent Photo Card with Overlay */}
            <FadeIn delay={0.1}>
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAEAE6] dark:border-white/10 shadow-md group">
                <Image
                  src="/support-agent.png"
                  alt="Customer support specialist ready to assist you"
                  width={640}
                  height={440}
                  priority
                  className="w-full h-[280px] sm:h-[320px] object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark Gradient Overlay with Glass Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                  <p className="font-sans text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
                    Still have questions or need help getting started? Our support team is always ready to help you every step of the way. Reach out to us anytime.
                  </p>

                  <a
                    href="#contact-form"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[#2E82F7] transition-colors group/link"
                  >
                    <span>Contact us</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Accordion Questions */}
          <div className="lg:col-span-7 pt-2">
            <FadeIn delay={0.15}>
              <Accordion items={FAQ_ITEMS} defaultOpenIndex={0} />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Blue CTA Banner (from reference design) ── */}
      <ClosingCTA />
    </div>
  );
}
