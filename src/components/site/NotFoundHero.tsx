"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function NotFoundHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="not-found-heading"
      className="w-full pt-4 pb-12 sm:pt-8 sm:pb-16"
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-4xl rounded-3xl sm:rounded-[36px] bg-transparent dark:bg-[#141416] px-6 py-12 sm:px-12 sm:py-20 text-center overflow-hidden"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-[#2E82F7]/5 rounded-full blur-3xl pointer-events-none select-none"
          />

          {/* 3D 404 Illustration with Gentle Floating Motion */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -10, 0],
                  }
            }
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto w-full max-w-[360px] sm:max-w-[460px] md:max-w-[520px] aspect-[16/10] mb-6 sm:mb-8 flex items-center justify-center"
          >
            <Image
              src="/error.png"
              alt="404 Page Not Found"
              width={540}
              height={338}
              priority
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
            />
          </motion.div>

          {/* Text Content */}
          <div className="relative z-10 space-y-3 sm:space-y-4 max-w-md mx-auto">
            <h1
              id="not-found-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight"
            >
              Page Not Found
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-[#9c9ca4] leading-relaxed">
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>

            {/* Action Button */}
            <div className="pt-3 sm:pt-4">
              <Link
                id="back-to-homepage-btn"
                href="/"
                className="inline-flex items-center justify-center px-7 py-3 bg-[#181822] hover:bg-[#0B0B10] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
              >
                Back To Homepage
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
