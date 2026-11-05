"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldAlert,
  Save,
  Eye,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MINING_LEVEL_MAP } from "@/data/levels";
import {
  adminSaveLevelRequirementsAction,
  adminPreviewPromotionsAction,
  adminApplyPromotionsAction,
  type LevelRequirementRow,
  type PromotionPreviewItem,
} from "./actions";
import {
  ALLOWED_REQUIREMENT_TYPES,
  type RequirementType,
} from "@/lib/levels/validation";

interface LevelRulesClientProps {
  initialRules: LevelRequirementRow[];
  initialError?: string;
}

const REQUIREMENT_LABELS: Record<RequirementType, { label: string; unit: string; step: string }> = {
  total_mined: { label: "Total ZED mined", unit: "ZED", step: "1" },
  mining_days: { label: "Mining days", unit: "days", step: "1" },
  verified_referrals: { label: "Verified referrals", unit: "friends", step: "1" },
  completed_courses: { label: "Skill courses completed", unit: "courses", step: "1" },
};

const LEVELS: (2 | 3 | 4 | 5)[] = [2, 3, 4, 5];

export function LevelRulesClient({ initialRules, initialError }: LevelRulesClientProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [isApplying, startApplyTransition] = useTransition();

  // Populate rules map
  const [rulesState, setRulesState] = useState(() => {
    const state: Record<
      2 | 3 | 4 | 5,
      Record<RequirementType, { enabled: boolean; threshold: number | string }>
    > = {
      2: {
        total_mined: { enabled: false, threshold: 100 },
        mining_days: { enabled: false, threshold: 3 },
        verified_referrals: { enabled: false, threshold: 1 },
        completed_courses: { enabled: false, threshold: 1 },
      },
      3: {
        total_mined: { enabled: false, threshold: 500 },
        mining_days: { enabled: false, threshold: 14 },
        verified_referrals: { enabled: false, threshold: 3 },
        completed_courses: { enabled: false, threshold: 2 },
      },
      4: {
        total_mined: { enabled: false, threshold: 2000 },
        mining_days: { enabled: false, threshold: 30 },
        verified_referrals: { enabled: false, threshold: 5 },
        completed_courses: { enabled: false, threshold: 4 },
      },
      5: {
        total_mined: { enabled: false, threshold: 10000 },
        mining_days: { enabled: false, threshold: 60 },
        verified_referrals: { enabled: false, threshold: 10 },
        completed_courses: { enabled: false, threshold: 6 },
      },
    };

    for (const r of initialRules) {
      if (state[r.level_id] && state[r.level_id][r.requirement_type]) {
        state[r.level_id][r.requirement_type] = {
          enabled: true,
          threshold: r.threshold,
        };
      }
    }

    return state;
  });

  const [previewResults, setPreviewResults] = useState<PromotionPreviewItem[] | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Normalise a rules state into a sorted comparable key
  const normaliseState = (
    state: Record<2 | 3 | 4 | 5, Record<RequirementType, { enabled: boolean; threshold: number | string }>>
  ): string =>
    LEVELS.flatMap((lvl) =>
      ALLOWED_REQUIREMENT_TYPES.filter((t) => state[lvl][t].enabled).map(
        (t) => `${lvl}:${t}:${Number(state[lvl][t].threshold)}`
      )
    )
      .sort()
      .join("|");

  const savedKey = initialRules
    .map((r) => `${r.level_id}:${r.requirement_type}:${Number(r.threshold)}`)
    .sort()
    .join("|");

  const isDirty = normaliseState(rulesState) !== savedKey;

  // Checkbox toggle
  const toggleRule = (lvl: 2 | 3 | 4 | 5, type: RequirementType, checked: boolean) => {
    setRulesState((prev) => ({
      ...prev,
      [lvl]: {
        ...prev[lvl],
        [type]: {
          ...prev[lvl][type],
          enabled: checked,
        },
      },
    }));
    setPreviewResults(null);
  };

  // Threshold change
  const setThreshold = (lvl: 2 | 3 | 4 | 5, type: RequirementType, val: string) => {
    const num = val === "" ? "" : Number(val);
    setRulesState((prev) => ({
      ...prev,
      [lvl]: {
        ...prev[lvl],
        [type]: {
          ...prev[lvl][type],
          threshold: num,
        },
      },
    }));
    setPreviewResults(null);
  };

  // Compute non-blocking threshold ordering warnings
  const warnings: string[] = [];
  for (const type of ALLOWED_REQUIREMENT_TYPES) {
    let prevActiveLevel: number | null = null;
    let prevThreshold: number | null = null;

    for (const lvl of LEVELS) {
      const rule = rulesState[lvl][type];
      if (rule.enabled) {
        const currentThresh = Number(rule.threshold);
        if (
          prevThreshold !== null &&
          prevActiveLevel !== null &&
          currentThresh < prevThreshold
        ) {
          warnings.push(
            `Level ${lvl} ${REQUIREMENT_LABELS[type].label} threshold (${currentThresh}) is lower than Level ${prevActiveLevel} (${prevThreshold}).`
          );
        }
        prevActiveLevel = lvl;
        prevThreshold = currentThresh;
      }
    }
  }

  // Construct rules payload to save — returns null and fires toast if any enabled rule is invalid
  const getRulesPayload = (): { level_id: 2 | 3 | 4 | 5; requirement_type: RequirementType; threshold: number }[] | null => {
    const payload: { level_id: 2 | 3 | 4 | 5; requirement_type: RequirementType; threshold: number }[] = [];
    for (const lvl of LEVELS) {
      for (const type of ALLOWED_REQUIREMENT_TYPES) {
        const item = rulesState[lvl][type];
        if (item.enabled) {
          const num = Number(item.threshold);
          if (item.threshold === "" || !Number.isFinite(num)) {
            toast.error(
              `Level ${lvl} — ${REQUIREMENT_LABELS[type].label}: threshold must be a valid number greater than 0.`
            );
            return null;
          }
          payload.push({ level_id: lvl, requirement_type: type, threshold: num });
        }
      }
    }
    return payload;
  };

  // Save rules
  const handleSave = () => {
    const payload = getRulesPayload();
    if (payload === null) return;
    startSaveTransition(async () => {
      const res = await adminSaveLevelRequirementsAction(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Level promotion rules saved successfully!");
      setPreviewResults(null);
      router.refresh();
    });
  };

  // Preview promotions
  const handlePreview = () => {
    startPreviewTransition(async () => {
      const res = await adminPreviewPromotionsAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreviewResults(res.results);
      const total = res.results.reduce((acc, curr) => acc + curr.user_count, 0);
      toast.info(
        total > 0
          ? `Preview: ${total} user${total === 1 ? "" : "s"} would be promoted.`
          : "Preview: 0 users qualify for promotion under current rules."
      );
    });
  };

  // Apply promotions
  const handleApply = () => {
    startApplyTransition(async () => {
      const res = await adminApplyPromotionsAction();
      setIsConfirmOpen(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const total = res.results.reduce((acc, curr) => acc + curr.user_count, 0);
      toast.success(`Promotions applied: ${total} user${total === 1 ? "" : "s"} promoted.`);
      setPreviewResults(null);
      router.refresh();
    });
  };

  const previewTotal = previewResults?.reduce((acc, curr) => acc + curr.user_count, 0) ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Level Promotion Rules
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure automatic promotion criteria per level. A user must satisfy ALL enabled requirements of a level to reach it.
        </p>
      </div>

      {initialError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Failed to load existing rules: {initialError}</span>
        </div>
      )}

      {/* Non-blocking warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5 text-xs text-amber-500">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Threshold Consistency Warning</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Action Bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border p-3.5 rounded-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            <span>Rules take effect automatically on user claims, lesson completions, and referrals.</span>
          </div>
          {isDirty && (
            <p className="text-[11px] text-amber-500 font-medium pl-6">
              Save your changes before previewing or applying.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isPreviewing || isSaving || isDirty}
            className="text-xs"
          >
            {isPreviewing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Eye className="h-3.5 w-3.5 mr-1.5" />
            )}
            Preview promotions
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isApplying || isSaving || previewResults === null || isDirty}
            className="text-xs"
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Zap className="h-3.5 w-3.5 mr-1.5" />
            )}
            Apply promotions now
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isPreviewing}
            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save rules
          </Button>
        </div>
      </div>

      {/* ── Preview Panel (if available) ─────────────────────────────────── */}
      {previewResults !== null && (
        <Card className="p-4 border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold text-foreground">
                Promotion Preview Results
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
              {previewTotal} qualifying user{previewTotal === 1 ? "" : "s"}
            </Badge>
          </div>

          {previewResults.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No users qualify for automatic promotion under the current criteria.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {previewResults.map((item) => (
                <div
                  key={item.to_level}
                  className="rounded border border-border bg-card p-2 text-center"
                >
                  <p className="text-[11px] text-muted-foreground font-mono">
                    To Level {item.to_level} ({MINING_LEVEL_MAP[item.to_level as 2|3|4|5]?.name})
                  </p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {item.user_count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Level Cards (Levels 2 to 5) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LEVELS.map((lvl) => {
          const levelData = MINING_LEVEL_MAP[lvl];
          const activeCount = ALLOWED_REQUIREMENT_TYPES.filter(
            (t) => rulesState[lvl][t].enabled
          ).length;
          const isLocked = activeCount === 0;

          return (
            <Card
              key={lvl}
              className="p-5 border-border bg-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Level Title & Header */}
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Level {lvl} — {levelData.name}
                      </h2>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-primary/30 text-primary bg-primary/5"
                      >
                        ×{levelData.multiplier.toFixed(1)} Mining ({levelData.dailyCap} ZED/day)
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Hardcoded rate from levels matrix.
                    </p>
                  </div>

                  {isLocked ? (
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-destructive/40 text-destructive bg-destructive/5 shrink-0 flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-border text-muted-foreground shrink-0 flex items-center gap-1"
                    >
                      <Unlock className="h-3 w-3" />
                      {activeCount} rule{activeCount === 1 ? "" : "s"} (AND)
                    </Badge>
                  )}
                </div>

                {isLocked && (
                  <div className="rounded-md border border-muted bg-secondary/40 p-2.5 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Locked: nobody can reach this level automatically.</span>
                  </div>
                )}

                {/* 4 Requirement Rows */}
                <div className="space-y-3">
                  {ALLOWED_REQUIREMENT_TYPES.map((type) => {
                    const rule = rulesState[lvl][type];
                    const meta = REQUIREMENT_LABELS[type];
                    const inputId = `rule-${lvl}-${type}`;

                    return (
                      <div
                        key={type}
                        className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                          rule.enabled
                            ? "border-border bg-secondary/30"
                            : "border-transparent bg-transparent opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Checkbox
                            id={inputId}
                            checked={rule.enabled}
                            onCheckedChange={(checked) =>
                              toggleRule(lvl, type, Boolean(checked))
                            }
                          />
                          <Label
                            htmlFor={inputId}
                            className="text-xs font-medium cursor-pointer truncate"
                          >
                            {meta.label}
                          </Label>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            disabled={!rule.enabled}
                            min="1"
                            max="1000000000"
                            step={meta.step}
                            value={rule.threshold}
                            onChange={(e) =>
                              setThreshold(lvl, type, e.target.value)
                            }
                            className="h-8 w-24 text-xs font-mono text-right"
                          />
                          <span className="text-[11px] font-mono text-muted-foreground w-12 text-left">
                            {meta.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground/70 font-mono">
                {isLocked
                  ? "Enable at least one requirement to unlock auto-promotion."
                  : `User must satisfy all ${activeCount} requirement${activeCount === 1 ? "" : "s"} above.`}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Irreversible Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Apply Level Promotions Now?
            </DialogTitle>
            <DialogDescription>
              Review the details below before confirming this irreversible action.
            </DialogDescription>
            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <p>
                This operation will recalculate all registered users and promote those who qualify based on the rules currently saved in the database.
              </p>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-500 font-medium">
                ⚠️ <strong>Irreversible:</strong> Users are never demoted. Once promoted, their level cannot be automatically reduced even if rules change later.
              </div>
              {previewResults && (
                <div className="text-xs text-foreground font-mono">
                  Promotions to be applied: <strong>{previewTotal}</strong> total user{previewTotal === 1 ? "" : "s"}.
                </div>
              )}
            </div>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isApplying}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="text-xs"
            >
              {isApplying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              Confirm &amp; Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

