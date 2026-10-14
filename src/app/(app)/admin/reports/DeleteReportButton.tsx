"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteReport } from "./actions";

interface DeleteReportButtonProps {
  reportId: string;
  centreName: string;
  size?: "default" | "sm" | "xs" | "icon" | "icon-xs" | "icon-sm";
  variant?: "ghost" | "destructive" | "outline";
}

export function DeleteReportButton({
  reportId,
  centreName,
  size = "icon-sm",
  variant = "ghost",
}: DeleteReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteReport(reportId);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete report.");
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title={`Delete report for ${centreName}`}
          aria-label={`Delete report for ${centreName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            Delete Wait-Time Report?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Are you sure you want to delete this wait-time report for{" "}
            <span className="font-medium text-foreground">{centreName}</span>?
            This report will be permanently removed from citizen tracker aggregates.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
