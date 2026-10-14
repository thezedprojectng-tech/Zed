"use client";
import Image from "next/image";
import { AnimatedGroup } from "@/components/animated-group";
import { motion, Variants } from "motion/react";
import LogoCloud from "@/components/logo-cloud";

export default function HeroSection3() {
  const transitionVariants: { container?: Variants; item?: Variants } = {
    item: {
      hidden: {
        opacity: 0,
        filter: "blur(12px)",
        y: 12,
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring",
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  const imageVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 40,
      filter: "blur(10px)",
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
        delay: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto [--color-primary:#003AF9] z-40">
      <div className="py-6 md:py-10 bg-linear-to-b from-(--color-primary) to-white min-h-[calc(100vh-8rem)] w-full rounded-lg">
        <AnimatedGroup
          className="flex flex-col gap-4 md:gap-2 px-4 md:px-12"
          variants={transitionVariants}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-180">
            AI Agents That Code Like Your Best Engineer
          </h1>
          <p className="text-white/60 font-light text-lg md:text-xl tracking-tight max-w-xl pt-2 md:pt-1">
            Autonomous agents that debug, refactor, and ship features while you
            focus on architecture and strategy
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-2 pt-3 w-full sm:w-auto">
            <button className="border border-white text-white px-5 py-2 rounded-md cursor-pointer text-sm md:text-base w-full sm:w-auto">
              Try for free
            </button>
            <button className="bg-black text-white px-5 py-2 rounded-md shadow-[-1px_3px_10px_0px_rgba(0,0,0,0.26)] cursor-pointer text-sm md:text-base w-full sm:w-auto">
              Book a demo
            </button>
          </div>
        </AnimatedGroup>

        <div className="px-4 md:px-10 mt-8 md:mt-10">
          <motion.div
            className="relative p-1.5 md:p-2 rounded-2xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            variants={imageVariants}
          >
            <Image
              src="https://assets.solaceui.com/solaceui-hero-light.png"
              alt="Dashboard Preview"
              className="rounded-xl w-full h-auto shadow-sm border border-black/5"
              width={1000}
              height={2000}
              unoptimized
            />
            <div className="hidden md:block absolute bottom-0 left-0 w-full h-20 md:h-60 bg-linear-to-t from-white to-transparent rounded-lg">
              <div className="absolute bottom-5 md:bottom-10 left-0 w-full no-scrollbar">
                <LogoCloud className="mask-linear-to-r from-transparent via-black to-transparent pb-3 w-full" />
              </div>
            </div>
          </motion.div>
          <div className="md:hidden pt-12 pb-6  no-scrollbar">
            <LogoCloud className="mask-linear-to-r from-transparent via-black to-transparent pb-3 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
