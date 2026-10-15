"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  WifiOff,
  UserCheck,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

import { PASSPORT_CENTRES, NIGERIAN_STATES, type PassportCenter } from "@/data/centers";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ── Database Report Type ──────────────────────────────────────────────────────
export interface CenterReport {
  id: string;
  user_id: string;
  center_name: string;
  state: string;
  wait_minutes: number;
  reported_at: string;
}

// ── Form Validation Schema ────────────────────────────────────────────────────
const reportSchema = z.object({
  center_id: z.string().min(1, "Please select a passport centre"),
  wait_minutes: z
    .number()
    .int("Must be a whole number of minutes")
    .min(0, "Wait time cannot be negative")
    .max(720, "Wait time cannot exceed 720 minutes (12 hours)"),
});

type ReportFormData = z.infer<typeof reportSchema>;

// ── Helper formatters ─────────────────────────────────────────────────────────
function formatRelativeTime(dateString: string): string {
  const elapsed = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (elapsed < 60) return "Just now";
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
  const days = Math.floor(elapsed / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Status categorization: Quiet (<60), Moderate (60-180), Busy (>180), No recent reports
type WaitStatus = "quiet" | "moderate" | "busy" | "empty";

function getStatusDetails(status: WaitStatus) {
  switch (status) {
    case "quiet":
      return {
        label: "Quiet",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        indicatorClass: "bg-emerald-500",
      };
    case "moderate":
      return {
        label: "Moderate",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        indicatorClass: "bg-amber-500",
      };
    case "busy":
      return {
        label: "Busy",
        badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
        indicatorClass: "bg-destructive",
      };
    case "empty":
    default:
      return {
        label: "No recent reports",
        badgeClass: "border-hairline bg-secondary text-muted-foreground",
        indicatorClass: "bg-muted-foreground/40",
      };
  }
}

const STORAGE_CACHE_KEY = "zed_passport_center_reports_cache";

export function CenterTracker() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [reports, setReports] = useState<CenterReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Filters & sorting
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"quietest" | "busiest" | "reports" | "name">("quietest");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPreselectedCenter, setDialogPreselectedCenter] = useState<PassportCenter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor network online/offline state
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch reports from Supabase (or fallback to localStorage cache)
  const fetchReports = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);

    try {
      // 1. Check local cache first
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setReports(parsed);
          }
        } catch {}
      }

      // 2. Fetch fresh data from Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from("center_reports")
        .select("id, user_id, center_name, state, wait_minutes, reported_at")
        .order("reported_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("Failed to load live center reports from Supabase:", error.message);
      } else if (data) {
        setReports(data as CenterReport[]);
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Error fetching center reports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Compute aggregated statistics per centre ──────────────────────────────
  const centersWithStats = useMemo(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    return PASSPORT_CENTRES.map((center) => {
      const centerReports = reports.filter((r) => r.center_name === center.name);
      const recentReports = centerReports.filter(
        (r) => new Date(r.reported_at).getTime() >= twentyFourHoursAgo
      );

      let avgWaitMinutes: number | null = null;
      let status: WaitStatus = "empty";

      if (recentReports.length > 0) {
        const sum = recentReports.reduce((acc, curr) => acc + curr.wait_minutes, 0);
        avgWaitMinutes = Math.round(sum / recentReports.length);

        if (avgWaitMinutes < 60) status = "quiet";
        else if (avgWaitMinutes <= 180) status = "moderate";
        else status = "busy";
      }

      const latestReport = centerReports.length > 0 ? centerReports[0] : null;

      return {
        ...center,
        avgWaitMinutes,
        status,
        recentCount: recentReports.length,
        totalCount: centerReports.length,
        latestReport,
      };
    });
  }, [reports]);

  // ── Filter & sort centres ─────────────────────────────────────────────────
  const filteredAndSortedCenters = useMemo(() => {
    return centersWithStats
      .filter((center) => {
        const matchesState =
          selectedState === "All States" || center.state.toLowerCase() === selectedState.toLowerCase();
        const matchesSearch =
          center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          center.state.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesState && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "busiest") {
          const waitA = a.avgWaitMinutes ?? -1;
          const waitB = b.avgWaitMinutes ?? -1;
          return waitB - waitA;
        }
        if (sortBy === "quietest") {
          // Centres with wait time come first sorted by lowest wait; unpopulated centres at the end
          const waitA = a.avgWaitMinutes ?? 9999;
          const waitB = b.avgWaitMinutes ?? 9999;
          return waitA - waitB;
        }
        if (sortBy === "reports") {
          return b.recentCount - a.recentCount;
        }
        return a.name.localeCompare(b.name);
      });
  }, [centersWithStats, selectedState, searchQuery, sortBy]);

  // ── Form Setup for Report Wait Time Dialog ────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      center_id: "",
      wait_minutes: 60,
    },
  });

  const selectedCenterId = watch("center_id");
  const selectedCenterObj = useMemo(
    () => PASSPORT_CENTRES.find((c) => c.id === selectedCenterId) || null,
    [selectedCenterId]
  );

  // Check rate limit: 1 report per centre per user per hour
  const getRateLimitInfo = useCallback(
    (centerName: string) => {
      if (!user) return { isRateLimited: false, minutesRemaining: 0 };
      const key = `zed_center_rate_limit_${user.id}_${centerName}`;
      const lastReported = localStorage.getItem(key);
      if (!lastReported) return { isRateLimited: false, minutesRemaining: 0 };

      const elapsedMs = Date.now() - parseInt(lastReported, 10);
      const oneHourMs = 60 * 60 * 1000;
      if (elapsedMs < oneHourMs) {
        const remaining = Math.ceil((oneHourMs - elapsedMs) / 60000);
        return { isRateLimited: true, minutesRemaining: remaining };
      }
      return { isRateLimited: false, minutesRemaining: 0 };
    },
    [user]
  );

  const currentRateLimit = useMemo(() => {
    if (!selectedCenterObj) return { isRateLimited: false, minutesRemaining: 0 };
    return getRateLimitInfo(selectedCenterObj.name);
  }, [selectedCenterObj, getRateLimitInfo]);

  const openReportDialog = (center?: PassportCenter) => {
    if (center) {
      setDialogPreselectedCenter(center);
      setValue("center_id", center.id);
    } else {
      setDialogPreselectedCenter(null);
      if (!selectedCenterId && PASSPORT_CENTRES.length > 0) {
        setValue("center_id", PASSPORT_CENTRES[0].id);
      }
    }
    setIsDialogOpen(true);
  };

  const onSubmitReport = async (data: ReportFormData) => {
    if (!user) {
      toast.error("Please sign in as a citizen to submit a wait time report.");
      router.push("/login?redirect=/nav/passport/centers");
      return;
    }

    const targetCenter = PASSPORT_CENTRES.find((c) => c.id === data.center_id);
    if (!targetCenter) {
      toast.error("Invalid passport centre selected.");
      return;
    }

    // Rate-limit check
    const rateLimit = getRateLimitInfo(targetCenter.name);
    if (rateLimit.isRateLimited) {
      toast.error(
        `Rate limit active: You can submit again for this centre in ${rateLimit.minutesRemaining} minutes.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const newReport = {
        user_id: user.id,
        center_name: targetCenter.name,
        state: targetCenter.state,
        wait_minutes: data.wait_minutes,
        reported_at: new Date().toISOString(),
      };

      const { data: inserted, error } = await supabase
        .from("center_reports")
        .insert(newReport)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Record rate limit in localStorage
      localStorage.setItem(
        `zed_center_rate_limit_${user.id}_${targetCenter.name}`,
        Date.now().toString()
      );

      // Optimistically prepend to reports state
      if (inserted) {
        const updatedReports = [inserted as CenterReport, ...reports];
        setReports(updatedReports);
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedReports));
      }

      toast.success(
        `Report recorded! ${targetCenter.name}: ${formatMinutes(data.wait_minutes)} wait time.`
      );
      setIsDialogOpen(false);
      reset({ center_id: "", wait_minutes: 60 });
    } catch (err: unknown) {
      console.error("Failed to insert center report:", err);
      toast.error("Unable to submit wait time report. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Offline Notice Banner ─────────────────────────────────────── */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            Reports need a connection to refresh live wait times. Showing cached data from your device.
          </p>
        </div>
      )}

      {/* ── Header Controls ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Official Passport Offices</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Community-reported queue and processing times across Nigerian immigration centers.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports(true)}
            disabled={isRefreshing || !isOnline}
            className="gap-1.5 min-h-[38px] text-xs font-mono shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => openReportDialog()}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 min-h-[38px] font-medium flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Report wait time</span>
          </Button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-hairline bg-card">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by centre name or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border border-transparent focus:border-primary transition-colors"
          />
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {NIGERIAN_STATES.map((state) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedState === state
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center justify-between md:justify-start gap-2 shrink-0 border-t md:border-t-0 md:border-l border-hairline pt-2.5 md:pt-0 md:pl-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="md:hidden font-mono text-[11px] uppercase">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "quietest" | "busiest" | "reports" | "name")}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer py-1 text-right md:text-left"
          >
            <option value="quietest" className="bg-popover text-popover-foreground">
              Quietest first
            </option>
            <option value="busiest" className="bg-popover text-popover-foreground">
              Busiest first
            </option>
            <option value="reports" className="bg-popover text-popover-foreground">
              Most reports
            </option>
            <option value="name" className="bg-popover text-popover-foreground">
              Name (A–Z)
            </option>
          </select>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Centre Cards */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 sm:p-5 border-hairline bg-card space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-40" />
                </Card>
              ))}
            </div>
          ) : filteredAndSortedCenters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline p-10 text-center space-y-3 bg-secondary/10">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">No passport centres found</p>
                <p className="text-xs text-muted-foreground">
                  No centres match your filter &quot;{selectedState}&quot; or query &quot;{searchQuery}&quot;.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedState("All States");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredAndSortedCenters.map((center) => {
                const statusInfo = getStatusDetails(center.status);

                return (
                  <Card
                    key={center.id}
                    className="p-4 sm:p-5 border-hairline bg-card hover:border-foreground/20 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Centre Title & State */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {center.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{center.state} State</span>
                          </p>
                        </div>

                        {/* Status Badge */}
                        <Badge variant="outline" className={`shrink-0 text-[10px] font-mono ${statusInfo.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusInfo.indicatorClass}`} />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Wait Time Display */}
                      <div className="py-2.5 border-y border-hairline">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          {center.avgWaitMinutes !== null ? (
                            <>
                              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                                {formatMinutes(center.avgWaitMinutes)}
                              </span>
                              <span className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider">
                                24h Average
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-display text-2xl font-bold text-muted-foreground font-mono">
                                —
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                No reports in last 24h
                              </span>
                            </>
                          )}
                        </div>

                        {/* Reports Count & Trend */}
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">
                            {center.recentCount > 0
                              ? `${center.recentCount} report${center.recentCount === 1 ? "" : "s"} today`
                              : "Be the first to report today"}
                          </span>
                        </p>
                      </div>

                      {/* Latest Report Timestamp */}
                      <div className="text-[11px] text-muted-foreground">
                        {center.latestReport ? (
                          <span className="line-clamp-1">
                            Latest report:{" "}
                            <strong className="font-mono text-foreground font-medium">
                              {formatMinutes(center.latestReport.wait_minutes)}
                            </strong>{" "}
                            ({formatRelativeTime(center.latestReport.reported_at)})
                          </span>
                        ) : (
                          <span>No past reports recorded yet</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 sm:pt-4 mt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openReportDialog(center)}
                        className="w-full text-xs font-medium justify-center gap-1.5 min-h-[38px] active:scale-[0.99] transition-transform"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Report time here</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Community Reports Stream */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 border-hairline bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground text-sm">Recent Community Reports</h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">Live Stream</span>
            </div>

            {reports.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <p>No reports submitted yet.</p>
                <p className="text-[11px]">Reports submitted by citizens will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] sm:max-h-[460px] lg:max-h-[520px] overflow-y-auto pr-1">
                {reports.slice(0, 10).map((report) => {
                  const waitBadgeClass =
                    report.wait_minutes < 60
                      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                      : report.wait_minutes <= 180
                      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                      : "text-destructive bg-destructive/10 border-destructive/20";

                  return (
                    <div
                      key={report.id}
                      className="p-2.5 sm:p-3 rounded-lg border border-hairline bg-secondary/30 flex items-start justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-medium text-foreground truncate">{report.center_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {report.state} · {formatRelativeTime(report.reported_at)}
                        </p>
                      </div>

                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] border shrink-0 ${waitBadgeClass}`}
                      >
                        {formatMinutes(report.wait_minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-hairline">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openReportDialog()}
                className="w-full text-xs gap-1.5 min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit wait time report</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Report Wait Time Modal Dialog ─────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Report Centre Wait Time</DialogTitle>
            <DialogDescription>
              Crowdsource accurate queue times to help fellow citizens plan their passport capture.
            </DialogDescription>
          </DialogHeader>

          {!user ? (
            <div className="py-6 space-y-4 text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Citizen Sign-in Required</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  To keep crowd estimates authentic and prevent spam, only registered citizen accounts can submit wait-time reports.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login?redirect=/nav/passport/centers">Sign in to report</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitReport)} className="space-y-5 pt-2">
              {/* Centre Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                  Passport Centre
                </label>
                <select
                  disabled={Boolean(dialogPreselectedCenter)}
                  {...register("center_id")}
                  className="w-full h-11 px-3 rounded-lg border border-hairline bg-secondary/50 text-sm text-foreground outline-none focus:border-primary transition-colors disabled:opacity-80"
                >
                  <option value="" disabled>
                    Select an official passport centre...
                  </option>
                  {PASSPORT_CENTRES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
                {errors.center_id && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {errors.center_id.message}
                  </p>
                )}
              </div>

              {/* Wait Time in Minutes Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                    Wait Time (in minutes)
                  </label>
                  <span className="font-mono text-xs text-muted-foreground">
                    0 to 720 minutes
                  </span>
                </div>

                <input
                  type="number"
                  min={0}
                  max={720}
                  placeholder="e.g. 90"
                  {...register("wait_minutes", { valueAsNumber: true })}
                  className="w-full h-11 px-3 rounded-lg border border-hairline bg-secondary/50 text-base font-mono text-foreground outline-none focus:border-primary transition-colors"
                />
                {errors.wait_minutes && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {errors.wait_minutes.message}
                  </p>
                )}

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono mr-1">Quick:</span>
                  {[30, 60, 90, 120, 180, 240].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setValue("wait_minutes", mins)}
                      className="px-2.5 py-1 rounded bg-secondary text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {formatMinutes(mins)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Limit Active Warning */}
              {currentRateLimit.isRateLimited && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Recent report on record</p>
                    <p className="text-[11px] mt-0.5">
                      You reported for this centre recently. Rate limit expires in{" "}
                      <strong>{currentRateLimit.minutesRemaining} minutes</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="min-h-[40px] sm:min-h-[36px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || currentRateLimit.isRateLimited}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[40px] sm:min-h-[36px]"
                >
                  {isSubmitting ? "Submitting..." : "Submit report"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
