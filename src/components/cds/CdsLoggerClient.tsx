"use client";

// ─── CDS Logger – Main Client Component ──────────────────────────────────────
// Manages the list of logs, compact summary row, offline queue, edit/delete UX,
// and CSV export.

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import {
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
  MoreVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CdsLogForm } from "@/components/cds/CdsLogForm";
import {
  computeCdsSummary,
  generateCdsCsv,
  formatHours,
} from "@/lib/cds/helpers";
import { useCdsQueueStore } from "@/store/useCdsQueueStore";
import { useIsOnline } from "@/lib/hooks";
import type { CdsLog } from "@/types/cds";

type CreateFn = (raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
type UpdateFn = (id: string, raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
type DeleteFn = (id: string) => Promise<{ success: boolean; error?: string }>;

interface CdsLoggerClientProps {
  initialLogs: CdsLog[];
  onCreate: CreateFn;
  onUpdate: UpdateFn;
  onDelete: DeleteFn;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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

  // Export CSV
  const handleExport = useCallback(() => {
    const csv = generateCdsCsv(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cds-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }, [logs]);

  // Create / Offline queue
  const handleCreate = useCallback(
    async (raw: unknown) => {
      if (!isOnline) {
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

  // Sync offline queue
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

  // Edit
  const handleEdit = useCallback((log: CdsLog) => {
    setEditingLog(log);
    setShowForm(false);
  }, []);

  const handleUpdateSuccess = useCallback((updated: CdsLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingLog(null);
  }, []);

  // Delete
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

  return (
    <div className="space-y-6">
      {/* ── 1. Compact Stat Row (Single Row with Dividers) ──────────── */}
      <section
        aria-label="Summary statistics"
        className="rounded-lg border border-border/70 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border/60 grid grid-cols-1 sm:grid-cols-3 overflow-hidden shadow-2xs"
      >
        {/* Total Sessions */}
        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs text-muted-foreground">Total sessions</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground font-sans tabular-nums">
            {summary.totalSessions + (pendingQueue.length > 0 ? ` (+${pendingQueue.length})` : "")}
          </p>
        </div>

        {/* Total Hours */}
        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs text-muted-foreground">Total hours</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground font-sans tabular-nums">
            {formatHours(summary.totalHours)}
          </p>
        </div>

        {/* This Month */}
        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs text-muted-foreground">This month</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground font-sans tabular-nums">
            {summary.sessionsThisMonth}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.hoursThisMonth > 0 ? formatHours(summary.hoursThisMonth) : "No sessions yet"}
          </p>
        </div>
      </section>

      {/* ── 2. Flat Personal Record Callout ─────────────────────────── */}
      <div
        role="note"
        className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 sm:p-4 text-xs flex items-start gap-3"
      >
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 stroke-[1.5]" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Personal record only.</strong>{" "}
          <span className="text-muted-foreground">
            This is your personal log to help you track CDS sessions. It is not an official NYSC document and has no affiliation with the NYSC Directorate.
          </span>
        </p>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400 text-xs">
          <WifiOff className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden="true" />
          <p className="font-medium">
            You are offline. New sessions will be saved locally and synced when you reconnect.
          </p>
        </div>
      )}

      {/* Pending sync banner */}
      {isOnline && pendingQueue.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs">
          <div className="flex items-center gap-3 text-primary">
            <CloudUpload className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden="true" />
            <p className="font-medium">
              {pendingQueue.length} session{pendingQueue.length > 1 ? "s" : ""} pending sync
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncQueue}
            disabled={isSyncing}
            className="gap-1.5 text-xs h-8 shrink-0"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <CloudUpload className="h-3 w-3 stroke-[1.5]" aria-hidden="true" />
            )}
            <span>Sync now</span>
          </Button>
        </div>
      )}

      {/* ── 3. Session Log Section Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Session log
        </h2>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs h-9"
            >
              <Download className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />
              <span>Export CSV</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setShowForm((v) => !v);
              setEditingLog(null);
            }}
            className="gap-1.5 text-xs h-9"
          >
            {showForm ? (
              <>
                <X className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />
                <span>Log a session</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && !editingLog && (
        <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-2xs">
          <h3 className="text-sm font-semibold text-foreground">New CDS session</h3>
          <CdsLogForm
            onCreate={handleCreate}
            onUpdate={onUpdate}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Inline edit form */}
      {editingLog && (
        <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Edit session</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingLog(null)}
              aria-label="Close edit form"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </Button>
          </div>
          <CdsLogForm
            editing={editingLog}
            onCreate={handleCreate}
            onUpdate={onUpdate}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditingLog(null)}
          />
        </div>
      )}

      {/* Pending offline entries */}
      {pendingQueue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pending offline sync</p>
          <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden opacity-85">
            {pendingQueue.map((entry) => (
              <div
                key={entry.tempId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {formatDate(entry.session_date)}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Pending sync
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatHours(entry.hours)}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{entry.group_name}</p>
                  <p className="text-muted-foreground">{entry.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Sessions Flat List with Dividers or Empty State ────────── */}
      {logs.length === 0 && pendingQueue.length === 0 ? (
        <div className="rounded-lg border border-border/70 bg-card p-10 sm:p-12 text-center space-y-4">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              No sessions logged yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Record your CDS attendance hours and activities.
            </p>
          </div>
          <div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowForm(true);
                setEditingLog(null);
              }}
              className="gap-1.5 text-xs h-9 px-4 font-medium"
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />
              <span>Log a session</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
          {logs.map((log) => (
            <article
              key={log.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1 text-xs">
                {/* Date & Duration */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground font-sans">
                    {formatDate(log.session_date)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground tabular-nums">
                    {formatHours(Number(log.hours))}
                  </span>
                </div>

                {/* Group & Activity */}
                <p className="text-sm font-medium text-foreground truncate">
                  {log.group_name}
                </p>
                <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                  {log.activity}
                </p>

                {/* Notes */}
                {log.notes && (
                  <p className="text-muted-foreground/75 italic line-clamp-1 pt-0.5">
                    {log.notes}
                  </p>
                )}
              </div>

              {/* Actions dropdown menu */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Actions for session on ${log.session_date}`}
                    >
                      <MoreVertical className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem
                      onClick={() => handleEdit(log)}
                      disabled={isSyncing}
                      className="cursor-pointer gap-2"
                    >
                      <Edit2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Edit session</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingLog(log)}
                      disabled={isSyncing}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Delete session</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog
        open={deletingLog !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingLog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Delete CDS log?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Delete the session from{" "}
              <strong className="text-foreground">
                {deletingLog ? formatDate(deletingLog.session_date) : ""}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingLog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
