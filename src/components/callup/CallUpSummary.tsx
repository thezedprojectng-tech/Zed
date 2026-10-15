"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Building2,
  Copy,
  Check,
  Edit2,
  Trash2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateDaysRemaining,
  formatDateDisplay,
  PRE_CAMP_CHECKLIST_ITEMS,
} from "@/lib/callup/parser";
import {
  type ConfirmedCallUpDetails,
  useCallUpStore,
} from "@/store/useCallUpStore";
import { toast } from "sonner";

interface CallUpSummaryProps {
  details: ConfirmedCallUpDetails;
  onEdit: () => void;
  onNewParse: () => void;
}

export function CallUpSummary({
  details,
  onEdit,
  onNewParse,
}: CallUpSummaryProps) {
  const { checkedChecklistIds, toggleChecklistItem, clearDetails } =
    useCallUpStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<
    "all" | "documents" | "gear" | "essentials"
  >("all");

  const countdown = details.reportingDate
    ? calculateDaysRemaining(details.reportingDate)
    : null;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleClear = () => {
    clearDetails();
    setConfirmClearOpen(false);
    toast.info("Saved call-up details cleared");
    onNewParse();
  };

  // Filter checklist items
  const filteredItems =
    checklistFilter === "all"
      ? PRE_CAMP_CHECKLIST_ITEMS
      : PRE_CAMP_CHECKLIST_ITEMS.filter((i) => i.category === checklistFilter);

  const completedCount = PRE_CAMP_CHECKLIST_ITEMS.filter((i) =>
    checkedChecklistIds.includes(i.id)
  ).length;
  const progressPct = Math.round(
    (completedCount / PRE_CAMP_CHECKLIST_ITEMS.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* ── Top Countdown & Status Banner ────────────────────────────── */}
      <section
        className="rounded-xl border border-hairline bg-card p-5 sm:p-6 space-y-4"
        aria-labelledby="summary-overview-heading"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                NYSC ORIENTATION PROFILE
              </span>
              {details.batch && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {details.batch}
                </Badge>
              )}
              {details.stream && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {details.stream}
                </Badge>
              )}
            </div>
            <h2
              id="summary-overview-heading"
              className="text-lg sm:text-xl font-semibold text-foreground tracking-tight"
            >
              {details.fullName || "Corps Member"}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>
                Deployed to{" "}
                <strong className="text-foreground">
                  {details.campState ? `${details.campState} State` : "Assigned State"}
                </strong>
              </span>
            </div>
          </div>

          {/* Countdown widget */}
          {countdown && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:px-4 sm:py-3 shrink-0">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                {countdown.status === "future" && (
                  <>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {countdown.days}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {countdown.days === 1 ? "day remaining" : "days remaining"}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Report by {formatDateDisplay(details.reportingDate)}
                    </p>
                  </>
                )}
                {countdown.status === "today" && (
                  <>
                    <p className="text-sm font-bold text-primary">
                      Reporting Today!
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateDisplay(details.reportingDate)}
                    </p>
                  </>
                )}
                {countdown.status === "past" && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground">
                      Reporting date passed ({countdown.days}d ago)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateDisplay(details.reportingDate)}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-hairline">
          {/* State Code */}
          <div className="rounded-lg border border-hairline bg-background/50 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
              State Code
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-foreground">
                {details.stateCode || "—"}
              </span>
              {details.stateCode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(details.stateCode, "State Code")}
                  aria-label="Copy state code"
                >
                  {copiedField === "State Code" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Call-up Number */}
          <div className="rounded-lg border border-hairline bg-background/50 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
              Call-up Number
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-foreground truncate mr-1">
                {details.callUpNumber || "—"}
              </span>
              {details.callUpNumber && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => copyToClipboard(details.callUpNumber, "Call-up Number")}
                  aria-label="Copy call-up number"
                >
                  {copiedField === "Call-up Number" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Reporting Date */}
          <div className="rounded-lg border border-hairline bg-background/50 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
              Reporting Date
            </span>
            <div className="text-sm font-medium text-foreground">
              {details.reportingDate
                ? formatDateDisplay(details.reportingDate)
                : "—"}
            </div>
          </div>

          {/* Orientation Camp Venue */}
          <div className="rounded-lg border border-hairline bg-background/50 p-3 space-y-1 sm:col-span-2 lg:col-span-3">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block flex items-center gap-1">
              <Building2 className="h-3 w-3 text-primary" />
              Orientation Camp Venue
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              {details.campName || "Check your official call-up letter for the camp location address."}
            </p>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-hairline">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-xs h-8"
            >
              <Edit2 className="h-3 w-3 mr-1.5" />
              Edit Details
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onNewParse}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Parse Another Letter
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Clear my saved details
          </Button>
        </div>
      </section>

      {/* ── Pre-Camp Checklist ─────────────────────────────────────────── */}
      <section
        className="rounded-xl border border-hairline bg-card p-5 sm:p-6 space-y-5"
        aria-labelledby="checklist-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3
                id="checklist-heading"
                className="text-base font-semibold text-foreground"
              >
                Pre-Camp Survival Checklist
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Essential documents and camp gear. Tick items off as you pack; progress is saved automatically.
            </p>
          </div>
          <Link
            href="/nav/nysc"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0"
          >
            <Compass className="h-3.5 w-3.5" />
            Full NYSC Mobilisation Playbook
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2 rounded-lg border border-hairline bg-background/50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Packing Progress: {completedCount} of {PRE_CAMP_CHECKLIST_ITEMS.length} items packed
            </span>
            <span className="font-mono text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1.5 border-hairline-b pb-2 overflow-x-auto text-xs">
          {(
            [
              { id: "all", label: "All Items" },
              { id: "documents", label: "Documents" },
              { id: "gear", label: "Uniform & Gear" },
              { id: "essentials", label: "Hostel Essentials" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChecklistFilter(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                checklistFilter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isChecked = checkedChecklistIds.includes(item.id);
            return (
              <label
                key={item.id}
                htmlFor={`check-${item.id}`}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  isChecked
                    ? "border-primary/30 bg-primary/5"
                    : "border-hairline bg-background/40 hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  id={`check-${item.id}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 select-none">
                  <p
                    className={`text-xs font-medium leading-snug ${
                      isChecked
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.hint}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* ── Official Disclaimer ──────────────────────────────────────── */}
      <footer className="rounded-xl border border-hairline bg-muted/20 p-4 text-xs text-muted-foreground flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Disclaimer:</strong> Zed does not verify call-up letters. Always follow the instructions on your official NYSC portal and letter.
        </p>
      </footer>

      {/* ── Clear Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear saved call-up details?</DialogTitle>
            <DialogDescription className="text-xs">
              This will remove your saved letter details and checklist progress from this browser. Your raw letter was never saved or transmitted to any server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
            >
              Clear Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
