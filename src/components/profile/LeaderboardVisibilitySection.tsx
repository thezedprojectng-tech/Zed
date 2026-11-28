"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getLeaderboardHiddenAction,
  setLeaderboardHiddenAction,
} from "@/lib/leaderboard/actions";
import { cn } from "@/lib/utils";

export function LeaderboardVisibilitySection() {
  const [showMe, setShowMe] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getLeaderboardHiddenAction().then((hidden) => {
      if (!active) return;
      setShowMe(!hidden);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = () => {
    if (!loaded || isPending) return;
    const nextShowMe = !showMe;
    const nextHidden = !nextShowMe;
    setShowMe(nextShowMe);

    startTransition(async () => {
      const res = await setLeaderboardHiddenAction(nextHidden);
      if (res.ok) {
        setShowMe(!res.hidden);
        toast.success(
          res.hidden
            ? "You are now hidden from leaderboards"
            : "You are now shown on leaderboards"
        );
      } else {
        setShowMe(!nextShowMe);
        toast.error(res.error || "Could not update leaderboard visibility");
      }
    });
  };

  return (
    <section
      aria-labelledby="leaderboard-settings-heading"
      className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2
            id="leaderboard-settings-heading"
            className="text-base font-semibold text-foreground"
          >
            Show me on leaderboards
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Others see a short version of your name (for example Ade O.), your level and your points. Your ZED balance is never shown.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showMe}
          aria-label="Show me on leaderboards"
          disabled={!loaded || isPending}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
            showMe ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-xs transition-transform duration-200 motion-reduce:transition-none",
              showMe ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </section>
  );
}
