"use client";

// ─── CDS Logger – Form ────────────────────────────────────────────────────────
// react-hook-form + zod client-side validation.
// Calls server actions for create/update.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="space-y-1.5">
        <Label htmlFor="cds-date" className="text-xs font-medium text-foreground">
          Session date <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="cds-date"
          type="date"
          max={today}
          {...register("session_date")}
          className="h-10 text-sm"
        />
        {errors.session_date && (
          <p role="alert" className="text-xs font-medium text-destructive mt-1">
            {errors.session_date.message}
          </p>
        )}
      </div>

      {/* Group Name */}
      <div className="space-y-1.5">
        <Label htmlFor="cds-group" className="text-xs font-medium text-foreground">
          CDS group name <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="cds-group"
          type="text"
          placeholder="e.g. Health Community Development"
          maxLength={100}
          {...register("group_name")}
          className="h-10 text-sm"
        />
        {errors.group_name && (
          <p role="alert" className="text-xs font-medium text-destructive mt-1">
            {errors.group_name.message}
          </p>
        )}
      </div>

      {/* Activity */}
      <div className="space-y-1.5">
        <Label htmlFor="cds-activity" className="text-xs font-medium text-foreground">
          Activity <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Textarea
          id="cds-activity"
          placeholder="Brief description of what you did at this session"
          rows={3}
          maxLength={500}
          {...register("activity")}
          className="min-h-[80px] text-sm resize-y"
        />
        {errors.activity && (
          <p role="alert" className="text-xs font-medium text-destructive mt-1">
            {errors.activity.message}
          </p>
        )}
      </div>

      {/* Hours */}
      <div className="space-y-1.5">
        <Label htmlFor="cds-hours" className="text-xs font-medium text-foreground">
          Hours <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="cds-hours"
          type="number"
          step="0.5"
          min="0.5"
          max="12"
          {...register("hours", { valueAsNumber: true })}
          className="h-10 text-sm"
        />
        {errors.hours && (
          <p role="alert" className="text-xs font-medium text-destructive mt-1">
            {errors.hours.message}
          </p>
        )}
      </div>

      {/* Notes (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="cds-notes" className="text-xs font-medium text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="cds-notes"
          placeholder="Any extra details — e.g. attendance roll number, facilitator name"
          rows={2}
          maxLength={1000}
          {...register("notes")}
          className="min-h-[64px] text-sm resize-y"
        />
        {errors.notes && (
          <p role="alert" className="text-xs font-medium text-destructive mt-1">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="sm"
          className="h-9 px-4 text-xs font-medium gap-1.5"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          <span>{editing ? "Save changes" : "Log session"}</span>
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
