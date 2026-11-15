"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Bell,
  Send,
  Users,
  User,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminSendNotificationAction } from "@/lib/comms/admin-actions";

export interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: {
    id: string;
    name: string;
  } | null;
  onSuccess?: () => void;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  preselectedUser,
  onSuccess,
}: SendMessageDialogProps) {
  const [audience, setAudience] = useState<"all" | "user">(
    preselectedUser ? "user" : "all"
  );
  const [userId, setUserId] = useState(preselectedUser?.id || "");
  const [userName, setUserName] = useState(preselectedUser?.name || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (preselectedUser) {
      setAudience("user");
      setUserId(preselectedUser.id);
      setUserName(preselectedUser.name);
    } else {
      setAudience("all");
      setUserId("");
      setUserName("");
    }
  }, [preselectedUser, open]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setHref("");
    setError(null);
    setConfirmBroadcastOpen(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const validate = (): boolean => {
    setError(null);
    if (!title.trim() || title.length > 140) {
      setError("Title is required and must not exceed 140 characters.");
      return false;
    }
    if (body.length > 500) {
      setError("Body cannot exceed 500 characters.");
      return false;
    }
    if (href.trim()) {
      if (!href.trim().startsWith("/")) {
        setError("Internal link must start with a slash '/' (e.g. /home or /news).");
        return false;
      }
    }
    if (audience === "user" && !userId.trim()) {
      setError("Please specify the recipient user ID.");
      return false;
    }
    return true;
  };

  const executeSend = async () => {
    startTransition(async () => {
      const res = await adminSendNotificationAction({
        audience,
        userId: audience === "user" ? userId.trim() : null,
        title: title.trim(),
        body: body.trim(),
        href: href.trim() || null,
      });

      if (!res.ok) {
        setError(res.error || "Failed to send notification.");
        return;
      }

      toast.success(
        audience === "all"
          ? "Broadcast notification sent to all users"
          : `Notification sent to ${userName || "user"}`
      );
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (audience === "all") {
      setConfirmBroadcastOpen(true);
    } else {
      executeSend();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span>Send notification</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dispatch a high-priority system notification or direct announcement to active members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Audience selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recipient audience</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience("all")}
                  className={`p-2.5 rounded-md border text-left text-xs transition-colors flex items-center gap-2 ${
                    audience === "all"
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <span className="block font-medium">All users</span>
                    <span className="text-[10px] text-muted-foreground">Broadcast to community</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("user")}
                  className={`p-2.5 rounded-md border text-left text-xs transition-colors flex items-center gap-2 ${
                    audience === "user"
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <User className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <span className="block font-medium">Single user</span>
                    <span className="text-[10px] text-muted-foreground">Direct notification</span>
                  </div>
                </button>
              </div>
            </div>

            {/* User ID input when audience is user */}
            {audience === "user" && (
              <div className="space-y-1">
                <Label htmlFor="target-user-id" className="text-xs font-semibold">
                  Target user ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target-user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="h-9 text-xs font-mono"
                  required
                />
                {userName && (
                  <p className="text-[11px] text-muted-foreground">
                    Sending to <strong className="text-foreground">{userName}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-title" className="text-xs font-semibold">
                  Notification title <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {title.length}/140
                </span>
              </div>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Platform update: New feature available"
                maxLength={140}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-body" className="text-xs font-semibold">
                  Message body
                </Label>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {body.length}/500
                </span>
              </div>
              <Textarea
                id="notification-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Brief summary or action required for the user..."
                maxLength={500}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            {/* Link */}
            <div className="space-y-1">
              <Label htmlFor="notification-href" className="text-xs font-semibold">
                Internal destination link (optional)
              </Label>
              <Input
                id="notification-href"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="e.g. /home or /news/latest-announcement"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Must start with a leading slash &lsquo;/&rsquo;. Clicking notification routes directly to this path.
              </p>
            </div>

            {/* Live Preview */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                Live preview
              </Label>
              <div className="rounded-md border border-border bg-card p-3 space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {title.trim() || "Notification title"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">Just now</span>
                    </div>
                    {body.trim() && (
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                        {body}
                      </p>
                    )}
                    {href.trim() && (
                      <div className="flex items-center gap-1 text-[11px] text-primary mt-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{href}</span>
                      </div>
                    )}
                  </div>
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
                disabled={isPending}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !title.trim()}
                className="h-9 gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{audience === "all" ? "Broadcast message" : "Send message"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Broadcast to all users */}
      <Dialog open={confirmBroadcastOpen} onOpenChange={setConfirmBroadcastOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Broadcast confirmation</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 space-y-2">
              <span className="block">
                This goes to every user.
              </span>
              <span className="block p-3 rounded-md border border-border bg-secondary/50 font-medium text-foreground">
                &ldquo;{title}&rdquo;
              </span>
              <span className="block text-[11px] text-muted-foreground">
                All registered members will immediately receive this notification in their feed.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmBroadcastOpen(false)}
              className="h-9"
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setConfirmBroadcastOpen(false);
                executeSend();
              }}
              className="h-9 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirm and broadcast</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
