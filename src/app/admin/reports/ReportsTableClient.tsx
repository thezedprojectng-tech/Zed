"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trash2,
  Filter,
  MapPin,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteReportButton } from "./DeleteReportButton";
import { bulkDeleteReports } from "./actions";

export interface ReportItem {
  id: string;
  center_name: string;
  state: string;
  wait_minutes: number;
  reported_at: string;
  user_id: string;
  reporter_name: string;
  masked_phone: string;
}

interface ReportsTableClientProps {
  reports: ReportItem[];
  availableCentres: string[];
  availableStates: string[];
}

function waitBadge(mins: number) {
  if (mins < 60)
    return { label: "Quiet", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" };
  if (mins <= 180)
    return { label: "Moderate", cls: "border-amber-500/30 bg-amber-500/10 text-amber-500" };
  return { label: "Busy", cls: "border-destructive/30 bg-destructive/10 text-destructive" };
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function ReportsTableClient({
  reports,
  availableCentres,
  availableStates,
}: ReportsTableClientProps) {
  const router = useRouter();
  const [filterState, setFilterState] = useState<string>("all");
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [isBulkPending, startBulkTransition] = useTransition();
  const [now] = useState(() => Date.now());

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterState !== "all" && r.state !== filterState) return false;
      if (filterCentre !== "all" && r.center_name !== filterCentre) return false;

      if (filterDate !== "all") {
        const reportTime = new Date(r.reported_at).getTime();
        if (filterDate === "24h" && now - reportTime > 24 * 60 * 60 * 1000) return false;
        if (filterDate === "7d" && now - reportTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (filterDate === "30d" && now - reportTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [reports, filterState, filterCentre, filterDate, now]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredReports.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected =
    filteredReports.length > 0 && selectedIds.length === filteredReports.length;

  const handleBulkDelete = () => {
    startBulkTransition(async () => {
      const res = await bulkDeleteReports(selectedIds);
      if (!res.success) {
        toast.error(res.error || "Failed to bulk delete reports.");
      } else {
        toast.success(`Successfully deleted ${res.count || selectedIds.length} reports.`);
        setSelectedIds([]);
        setBulkDialogOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters & Bulk Action Bar */}
      <Card className="p-3.5 border-border bg-card shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-mono uppercase pr-1">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Filter:</span>
            </div>

            {/* Filter: State */}
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Filter: Centre */}
            <select
              value={filterCentre}
              onChange={(e) => setFilterCentre(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors max-w-[200px]"
            >
              <option value="all">All Centres</option>
              {availableCentres.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter: Date */}
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Bulk Action Button (active when items selected) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-mono text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDialogOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete Selected ({selectedIds.length})</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Count Info */}
      <div className="text-xs text-muted-foreground font-mono px-1">
        Showing {filteredReports.length} of {reports.length} reports
        {(filterState !== "all" || filterCentre !== "all" || filterDate !== "all") &&
          " (filtered)"}
      </div>

      {/* Main Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm font-semibold text-foreground">No reports match criteria</p>
            <p className="text-xs text-muted-foreground font-mono">
              Adjust filters to view other reports or clear your selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all reports"
                      className="rounded border-border accent-primary h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Centre Office
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    State
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Wait Time
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Reported By
                  </th>
                  <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Timestamp
                  </th>
                  <th className="text-right px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReports.map((r) => {
                  const badge = waitBadge(r.wait_minutes);
                  const isChecked = selectedIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-secondary/40 transition-colors ${
                        isChecked ? "bg-secondary/30" : ""
                      }`}
                    >
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          aria-label={`Select report for ${r.center_name}`}
                          className="rounded border-border accent-primary h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                        {r.center_name}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.state}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                        {formatMinutes(r.wait_minutes)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${badge.cls}`}
                        >
                          {badge.label}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 max-w-[180px] truncate">
                        <span className="font-medium text-foreground block truncate">
                          {r.reporter_name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {r.masked_phone}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(r.reported_at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <DeleteReportButton reportId={r.id} centreName={r.center_name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Delete {selectedIds.length} Reports?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete these {selectedIds.length} selected wait-time reports?
              They will be permanently removed from citizen tracker metrics and logged to the audit ledger.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isBulkPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={isBulkPending}
              onClick={handleBulkDelete}
              className="gap-1.5"
            >
              {isBulkPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Confirm Delete (${selectedIds.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
