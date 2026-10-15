"use client";

// ─── CDS Logger – Form ────────────────────────────────────────────────────────
// react-hook-form + zod client-side validation.
// Calls server actions for create/update.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cdsLogSchema, type CdsLogFormData } from "@/lib/cds/helpers";
import type { CdsLog } from "@/types/cds";

interface CdsLogFormProps {
  /** If provided, the form operates in edit mode */
  editing?: CdsLog;
  onSuccess: (log: CdsLog) => void;
  onCancel?: () => void;
  onCreate: (raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
  onUpdate: (id: string, raw: unknown) => Promise<{ log: CdsLog } | { error: string }>;
}

const today = new Date().toISOString().slice(0, 10);

export function CdsLogForm({
  editing,
  onSuccess,
  onCancel,
  onCreate,
  onUpdate,
}: CdsLogFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CdsLogFormData>({
    resolver: zodResolver(cdsLogSchema),
    defaultValues: editing
      ? {
          session_date: editing.session_date,
          group_name: editing.group_name,
          activity: editing.activity,
          hours: editing.hours,
          notes: editing.notes ?? "",
        }
      : {
          session_date: today,
          group_name: "",
          activity: "",
          hours: 2,
          notes: "",
        },
  });

  const onSubmit = async (data: CdsLogFormData) => {
    const result = editing
      ? await onUpdate(editing.id, data)
      : await onCreate(data);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "CDS log updated." : "CDS session logged!");
    onSuccess(result.log);
    if (!editing) reset({ session_date: today, group_name: "", activity: "", hours: 2, notes: "" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Date */}
      <div className="space-y-1">
        <label htmlFor="cds-date" className="type-caption font-medium text-foreground">
          Session Date <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <input
          id="cds-date"
          type="date"
          max={today}
          {...register("session_date")}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {errors.session_date && (
          <p role="alert" className="text-xs text-destructive">{errors.session_date.message}</p>
        )}
      </div>

      {/* Group Name */}
      <div className="space-y-1">
        <label htmlFor="cds-group" className="type-caption font-medium text-foreground">
          CDS Group Name <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <input
          id="cds-group"
          type="text"
          placeholder="e.g. Health Community Development"
          maxLength={100}
          {...register("group_name")}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {errors.group_name && (
          <p role="alert" className="text-xs text-destructive">{errors.group_name.message}</p>
        )}
      </div>

      {/* Activity */}
      <div className="space-y-1">
        <label htmlFor="cds-activity" className="type-caption font-medium text-foreground">
          Activity <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <textarea
          id="cds-activity"
          placeholder="Brief description of what you did at this session"
          rows={3}
          maxLength={500}
          {...register("activity")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-y min-h-[72px]"
        />
        {errors.activity && (
          <p role="alert" className="text-xs text-destructive">{errors.activity.message}</p>
        )}
      </div>

      {/* Hours */}
      <div className="space-y-1">
        <label htmlFor="cds-hours" className="type-caption font-medium text-foreground">
          Hours <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <input
          id="cds-hours"
          type="number"
          step="0.5"
          min="0.5"
          max="12"
          {...register("hours", { valueAsNumber: true })}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {errors.hours && (
          <p role="alert" className="text-xs text-destructive">{errors.hours.message}</p>
        )}
      </div>

      {/* Notes (optional) */}
      <div className="space-y-1">
        <label htmlFor="cds-notes" className="type-caption font-medium text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="cds-notes"
          placeholder="Any extra details — e.g. attendance roll number, facilitator name"
          rows={2}
          maxLength={1000}
          {...register("notes")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-y min-h-[56px]"
        />
        {errors.notes && (
          <p role="alert" className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} className="gap-1.5">
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {editing ? "Save Changes" : "Log Session"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
