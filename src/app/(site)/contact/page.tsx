import type { Metadata } from "next";
import Image from "next/image";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
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
        {/* Trustpilot Review Badge */}
        <FadeIn className="flex flex-col items-center justify-center text-center space-y-1.5 mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
              Excellent
            </span>
            <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars on Trustpilot">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#00b67a] rounded-[2px] flex items-center justify-center text-white text-[10px] leading-none select-none font-bold shadow-2xs"
                >
                  ★
                </div>
              ))}
            </div>
          </div>
          
        </FadeIn>

        {/* Hero Title & Subtitle */}
        <FadeIn delay={0.05} className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <h1
            id="contact-heading"
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]"
          >
            Get in touch with Zed
          </h1>
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            The all-in-one platform for Nigerian youth. Master civil administrative
            processes with step-by-step guides, acquire in-demand digital skills,
            trade safely, and claim daily $ZED rewards.
          </p>
        </FadeIn>

        {/* 2-Column Contact Container */}
        <FadeIn delay={0.1} className="w-full max-w-6xl mx-auto">
          <div className="bg-[#f8f8fa] dark:bg-white/[0.02] border border-[#EAEAE6] dark:border-white/10 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: 3 Contact Info Cards */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {/* 1. Call Information */}
                <div className="bg-white dark:bg-[#18181B] border border-[#EAEAE6] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4 transition-all hover:border-[#3B5BFD]/30 hover:shadow-sm">
                  <div className="h-12 w-12 rounded-2xl bg-[#F4F4F6] dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center shrink-0 text-[#1C1C1E] dark:text-white">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-display text-base font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Call information
                    </h2>
                    <div className="font-sans text-xs sm:text-[13px] text-[#707078] dark:text-zinc-400 space-y-1">
                      <p>
                        Front Desk:{" "}
                        <a
                          href="tel:+2348009337765"
                          className="text-[#0B0B0C] dark:text-zinc-200 hover:text-[#3B5BFD] dark:hover:text-[#3B5BFD] transition-colors"
                        >
                          +234 704 609 4344
                        </a>
                      </p>
                      
                    </div>
                  </div>
                </div>

                {/* 2. Email Information */}
                <div className="bg-white dark:bg-[#18181B] border border-[#EAEAE6] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4 transition-all hover:border-[#3B5BFD]/30 hover:shadow-sm">
                  <div className="h-12 w-12 rounded-2xl bg-[#F4F4F6] dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center shrink-0 text-[#1C1C1E] dark:text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-display text-base font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Email information
                    </h2>
                    <div className="font-sans text-xs sm:text-[13px] text-[#707078] dark:text-zinc-400 space-y-1">
                      {/* <p>
                        Sales:{" "}
                        <a
                          href="mailto:hello@zedproject.ng"
                          className="text-[#0B0B0C] dark:text-zinc-200 hover:text-[#3B5BFD] dark:hover:text-[#3B5BFD] transition-colors"
                        >
                          hello@zedproject.ng
                        </a>
                      </p> */}
                      <p>
                        Support:{" "}
                        <a
                          href="mailto:thezedprojectng@gmail.com"
                          className="text-[#0B0B0C] dark:text-zinc-200 hover:text-[#3B5BFD] dark:hover:text-[#3B5BFD] transition-colors"
                        >
                          thezedprojectng@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Office Location / Call information */}
                <div className="bg-white dark:bg-[#18181B] border border-[#EAEAE6] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4 transition-all hover:border-[#3B5BFD]/30 hover:shadow-sm">
                  <div className="h-12 w-12 rounded-2xl bg-[#F4F4F6] dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center shrink-0 text-[#1C1C1E] dark:text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-display text-base font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Call information
                    </h2>
                    <address className="not-italic font-sans text-xs sm:text-[13px] text-[#707078] dark:text-zinc-400 leading-relaxed">
                       Lagos, Nigeria
                    </address>
                  </div>
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
