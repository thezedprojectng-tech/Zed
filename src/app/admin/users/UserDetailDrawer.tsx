"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Phone,
  Trash2,
  UserCog,
  Loader2,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  CheckCircle2,
  Circle,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { deleteUserAction, changeUserRoleAction, adminClearUserProfileAction } from "./actions";
import { getLevelName } from "@/types";

export interface UserDetail {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  masked_phone: string;
  email?: string;
  level_id: number;
  is_verified: boolean;
  role: string;
  created_at: string;
  updated_at?: string;
  guidesProgress?: Record<
    string,
    {
      started: boolean;
      completed: boolean;
      completed_steps?: string[];
      steps?: string[];
      current_step_id?: string;
    }
  >;
}

interface UserDetailDrawerProps {
  user: UserDetail | null;
  currentAdminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

const guideIcons: Record<string, React.ElementType> = {
  passport: BookOpen,
  nysc: GraduationCap,
  "nin-bvn": Fingerprint,
  cac: Building2,
};

const guideNames: Record<string, string> = {
  passport: "Nigerian Passport",
  nysc: "NYSC Mobilisation",
  "nin-bvn": "NIN & BVN Registration",
  cac: "CAC Business Registration",
};

export function UserDetailDrawer({
  user,
  currentAdminId,
  open,
  onOpenChange,
  onUserUpdated,
}: UserDetailDrawerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [clearProfileDialogOpen, setClearProfileDialogOpen] = useState(false);
  const [clearUsername, setClearUsername] = useState(false);
  const [clearDisplayName, setClearDisplayName] = useState(false);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [clearReason, setClearReason] = useState("");
  const [typedEmail, setTypedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const isSelf = user.id === currentAdminId;
  const isTargetAdmin = user.role === "admin";
  const expectedEmail = user.email || "";

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAction(user.id, typedEmail);
      if (!res.success) {
        toast.error(res.error || "Failed to delete user.");
      } else {
        toast.success(`User ${user.full_name} has been permanently deleted.`);
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onUserUpdated?.();
      }
    });
  };

  const handleRoleChange = () => {
    startTransition(async () => {
      const res = await changeUserRoleAction(user.id, selectedRole);
      if (!res.success) {
        toast.error(res.error || "Failed to change role.");
      } else {
        toast.success(`Role updated to ${selectedRole} for ${user.full_name}.`);
        setRoleDialogOpen(false);
        onOpenChange(false);
        onUserUpdated?.();
      }
    });
  };

  const handleClearProfile = () => {
    startTransition(async () => {
      const res = await adminClearUserProfileAction({
        userId: user.id,
        clearUsername,
        clearDisplayName,
        clearAvatar,
        reason: clearReason,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to clear profile fields.");
      } else {
        toast.success(res.message || "Profile fields cleared.");
        setClearProfileDialogOpen(false);
        setClearUsername(false);
        setClearDisplayName(false);
        setClearAvatar(false);
        setClearReason("");
        onUserUpdated?.();
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-card border-border overflow-y-auto">
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border/70 text-left space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border shrink-0">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="font-mono text-sm font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-bold text-foreground truncate">
                  {user.full_name || "User"}
                </SheetTitle>
                <SheetDescription className="text-xs font-mono text-muted-foreground truncate">
                  {user.email || user.masked_phone}
                </SheetDescription>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      user.role === "admin"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-mono uppercase"
                        : "border-border text-muted-foreground text-[10px] font-mono"
                    }
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono gap-1 ${
                      user.is_verified
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {user.is_verified ? (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3" />
                        Unverified
                      </>
                    )}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono"
                  >
                    Level {user.level_id} · {getLevelName(user.level_id)}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Profile Details & Metadata */}
          <div className="p-5 space-y-6 flex-1">
            {/* Metadata Grid */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Account Information
              </h4>
              <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone (Masked)
                  </span>
                  <span className="font-mono text-foreground">{user.masked_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined Date
                  </span>
                  <span className="font-mono text-foreground">
                    {new Date(user.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {user.updated_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-mono text-foreground">
                      {new Date(user.updated_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                  <span className="text-muted-foreground">Identity Privacy</span>
                  <span className="font-mono text-emerald-500">
                    Salted SHA-256 (Raw NIN never stored)
                  </span>
                </div>
              </div>
            </div>

            {/* Guide Progress */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Guide Progress (nav_progress)
              </h4>
              <div className="space-y-2">
                {["passport", "nysc", "nin-bvn", "cac"].map((fid) => {
                  const Icon = guideIcons[fid] || BookOpen;
                  const name = guideNames[fid] || fid;
                  const prog = user.guidesProgress?.[fid];
                  const completedCount = prog?.completed_steps?.length || 0;
                  const totalSteps = prog?.steps?.length || 0;
                  const isDone =
                    prog?.completed || (totalSteps > 0 && completedCount === totalSteps);

                  return (
                    <div
                      key={fid}
                      className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-md border border-border bg-secondary/50 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {prog?.started
                              ? `${completedCount} of ${totalSteps || "?"} steps completed`
                              : "Not started"}
                          </p>
                        </div>
                      </div>

                      {isDone ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-mono gap-1 shrink-0"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      ) : prog?.started ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono shrink-0"
                        >
                          In Progress
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground text-[10px] font-mono shrink-0"
                        >
                          Idle
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions with Safeguards */}
            <div className="space-y-2.5 pt-2 border-t border-border/70">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Administrative Actions
              </h4>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Change Role Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(user.role === "admin" ? "user" : "admin");
                      setRoleDialogOpen(true);
                    }}
                    disabled={isSelf}
                    className="gap-1.5 text-xs border-border hover:bg-secondary"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    <span>{user.role === "admin" ? "Demote to User" : "Make Admin"}</span>
                  </Button>

                  {/* Delete User Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setTypedEmail("");
                      setDeleteDialogOpen(true);
                    }}
                    disabled={isSelf || isTargetAdmin}
                    className="gap-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User</span>
                  </Button>
                </div>

                {/* Clear Profile Moderation Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClearUsername(false);
                    setClearDisplayName(false);
                    setClearAvatar(false);
                    setClearReason("");
                    setClearProfileDialogOpen(true);
                  }}
                  disabled={isSelf}
                  className="w-full gap-1.5 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Clear Profile Fields</span>
                </Button>
              </div>

              {isSelf && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  * You cannot modify or delete your own admin account.
                </p>
              )}
              {!isSelf && isTargetAdmin && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  * Other administrators cannot be directly deleted. Demote first if necessary.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete User Safeguard Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Permanently Delete User?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 space-y-2">
              <p>
                This action is irreversible. It will delete the user account from Supabase Auth and cascade
                to all user profiles, documents, and guide progress.
              </p>
              <div className="p-2.5 rounded-md border border-border bg-secondary/50 font-mono text-[11px] text-foreground">
                To confirm, type the user&apos;s email address:
                <strong className="block mt-0.5 text-foreground">{expectedEmail || "(no email on file)"}</strong>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <input
              type="email"
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              placeholder="Type user's email to confirm..."
              className="w-full h-9 px-3 rounded-lg border border-border bg-secondary/40 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-destructive transition-colors"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={
                isPending ||
                !expectedEmail ||
                typedEmail.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()
              }
              onClick={handleDelete}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Profile Fields Dialog */}
      <Dialog open={clearProfileDialogOpen} onOpenChange={setClearProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4 text-amber-500" />
              Clear Profile Fields
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Reset profile fields for{" "}
              <strong className="text-foreground">{user.full_name}</strong> that violate community guidelines or impersonate official staff. An entry will be permanently logged in the audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Select fields to clear:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearUsername}
                    onChange={(e) => setClearUsername(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Username (resets to null)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearDisplayName}
                    onChange={(e) => setClearDisplayName(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Display Name (resets to null)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearAvatar}
                    onChange={(e) => setClearAvatar(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Avatar (resets to null &amp; deletes storage file)</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="clear-reason" className="text-xs font-semibold text-foreground block mb-1">
                Reason for action <span className="text-destructive">*</span>
              </label>
              <textarea
                id="clear-reason"
                value={clearReason}
                onChange={(e) => setClearReason(e.target.value)}
                rows={3}
                placeholder="e.g. Offensive username, impersonation, or copyright infringement..."
                className="w-full p-2.5 rounded-lg border border-border bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Required for admin audit compliance (minimum 3 characters).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={
                isPending ||
                (!clearUsername && !clearDisplayName && !clearAvatar) ||
                clearReason.trim().length < 3
              }
              onClick={handleClearProfile}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Selected Fields"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Safeguard Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              Change User Role
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Change permissions for{" "}
              <strong className="text-foreground">{user.full_name}</strong>.
              Administrators have full read access to all user data, moderation tools, and the audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold text-foreground">Select New Role:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  selectedRole === "user"
                    ? "border-primary bg-primary/10 text-foreground font-semibold"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="block font-medium">Standard User</span>
                <span className="text-[10px] text-muted-foreground">Standard access</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  selectedRole === "admin"
                    ? "border-amber-500 bg-amber-500/10 text-foreground font-semibold"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="block font-medium text-amber-500">Administrator</span>
                <span className="text-[10px] text-muted-foreground">Full console access</span>
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              size="sm"
              disabled={isPending || selectedRole === user.role}
              onClick={handleRoleChange}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
