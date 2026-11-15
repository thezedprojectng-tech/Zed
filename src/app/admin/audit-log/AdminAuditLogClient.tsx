"use client";

import { useState, useCallback, useEffect, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollText, X, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminPageHeader,
  AdminDrawer,
  EmptyState,
} from "@/components/admin/primitives";
import {
  PanelSection,
  FieldList,
  FieldItem,
} from "@/components/admin/primitives/PanelSection";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_user?: { full_name: string | null } | null;
}

interface Props {
  logs: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  targetTypes: string[];
  admins: { id: string; name: string }[];
  q: string;
  adminFilter: string;
  targetTypeFilter: string;
  fromDate: string;
  toDate: string;
  hasError?: boolean;
}

// ─── Human label helpers ──────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  "user.delete": "User deleted",
  "user.role_change": "Role changed",
  "report.delete": "Report deleted",
  "report.bulk_delete": "Bulk report delete",
  "users.export_csv": "CSV export",
  news_published: "News published",
  notification_sent: "Notification sent",
  user_phone_revealed: "Phone revealed",
};

function humanizeAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .replace(/[._]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function sentenceCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Risk tint helper ─────────────────────────────────────────────────────────

type RiskLevel = "rose" | "amber" | "blue" | "neutral";

function getActionRisk(action: string): RiskLevel {
  if (
    ["user.delete", "report.delete", "report.bulk_delete", "user.role_change", "users.export_csv"].includes(
      action
    )
  )
    return "rose";
  if (
    action.includes("verification") ||
    action.includes("bank") ||
    action.includes("dob") ||
    action === "user_phone_revealed"
  )
    return "amber";
  if (
    action.includes("listing") ||
    action.includes("market") ||
    action.includes("moderation") ||
    action.includes("report")
  )
    return "blue";
  return "neutral";
}

const RISK_PILL_STYLES: Record<RiskLevel, string> = {
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  neutral: "bg-secondary/70 text-muted-foreground border-border",
};

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dayLabel(isoString: string): string {
  const d = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const ds = d.toDateString();
  if (ds === today.toDateString()) return "Today";
  if (ds === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="bg-secondary rounded-full h-6 w-6 text-[10px] font-semibold flex items-center justify-center shrink-0 select-none"
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
    >
      <Copy className="h-3 w-3" />
      {copied && (
        <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400">
          Copied
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminAuditLogClient({
  logs,
  total,
  page,
  limit,
  totalPages,
  targetTypes,
  admins,
  q,
  adminFilter,
  targetTypeFilter,
  fromDate,
  toDate,
  hasError,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  const selectedLog = selectedId ? logs.find((l) => l.id === selectedId) ?? null : null;

  // Search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── URL param helpers ────────────────────────────────────────────────────

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") {
          p.delete(k);
        } else {
          p.set(k, v);
        }
      }
      startTransition(() => {
        router.push(`?${p.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      pushParams({ q: value || undefined, page: undefined });
    }, 300);
  };

  const handleDateRange = (range: "today" | "7d" | "30d" | "all") => {
    if (range === "all") {
      pushParams({ from: undefined, to: undefined, page: undefined });
      return;
    }
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    if (range === "today") start.setHours(0, 0, 0, 0);
    else if (range === "7d") start.setDate(start.getDate() - 7);
    else if (range === "30d") start.setDate(start.getDate() - 30);
    pushParams({
      from: start.toISOString().slice(0, 10),
      to: end,
      page: undefined,
    });
  };

  const activeDateRange = (): "today" | "7d" | "30d" | "all" => {
    if (!fromDate && !toDate) return "all";
    if (!fromDate) return "all";
    const now = new Date();
    const from = new Date(fromDate);
    const diffDays = Math.round(
      (now.getTime() - from.getTime()) / 86400000
    );
    if (diffDays <= 1) return "today";
    if (diffDays <= 8) return "7d";
    if (diffDays <= 31) return "30d";
    return "all";
  };

  const hasFilters = !!(q || adminFilter || targetTypeFilter || fromDate || toDate);

  // ── Row open ─────────────────────────────────────────────────────────────

  const openRow = (id: string) => {
    setSelectedId(id);
    setRawJsonOpen(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      if (e.key === "j" || e.key === "k") {
        if (!logs.length) return;
        const idx = selectedId ? logs.findIndex((l) => l.id === selectedId) : -1;
        const nextIdx =
          e.key === "j"
            ? Math.min(idx + 1, logs.length - 1)
            : Math.max(idx - 1, 0);
        setSelectedId(logs[nextIdx].id);
        if (!drawerOpen) setDrawerOpen(true);
      }
      if (e.key === "Enter" && selectedId && !drawerOpen) {
        setDrawerOpen(true);
      }
      if (e.key === "Escape" && drawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [logs, selectedId, drawerOpen]);

  // ── Error state ───────────────────────────────────────────────────────────

  if (hasError) {
    return (
      <main className="space-y-6 max-w-[1400px] mx-auto">
        <AdminPageHeader
          section="system"
          icon={ScrollText}
          title="Audit log"
          description="Immutable record of all administrative actions."
        />
        <EmptyState
          title="Audit log unavailable"
          description="The audit log table has not been set up. Contact your database administrator."
        />
      </main>
    );
  }

  // ── Day separator logic ───────────────────────────────────────────────────

  type TableRow =
    | { type: "separator"; label: string; key: string }
    | { type: "log"; row: AuditLogRow };

  const tableRows: TableRow[] = [];
  let lastDay = "";
  for (const row of logs) {
    const day = new Date(row.created_at).toDateString();
    if (day !== lastDay) {
      tableRows.push({ type: "separator", label: dayLabel(row.created_at), key: `sep-${row.id}` });
      lastDay = day;
    }
    tableRows.push({ type: "log", row });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="space-y-6 max-w-[1400px] mx-auto">
      <AdminPageHeader
        section="system"
        icon={ScrollText}
        title="Audit log"
        description="Immutable record of all administrative actions."
        badge={
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {total.toLocaleString()} events
          </span>
        }
      />

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {/* Search */}
        <div className="relative min-w-0 w-full sm:w-56">
          <Input
            id="audit-search"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search action or target ID…"
            className="h-9 text-xs pl-3"
          />
        </div>

        {/* Admin filter */}
        <Select
          value={adminFilter || "_all"}
          onValueChange={(v) =>
            pushParams({ admin_id: v === "_all" ? undefined : v, page: undefined })
          }
        >
          <SelectTrigger className="h-9 text-xs w-full sm:w-44">
            <SelectValue placeholder="All admins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All admins</SelectItem>
            <SelectItem value="system">System</SelectItem>
            {admins.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Target type filter */}
        <Select
          value={targetTypeFilter || "_all"}
          onValueChange={(v) =>
            pushParams({ target_type: v === "_all" ? undefined : v, page: undefined })
          }
        >
          <SelectTrigger className="h-9 text-xs w-full sm:w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All types</SelectItem>
            {targetTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {sentenceCase(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range buttons */}
        <div className="flex items-center gap-1">
          {(
            [
              { value: "today", label: "Today" },
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
              { value: "all", label: "All time" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDateRange(opt.value)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${
                activeDateRange() === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {q && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Search: &ldquo;{q}&rdquo;
              <button
                type="button"
                onClick={() => pushParams({ q: undefined, page: undefined })}
                aria-label="Clear search"
                className="ml-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {adminFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Admin: {adminFilter === "system" ? "System" : admins.find((a) => a.id === adminFilter)?.name || adminFilter}
              <button
                type="button"
                onClick={() => pushParams({ admin_id: undefined, page: undefined })}
                aria-label="Clear admin filter"
                className="ml-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {targetTypeFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Type: {sentenceCase(targetTypeFilter)}
              <button
                type="button"
                onClick={() => pushParams({ target_type: undefined, page: undefined })}
                aria-label="Clear type filter"
                className="ml-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(fromDate || toDate) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Date range
              <button
                type="button"
                onClick={() => pushParams({ from: undefined, to: undefined, page: undefined })}
                aria-label="Clear date filter"
                className="ml-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              pushParams({
                q: undefined,
                admin_id: undefined,
                target_type: undefined,
                from: undefined,
                to: undefined,
                page: undefined,
              })
            }
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events found"
          description={
            hasFilters
              ? "No audit log entries match the current filters."
              : "No administrative actions have been recorded yet."
          }
        />
      ) : (
        <div
          className={`rounded-lg border border-border bg-card overflow-hidden transition-opacity duration-150 ${isPending ? "opacity-60" : "opacity-100"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/20 border-b border-border text-[11px] text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actor</th>
                  <th className="px-4 py-3 whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 whitespace-nowrap">Target</th>
                  <th className="px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tableRows.map((item) => {
                  if (item.type === "separator") {
                    return (
                      <tr key={item.key} aria-hidden="true">
                        <td
                          colSpan={5}
                          className="px-4 pt-4 pb-1 text-xs font-medium text-muted-foreground bg-transparent"
                        >
                          {item.label}
                        </td>
                      </tr>
                    );
                  }

                  const { row } = item;
                  const risk = getActionRisk(row.action);
                  const actorName = !row.admin_id
                    ? "System"
                    : row.admin_user?.full_name || "Administrator";

                  const metaSummary = row.metadata
                    ? Object.entries(row.metadata)
                        .slice(0, 2)
                        .map(([k, v]) => {
                          const val =
                            typeof v === "object" ? JSON.stringify(v) : String(v);
                          return `${humanizeKey(k)}: ${val}`;
                        })
                        .join(" · ")
                    : null;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => openRow(row.id)}
                      className={`cursor-pointer transition-colors duration-100 hover:bg-muted/40 ${selectedId === row.id && drawerOpen ? "bg-muted/50" : ""}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openRow(row.id);
                      }}
                      aria-label={`Open details for ${humanizeAction(row.action)}`}
                    >
                      {/* Time */}
                      <td
                        className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground text-[11px]"
                        title={new Date(row.created_at).toLocaleString()}
                      >
                        {relativeTime(row.created_at)}
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={actorName} />
                          <span className="font-medium text-foreground">
                            {actorName}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${RISK_PILL_STYLES[risk]}`}
                        >
                          {humanizeAction(row.action)}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-foreground font-medium">
                          {sentenceCase(row.target_type)}
                        </span>
                        {row.target_id && (
                          <span
                            className="ml-1.5 font-mono text-[10px] text-muted-foreground"
                            title={row.target_id}
                          >
                            {row.target_id.slice(0, 8)}…
                          </span>
                        )}
                      </td>

                      {/* Summary */}
                      <td className="px-4 py-3 text-muted-foreground max-w-[260px] truncate">
                        {metaSummary || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{total.toLocaleString()} events</span>
            {page > 1 && (
              <button
                type="button"
                onClick={() => pushParams({ page: "1" })}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Jump to newest
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={page <= 1 || isPending}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={page >= totalPages || isPending}
              onClick={() => pushParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────────────────────── */}
      <AdminDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        title={selectedLog ? humanizeAction(selectedLog.action) : "Event detail"}
        timestamp={selectedLog ? relativeTime(selectedLog.created_at) : undefined}
      >
        {selectedLog && (
          <>
            {/* Event section */}
            <PanelSection title="Event">
              <FieldList columns={1}>
                <FieldItem
                  label="Actor"
                  value={
                    !selectedLog.admin_id
                      ? "System"
                      : selectedLog.admin_user?.full_name || "Administrator"
                  }
                />
                <FieldItem label="Action" mono value={selectedLog.action} />
                <FieldItem
                  label="Target type"
                  value={sentenceCase(selectedLog.target_type)}
                />
                {selectedLog.target_id && (
                  <FieldItem
                    label="Target ID"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs">
                          {selectedLog.target_id}
                        </span>
                        <CopyButton value={selectedLog.target_id} />
                      </span>
                    }
                  />
                )}
                <FieldItem
                  label="Time (UTC)"
                  mono
                  value={new Date(selectedLog.created_at).toISOString()}
                />
                <FieldItem
                  label="Time (local)"
                  value={new Date(selectedLog.created_at).toLocaleString()}
                />
              </FieldList>
            </PanelSection>

            {/* Metadata section */}
            <PanelSection title="Metadata">
              {!selectedLog.metadata || Object.keys(selectedLog.metadata).length === 0 ? (
                <p className="text-xs text-muted-foreground">No metadata recorded.</p>
              ) : (
                <>
                  <FieldList columns={1}>
                    {Object.entries(selectedLog.metadata).map(([k, v]) => (
                      <FieldItem
                        key={k}
                        label={humanizeKey(k)}
                        value={
                          typeof v === "object" ? (
                            <pre className="font-mono text-[11px] bg-secondary/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(v, null, 2)}
                            </pre>
                          ) : (
                            String(v)
                          )
                        }
                      />
                    ))}
                  </FieldList>

                  {/* Raw JSON collapsible */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setRawJsonOpen((v) => !v)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {rawJsonOpen ? "Hide" : "Show"} raw JSON
                    </button>
                    {rawJsonOpen && (
                      <div className="mt-2 relative">
                        <pre className="font-mono text-[11px] bg-secondary/50 rounded-md p-3 overflow-x-auto whitespace-pre text-foreground border border-border/60">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              JSON.stringify(selectedLog.metadata, null, 2)
                            );
                          }}
                          className="absolute top-2 right-2 p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy raw JSON"
                          aria-label="Copy raw JSON"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </PanelSection>
          </>
        )}
      </AdminDrawer>
    </main>
  );
}
