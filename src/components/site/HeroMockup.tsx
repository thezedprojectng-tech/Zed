import {
  Coins,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Bell,
  Sparkles,
  FileText,
} from "lucide-react";

/**
 * Pure HTML/CSS product mockup representing Zed's real application interface.
 * Illustrates the Daily Mining streak engine and the Zed Nav civic guide.
 * Purely decorative: marked aria-hidden="true" so assistive tech ignores it.
 */
export function HeroMockup() {
  const weeklyDays = [
    { day: "Mon", height: "h-10", active: true },
    { day: "Tue", height: "h-12", active: true },
    { day: "Wed", height: "h-14", active: true },
    { day: "Thu", height: "h-9", active: true },
    { day: "Fri", height: "h-16", active: true },
    { day: "Sat", height: "h-13", active: true },
    { day: "Sun", height: "h-16", active: true, today: true },
  ];

  return (
    <div aria-hidden="true" className="w-full">
    <div
      className="w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border border-[#E5E5E0] dark:border-white/10 bg-white/95 dark:bg-[#121214]/95 shadow-[0_24px_70px_-15px_rgba(46,130,247,0.22)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden select-none pointer-events-none text-left"
    >
      {/* ── Window App Header Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-white/8 px-4 sm:px-6 py-3 bg-[#FAFAF8] dark:bg-[#161619]">
        {/* Left: Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#2E82F7] flex items-center justify-center text-white font-bold text-xs tracking-wider">
            Z
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
            Zed
          </span>
        </div>

        {/* Center: Module Navigation Pills */}
        <div className="hidden sm:flex items-center gap-1 bg-[#EFEFEA] dark:bg-white/5 p-1 rounded-full text-[11px] font-medium text-[#57575e] dark:text-zinc-400">
          <span className="px-3 py-1 rounded-full bg-[#0B0B0C] dark:bg-white text-white dark:text-[#0B0B0C] font-semibold shadow-xs">
            Overview
          </span>
          <span className="px-3 py-1 rounded-full hover:text-foreground">
            Mining
          </span>
          <span className="px-3 py-1 rounded-full hover:text-foreground">
            Zed Nav
          </span>
          <span className="px-3 py-1 rounded-full hover:text-foreground">
            Skill
          </span>
          <span className="px-3 py-1 rounded-full hover:text-foreground">
            Market
          </span>
        </div>

        {/* Right: Mock Utilities */}
        <div className="flex items-center gap-2 text-[#707078] dark:text-zinc-400">
          <div className="h-7 w-7 rounded-full border border-[#E5E5E0] dark:border-white/10 flex items-center justify-center">
            <Search className="h-3.5 w-3.5" />
          </div>
          <div className="relative h-7 w-7 rounded-full border border-[#E5E5E0] dark:border-white/10 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
          </div>
          <div className="h-7 w-7 rounded-full bg-[#2E82F7]/15 text-[#2E82F7] font-semibold text-[11px] flex items-center justify-center border border-[#2E82F7]/30">
            ZT
          </div>
        </div>
      </div>

      {/* ── Window Inner Body ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* User Greeting & Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F0EC] dark:border-white/5 pb-4">
          <div>
            <h2 className="font-display text-base sm:text-xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8] tracking-tight">
              Good morning, Explorer!
            </h2>
            <p className="hidden sm:block text-xs text-[#707078] dark:text-zinc-400">
              Track your daily mining rewards and civic document progress.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium self-start sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Session · Civic Tier 1</span>
          </div>
        </div>

        {/* ── Two-Column Feature Grid (Mining + Zed Nav) ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5" style={{ gridTemplateRows: 'auto' }}>
          {/* Card 1: Daily Mining Card (7 cols on desktop) */}
          <div className="md:col-span-7 rounded-xl border border-[#EBEBE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Daily Mining Claim
                  </div>
                  <div className="text-[11px] text-[#707078] dark:text-zinc-400">
                    Base yield ×1.0 · Tier 1
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Flame className="h-3 w-3 fill-amber-500" />
                <span>7-Day Streak</span>
              </span>
            </div>

            {/* Token Balance */}
            <div className="bg-white dark:bg-[#121214] rounded-lg p-3.5 border border-[#EBEBE6] dark:border-white/6 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#707078] dark:text-zinc-400 block">
                  Accumulated Balance
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] font-mono">
                  1,250.00
                </span>
                <span className="text-xs font-medium text-[#2E82F7] ml-1.5 font-mono">
                  $ZED
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  +100 Ready
                </span>
              </div>
            </div>

            {/* Claim Action Button */}
            <div className="w-full py-2.5 px-4 rounded-lg bg-[#2E82F7] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs shadow-blue-500/20">
              <Coins className="h-3.5 w-3.5" />
              <span>Claim Today&apos;s 100 $ZED</span>
            </div>

            {/* Weekly Activity Heatmap Bars — hidden on mobile */}
            <div className="hidden sm:block pt-1 border-t border-[#EAEAE5] dark:border-white/6">
              <div className="flex items-center justify-between text-[10px] text-[#707078] dark:text-zinc-400 mb-2">
                <span>Streak Consistency (Past 7 Days)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  100% On Time
                </span>
              </div>
              <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-16 pt-1">
                {weeklyDays.map((item) => (
                  <div
                    key={item.day}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div
                      className={`w-full ${item.height} rounded-md transition-all ${
                        item.today
                          ? "bg-[#2E82F7] shadow-xs shadow-blue-500/40"
                          : "bg-[#2E82F7]/60 dark:bg-[#2E82F7]/40"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono ${
                        item.today
                          ? "font-bold text-[#2E82F7]"
                          : "text-[#707078] dark:text-zinc-400"
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Active Civil Application (5 cols on desktop, hidden on mobile) */}
          <div className="hidden md:flex md:col-span-5 rounded-xl border border-[#EBEBE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] p-4 sm:p-5 flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#2E82F7] font-semibold">
                  ACTIVE ZED NAV GUIDE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#2E82F7]/10 text-[#2E82F7]">
                  IN PROGRESS
                </span>
              </div>

              <div>
                <div className="text-[11px] font-mono text-[#707078] dark:text-zinc-400">
                  NIS-01 · NIGERIAN IMMIGRATION SERVICE
                </div>
                <h3 className="font-display font-bold text-sm text-[#0B0B0C] dark:text-[#FAFAF8] mt-0.5">
                  Standard e-Passport Renewal
                </h3>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-[#707078] dark:text-zinc-400">
                  <span>Step 2 of 4</span>
                  <span className="font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    50% Complete
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E5E5E0] dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#2E82F7] rounded-full w-1/2" />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[#0B0B0C] dark:text-zinc-200 text-[11px]">
                    NIN record match verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#2E82F7]">
                  <Clock className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span className="text-[#0B0B0C] dark:text-zinc-200 text-[11px] font-medium">
                    Passport photo audit (35×45mm)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#707078] dark:text-zinc-400">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px]">
                    Statutory Remita payment setup
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom guide CTA */}
            <div className="pt-2 border-t border-[#EAEAE5] dark:border-white/6">
              <div className="w-full py-2 px-3 rounded-lg border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#121214] text-[#0B0B0C] dark:text-white text-xs font-medium flex items-center justify-between">
                <span>Resume Guide Checklist</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#2E82F7]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
