"use client";

// ─── CDS Logger – Main Client Component ──────────────────────────────────────
// Manages the list of logs, summary cards, offline queue, edit/delete UX,
// and CSV export. Server actions are passed as props to keep the component
// free of direct "use server" imports (which are not needed in client files).

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  Download,
  Edit2,
  FileText,
  Info,
  Plus,
  Trash2,
  WifiOff,
  X,
  CloudUpload,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CdsLogForm } from "@/components/cds/CdsLogForm";
import {
  computeCdsSummary,
  generateCdsCsv,
  formatHours,
} from "@/lib/cds/helpers";
import { useCdsQueueStore } from "@/store/useCdsQueueStore";
import { useIsOnline } from "@/lib/hooks";
import type { CdsLog } from "@/types/cds";

// ── Types for injected server actions ─────────────────────────────────────────

type CreateFn = (raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
type UpdateFn = (id: string, raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
type DeleteFn = (id: string) => Promise<{ success: boolean; error?: string }>;

interface CdsLoggerClientProps {
  initialLogs: CdsLog[];
  onCreate: CreateFn;
  onUpdate: UpdateFn;
  onDelete: DeleteFn;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="border-hairline bg-card/70 p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="type-caption font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="type-small text-muted-foreground">{sub}</p>}
    </Card>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────────

function LogRow({
  log,
  onEdit,
  onDelete,
  isPending,
}: {
  log: CdsLog;
  onEdit: (log: CdsLog) => void;
  onDelete: (log: CdsLog) => void;
  isPending: boolean;
}) {
  return (
    <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-hairline bg-card/60 p-4 hover:bg-card/80 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <time
            dateTime={log.session_date}
            className="font-mono text-xs text-muted-foreground shrink-0"
          >
            {formatDate(log.session_date)}
          </time>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/20 bg-primary/5 text-primary px-1.5 py-0 shrink-0"
          >
            {formatHours(Number(log.hours))}
          </Badge>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{log.group_name}</p>
        <p className="type-small text-muted-foreground line-clamp-2">{log.activity}</p>
        {log.notes && (
          <p className="type-small text-muted-foreground/70 italic line-clamp-1">{log.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(log)}
          disabled={isPending}
          aria-label={`Edit log from ${log.session_date}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(log)}
          disabled={isPending}
          aria-label={`Delete log from ${log.session_date}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CdsLoggerClient({
  initialLogs,
  onCreate,
  onUpdate,
  onDelete,
}: CdsLoggerClientProps) {
  const isOnline = useIsOnline();
  const { pending: pendingQueue, enqueue, dequeue } = useCdsQueueStore();

  const [logs, setLogs] = useState<CdsLog[]>(initialLogs);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<CdsLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<CdsLog | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();

  const summary = computeCdsSummary(logs);

  // ── Export CSV ──────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const csv = generateCdsCsv(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cds-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }, [logs]);

  // ── Create / Offline queue ──────────────────────────────────────────────────

  const handleCreate = useCallback(
    async (raw: unknown) => {
      if (!isOnline) {
        // Queue offline
        const data = raw as {
          session_date: string;
          group_name: string;
          activity: string;
          hours: number;
          notes?: string | null;
        };
        enqueue({
          session_date: data.session_date,
          group_name: data.group_name,
          activity: data.activity,
          hours: data.hours,
          notes: data.notes ?? null,
        });
        toast.info("You're offline. Session saved locally and will sync when connected.");
        setShowForm(false);
        return { log: { id: "", user_id: "", created_at: "", ...data, notes: data.notes ?? null } as CdsLog };
      }
      return onCreate(raw);
    },
    [isOnline, enqueue, onCreate]
  );

  const handleCreateSuccess = useCallback((log: CdsLog) => {
    if (log.id) {
      setLogs((prev) => [log, ...prev]);
    }
    setShowForm(false);
  }, []);

  // ── Sync offline queue ──────────────────────────────────────────────────────

  const handleSyncQueue = useCallback(() => {
    startSyncTransition(async () => {
      const toSync = [...pendingQueue];
      let synced = 0;
      for (const entry of toSync) {
        const result = await onCreate({
          session_date: entry.session_date,
          group_name: entry.group_name,
          activity: entry.activity,
          hours: entry.hours,
          notes: entry.notes,
        });
        if ("log" in result) {
          setLogs((prev) => [result.log, ...prev]);
          dequeue(entry.tempId);
          synced++;
        }
      }
      if (synced > 0) {
        toast.success(`${synced} pending session${synced > 1 ? "s" : ""} synced.`);
      } else {
        toast.error("Some sessions could not be synced. They remain in your queue.");
      }
    });
  }, [pendingQueue, onCreate, dequeue]);

  // ── Edit ────────────────────────────────────────────────────────────────────

  const handleEdit = useCallback((log: CdsLog) => {
    setEditingLog(log);
    setShowForm(false);
  }, []);

  const handleUpdateSuccess = useCallback((updated: CdsLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingLog(null);
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingLog) return;
    const result = await onDelete(deletingLog.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete.");
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== deletingLog.id));
      toast.success("CDS log deleted.");
    }
    setDeletingLog(null);
  }, [deletingLog, onDelete]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-blue-700 dark:text-blue-400"
      >
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="type-small leading-relaxed">
          <strong>Personal record only.</strong> This is your personal record to help you keep
          track of CDS sessions. It is not an official NYSC document and has no affiliation with
          the NYSC Directorate.
        </p>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="type-small font-medium">
            You are offline. New sessions will be saved locally and synced when you reconnect.
          </p>
        </div>
      )}

      {/* Pending sync banner */}
      {isOnline && pendingQueue.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3 text-primary">
            <CloudUpload className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="type-small font-medium">
              {pendingQueue.length} session{pendingQueue.length > 1 ? "s" : ""} pending sync
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncQueue}
            disabled={isSyncing}
            className="gap-1.5 text-xs shrink-0"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <CloudUpload className="h-3 w-3" aria-hidden="true" />
            )}
            Sync now
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <section aria-label="Summary statistics" className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={FileText}
          label="Total Sessions"
          value={summary.totalSessions + (pendingQueue.length > 0 ? `+${pendingQueue.length}` : "")}
        />
        <SummaryCard
          icon={Clock}
          label="Total Hours"
          value={formatHours(summary.totalHours)}
        />
        <SummaryCard
          icon={CalendarDays}
          label="This Month"
          value={summary.sessionsThisMonth}
          sub={summary.hoursThisMonth > 0 ? formatHours(summary.hoursThisMonth) : "No sessions yet"}
        />
      </section>

      {/* Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-h3 text-foreground">Session Log</h2>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs font-mono"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setShowForm((v) => !v);
              setEditingLog(null);
            }}
            className="gap-1.5"
          >
            {showForm ? (
              <>
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Log a session
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && !editingLog && (
        <Card className="border-hairline border-primary/30 bg-card p-5">
          <h3 className="type-caption font-semibold text-foreground mb-4">New CDS Session</h3>
          <CdsLogForm
            onCreate={handleCreate}
            onUpdate={onUpdate}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {/* Edit inline panel */}
      {editingLog && (
        <Card className="border-hairline border-amber-500/30 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="type-caption font-semibold text-foreground">Edit Session</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditingLog(null)}
              aria-label="Close edit panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CdsLogForm
            editing={editingLog}
            onCreate={handleCreate}
            onUpdate={onUpdate}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditingLog(null)}
          />
        </Card>
      )}

      {/* Pending offline entries */}
      {pendingQueue.length > 0 && (
        <div className="space-y-2">
          <p className="type-caption text-muted-foreground font-semibold">Pending (offline)</p>
          {pendingQueue.map((entry) => (
            <article
              key={entry.tempId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 opacity-80"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    dateTime={entry.session_date}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {formatDate(entry.session_date)}
                  </time>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0"
                  >
                    Pending sync
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-border text-muted-foreground px-1.5 py-0"
                  >
                    {formatHours(entry.hours)}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{entry.group_name}</p>
                <p className="type-small text-muted-foreground line-clamp-2">{entry.activity}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Log list */}
      <div className="space-y-2">
        {logs.length === 0 && pendingQueue.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-hairline border-dashed bg-card/40 py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
            <div>
              <p className="type-body font-medium text-foreground">No sessions logged yet</p>
              <p className="type-small text-muted-foreground mt-0.5">
                Tap &ldquo;Log a session&rdquo; above to record your first CDS attendance.
              </p>
            </div>
          </div>
        )}

        {logs.map((log) => (
          <LogRow
            key={log.id}
            log={log}
            onEdit={handleEdit}
            onDelete={setDeletingLog}
            isPending={isSyncing}
          />
        ))}
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deletingLog !== null} onOpenChange={(open) => { if (!open) setDeletingLog(null); }}>
        <DialogContent className="border-hairline bg-popover">
          <DialogHeader>
            <DialogTitle>Delete CDS Log</DialogTitle>
            <DialogDescription>
              Delete the session from{" "}
              <strong>{deletingLog ? formatDate(deletingLog.session_date) : ""}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeletingLog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Loading skeleton (used in Suspense fallback or parent) ────────────────────

export function CdsLoggerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
