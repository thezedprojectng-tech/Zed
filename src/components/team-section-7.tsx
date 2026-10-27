"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  location: string;
  lat: number;
  lon: number;
  imageUrl: string;
};

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Tunde",
    role: "Founder & Systems Architect",
    location: "Lagos, Nigeria",
    lat: 6.5244,
    lon: 3.3792,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-one.png",
  },
  {
    id: "2",
    name: "Chidinma",
    role: "Lead Product Designer",
    location: "Abuja, Nigeria",
    lat: 9.0765,
    lon: 7.3986,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-five.png",
  },
  {
    id: "3",
    name: "Damilola",
    role: "Frontend & PWA Engineer",
    location: "Ibadan, Nigeria",
    lat: 7.3775,
    lon: 3.947,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-four.png",
  },
  {
    id: "4",
    name: "Emeka",
    role: "Distributed Systems & WebRTC",
    location: "Enugu, Nigeria",
    lat: 6.4584,
    lon: 7.5464,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-two.png",
  },
  {
    id: "5",
    name: "Farouq",
    role: "Zed Nav Bureaucracy Engine",
    location: "Kano, Nigeria",
    lat: 12.0022,
    lon: 8.592,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-three.png",
  },
  {
    id: "6",
    name: "Kemi",
    role: "Campus Ambassador (UNILAG)",
    location: "Lagos, Nigeria",
    lat: 6.5158,
    lon: 3.3898,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-six.png",
  },
  {
    id: "7",
    name: "Ifeanyi",
    role: "Escrow & Treasury Lead",
    location: "Port Harcourt, Nigeria",
    lat: 4.8156,
    lon: 7.0498,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-one.png",
  },
  {
    id: "8",
    name: "Zainab",
    role: "Zed Skill & Curriculum Lead",
    location: "Abuja, Nigeria",
    lat: 9.0579,
    lon: 7.4951,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-five.png",
  },
  {
    id: "9",
    name: "Seyi",
    role: "Zed SOS & Geospatial Lead",
    location: "Lagos, Nigeria",
    lat: 6.6018,
    lon: 3.3515,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-two.png",
  },
  {
    id: "10",
    name: "Blessing",
    role: "Creator Asset Lab Lead",
    location: "Benin City, Nigeria",
    lat: 6.335,
    lon: 5.6037,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-three.png",
  },
  {
    id: "11",
    name: "Joshua",
    role: "Live Audio Lead (Covenant Hub)",
    location: "Ota, Nigeria",
    lat: 6.6906,
    lon: 3.2361,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-four.png",
  },
  {
    id: "12",
    name: "Aisha",
    role: "Academic Vault Lead (UI Hub)",
    location: "Ibadan, Nigeria",
    lat: 7.4431,
    lon: 3.9003,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-six.png",
  },
  {
    id: "13",
    name: "Nnamdi",
    role: "Security & Moderation Lead",
    location: "London, UK",
    lat: 51.5072,
    lon: -0.1276,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-one.png",
  },
  {
    id: "14",
    name: "Tolani",
    role: "Diaspora Partnerships Lead",
    location: "Toronto, Canada",
    lat: 43.6532,
    lon: -79.3832,
    imageUrl:
      "https://assets.solaceui.com/solaceui-member-five.png",
  },
];

const continentPaths = [
  "M161 98 198 76 247 79 284 104 316 140 305 174 276 185 257 221 228 231 206 204 178 197 145 167 128 132Z",
  "M265 228 303 246 325 285 315 329 333 363 314 423 283 471 257 436 253 381 230 346 237 299Z",
  "M463 112 501 95 548 111 557 139 532 160 494 158 454 144Z",
  "M493 174 548 164 597 190 616 233 592 277 605 324 572 390 534 383 511 333 482 297 468 238Z",
  "M575 126 646 94 735 91 819 120 885 170 870 218 806 214 760 243 711 221 650 240 594 211Z",
  "M661 247 718 255 770 297 793 353 753 382 706 361 674 313Z",
  "M777 364 827 352 872 377 893 420 851 444 801 431Z",
  "M414 409 443 399 461 419 434 436Z",
  "M333 94 374 77 410 91 397 117 353 119Z",
];

const connectionPairs = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [0, 3],
  [6, 7],
  [9, 13],
  [10, 12],
  [11, 2],
];

function projectLocation(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

export default function Team7() {
  const [activeMemberId, setActiveMemberId] = useState(teamMembers[1].id);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden bg-background px-6 py-16 text-foreground sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(217,249,157,0.16),transparent_34%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[radial-gradient(circle_at_50%_15%,rgba(217,249,157,0.08),transparent_34%)]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-xl text-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20 mx-auto mb-2">
            <span>Our Distributed Team</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] sm:text-5xl px-4">
            Built by Nigerian youth, powered by builders everywhere
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#57575e] dark:text-zinc-400">
            From Lagos and Abuja to Ibadan, Enugu, university campus hubs, and diaspora communities—our team engineers low-data infrastructure for the next generation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative h-[560px] overflow-hidden sm:h-[650px]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 500"
            className="absolute inset-x-0 top-1/2 h-auto w-full -translate-y-1/2"
          >
            <defs>
              <pattern id="team-map-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.25" className="fill-zinc-950/18 dark:fill-white/16" />
              </pattern>
              <linearGradient id="team-map-line" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.04" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.16" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {continentPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="url(#team-map-dots)"
                className="stroke-zinc-950/5 dark:stroke-white/5"
                strokeWidth="1"
              />
            ))}

            {connectionPairs.map(([from, to]) => {
              const start = projectLocation(teamMembers[from].lat, teamMembers[from].lon);
              const end = projectLocation(teamMembers[to].lat, teamMembers[to].lon);

              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x * 10}
                  y1={start.y * 5}
                  x2={end.x * 10}
                  y2={end.y * 5}
                  stroke="url(#team-map-line)"
                  strokeWidth="1.2"
                  strokeDasharray="4 6"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_58%,rgba(255,255,255,0.9)_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,transparent_58%,rgba(9,9,11,0.9)_100%)]" />

          {teamMembers.map((member, index) => {
            const position = projectLocation(member.lat, member.lon);
            const isActive = activeMemberId === member.id;
            const isHovered = hoveredMemberId === member.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.25 + index * 0.08 }}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                onClick={() => setActiveMemberId(member.id)}
                onMouseEnter={() => setHoveredMemberId(member.id)}
                onMouseLeave={() => setHoveredMemberId(null)}
                onFocus={() => setHoveredMemberId(member.id)}
                onBlur={() => setHoveredMemberId(null)}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  zIndex: isHovered ? 60 : isActive ? 40 : 10 + index,
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-(--color-primary)/55 opacity-0 blur-xl transition duration-300 group-hover:opacity-80 dark:bg-(--color-primary)/20" />
                  <button
                    type="button"
                    aria-label={`View ${member.name} in ${member.location}`}
                    className="relative size-11 overflow-hidden rounded-full border-2 border-white bg-zinc-100 shadow-xl shadow-black/15 ring-1 ring-black/10 transition duration-300 group-hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:border-zinc-950 dark:bg-zinc-900 dark:ring-white/10 dark:focus:ring-white/20 sm:size-14"
                  >
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                      unoptimized
                    />
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.75rem)] w-52 -translate-x-1/2 rounded-md border border-black/10 bg-white/95 p-3 text-center opacity-0 shadow-xl shadow-black/10 backdrop-blur transition duration-200 group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:translate-y-1 group-focus-within:opacity-100 dark:border-white/10 dark:bg-zinc-950/95">
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{member.role}</p>
                    <p className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
                      {member.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
