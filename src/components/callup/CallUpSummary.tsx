"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Copy,
  Check,
  Edit2,
  Trash2,
  ArrowRight,
  Compass,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { toast } from "sonner";

interface CallUpSummaryProps {
  details: ConfirmedCallUpDetails;
  onEdit: () => void;
  onNewParse: () => void;
}

type ChecklistFilter = "all" | "documents" | "gear" | "essentials";

function toTitleCase(name?: string): string {
  if (!name) return "Corps member";
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const [checklistFilter, setChecklistFilter] =
    useState<ChecklistFilter>("all");

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

  const filteredItems =
    checklistFilter === "all"
      ? PRE_CAMP_CHECKLIST_ITEMS
      : PRE_CAMP_CHECKLIST_ITEMS.filter((i) => i.category === checklistFilter);

  const completedCount = PRE_CAMP_CHECKLIST_ITEMS.filter((i) =>
    checkedChecklistIds.includes(i.id)
  ).length;
  const totalCount = PRE_CAMP_CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const categoryCounts = {
    all: totalCount,
    documents: PRE_CAMP_CHECKLIST_ITEMS.filter((i) => i.category === "documents").length,
    gear: PRE_CAMP_CHECKLIST_ITEMS.filter((i) => i.category === "gear").length,
    essentials: PRE_CAMP_CHECKLIST_ITEMS.filter((i) => i.category === "essentials").length,
  };

  const filterOptions = [
    { value: "all" as const, label: "All", count: categoryCounts.all },
    { value: "documents" as const, label: "Documents", count: categoryCounts.documents },
    { value: "gear" as const, label: "Uniform and gear", count: categoryCounts.gear },
    { value: "essentials" as const, label: "Hostel essentials", count: categoryCounts.essentials },
  ];

  let countdownText = "";
  if (countdown) {
    if (countdown.status === "future") {
      countdownText = `${countdown.days} ${countdown.days === 1 ? "day" : "days"} to report`;
    } else if (countdown.status === "today") {
      countdownText = "Reporting today";
    } else {
      countdownText = "Reporting date has passed";
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ── Left Column: Checklist ──────────────────────────────────── */}
      <section
        className="lg:col-span-7 space-y-5 order-last lg:order-first"
        aria-labelledby="checklist-heading"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2
              id="checklist-heading"
              className="text-lg font-semibold text-foreground tracking-tight"
            >
              Camp checklist
            </h2>
            <p className="text-xs text-muted-foreground">
              Essential documents and camp gear. Items save automatically as you pack.
            </p>
          </div>
          <Link
            href="/nav/nysc"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0"
          >
            <Compass className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Full NYSC Mobilisation playbook</span>
            <ArrowRight className="h-3 w-3 stroke-[1.5]" />
          </Link>
        </div>

        {/* Progress summary */}
        <div className="space-y-2 rounded-lg border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {completedCount} of {totalCount} packed
            </span>
            <span className="tabular-nums text-muted-foreground font-sans">
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none pb-1">
          <SegmentedControl
            options={filterOptions}
            value={checklistFilter}
            onChange={(val) => setChecklistFilter(val as ChecklistFilter)}
            size="sm"
            ariaLabel="Filter checklist items by category"
            className="min-w-max"
          />
        </div>

        {/* Items List */}
        <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
          {filteredItems.map((item) => {
            const isChecked = checkedChecklistIds.includes(item.id);
            return (
              <div
                key={item.id}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => toggleChecklistItem(item.id)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleChecklistItem(item.id);
                  }
                }}
                className="flex items-start gap-3.5 p-3.5 sm:p-4 min-h-[44px] cursor-pointer hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:bg-secondary/40"
              >
                {/* 24px custom checkbox */}
                <div
                  className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-secondary/50 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5 select-none min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium leading-snug transition-colors ${
                      isChecked ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.hint}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Right Column: Sticky Summary Card ───────────────────────── */}
      <aside
        className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 order-first lg:order-last"
        aria-label="Call-up summary details"
      >
        <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-5">
          {/* Header block with Name & Pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {details.batch && (
                <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground">
                  {details.batch}
                </span>
              )}
              {details.stream && (
                <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground">
                  {details.stream}
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {toTitleCase(details.fullName)}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 stroke-[1.5]" />
              <span>
                Deployed to{" "}
                <strong className="text-foreground font-medium">
                  {details.campState ? `${details.campState} State` : "Assigned state"}
                </strong>
              </span>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Plain Countdown Block */}
          {countdown && (
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {countdownText}
              </p>
              <p className="text-xs text-muted-foreground">
                Report by {formatDateDisplay(details.reportingDate)}
              </p>
            </div>
          )}

          <div className="h-px bg-border/60" />

          {/* Flat Definition List */}
          <dl className="space-y-3.5 text-xs">
            {/* State code */}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">State code</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-foreground">
                  {details.stateCode || "—"}
                </span>
                {details.stateCode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(details.stateCode, "State code")}
                    aria-label="Copy state code"
                  >
                    {copiedField === "State code" ? (
                      <Check className="h-3 w-3 text-emerald-500 stroke-[2]" />
                    ) : (
                      <Copy className="h-3 w-3 stroke-[1.5]" />
                    )}
                  </Button>
                )}
              </dd>
            </div>

            {/* Call-up number */}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Call-up number</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-foreground truncate max-w-[180px]">
                  {details.callUpNumber || "—"}
                </span>
                {details.callUpNumber && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => copyToClipboard(details.callUpNumber, "Call-up number")}
                    aria-label="Copy call-up number"
                  >
                    {copiedField === "Call-up number" ? (
                      <Check className="h-3 w-3 text-emerald-500 stroke-[2]" />
                    ) : (
                      <Copy className="h-3 w-3 stroke-[1.5]" />
                    )}
                  </Button>
                )}
              </dd>
            </div>

            {/* Reporting date */}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Reporting date</dt>
              <dd className="font-medium text-foreground">
                {details.reportingDate ? formatDateDisplay(details.reportingDate) : "—"}
              </dd>
            </div>

            {/* Orientation camp venue */}
            <div className="space-y-1 pt-1">
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground stroke-[1.5]" />
                <span>Orientation camp venue</span>
              </dt>
              <dd className="text-foreground leading-relaxed pl-5">
                {details.campName || "Check your official call-up letter for the camp location address."}
              </dd>
            </div>
          </dl>

          <div className="h-px bg-border/60" />

          {/* Actions in a row without a bordered strip */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onEdit}
                className="text-xs h-9 px-3 gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Edit details</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onNewParse}
                className="text-xs h-9 px-3"
              >
                Parse another letter
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              className="text-xs h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1 stroke-[1.5]" />
              Clear my saved details
            </Button>
          </div>
        </div>

        {/* Flat Disclaimer Callout */}
        <div
          role="note"
          className="rounded-lg border border-border/70 bg-secondary/30 p-4 text-xs text-muted-foreground flex items-start gap-3"
        >
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 stroke-[1.5]" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-medium">Disclaimer:</strong> Zed processes call-up letters locally on your device and does not verify them with the NYSC. Always follow the instructions on your official NYSC portal and stamped call-up letter.
          </p>
        </div>
      </aside>

      {/* ── Clear Confirmation Dialog ───────────────────────────────── */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Clear saved call-up details?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will remove your saved letter details and checklist progress from this browser. Your raw letter was never saved or transmitted to any server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              Clear details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
