"use client";

import { useState, useTransition, useRef, useEffect } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Clock,
  Circle,
  UserX,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteUserAction, changeUserRoleAction, adminClearUserProfileAction } from "./actions";
import { adminRevealUserPhoneAction } from "@/lib/comms/admin-actions";
import { SendMessageDialog } from "@/components/admin/comms/SendMessageDialog";
import { getLevelName } from "@/types";
import { PanelSection, FieldList, FieldItem } from "@/components/admin/primitives/PanelSection";
import { StatusPill } from "@/components/admin/people/StatusPill";

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

const GUIDES_LIST = ["passport", "nysc", "nin-bvn", "cac"] as const;

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
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealingPhone, setRevealingPhone] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const phoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
      setRevealedPhone(null);
    };
  }, [user?.id, open]);

  const handleRevealPhone = async () => {
    if (!user) return;
    setRevealingPhone(true);
    try {
      const res = await adminRevealUserPhoneAction(user.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to reveal phone number");
        return;
      }
      if (!res.data) {
        toast.error("Failed to reveal phone number");
        return;
      }
      setRevealedPhone(res.data.phone);
      toast.info("Access is logged");

      // Auto-hide after 60 seconds
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
      phoneTimerRef.current = setTimeout(() => {
        setRevealedPhone(null);
      }, 60000);
    } catch {
      toast.error("Failed to reveal phone number");
    } finally {
      setRevealingPhone(false);
    }
  };

  const handleCopyPhone = async () => {
    if (!revealedPhone) return;
    try {
      await navigator.clipboard.writeText(revealedPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
      toast.success("Phone number copied to clipboard");
    } catch {
      // ignore
    }
  };

  const cleanWhatsAppPhone = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0") && clean.length === 11) {
      clean = `234${clean.slice(1)}`;
    }
    return clean;
  };

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

  const startedGuidesCount = GUIDES_LIST.filter(
    (fid) => user.guidesProgress?.[fid]?.started
  ).length;

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
      <Sheet
        open={open}
        onOpenChange={(openState) => {
          if (!openState) {
            if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
            setRevealedPhone(null);
          }
          onOpenChange(openState);
        }}
      >
        <SheetContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-full sm:max-w-md p-0 flex flex-col bg-card border-border overflow-y-auto focus-visible:outline-hidden"
        >
          {/* Identity Header: Avatar, Name, Email (with Tooltip), Pills in clean row */}
          <SheetHeader className="p-5 border-b border-border/70 text-left space-y-3">
            <div className="flex items-start gap-3.5">
              <Avatar className="h-12 w-12 border border-border shrink-0 rounded-lg">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="font-sans text-sm font-bold bg-muted text-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-base font-semibold text-foreground truncate font-sans">
                    {user.full_name || "User"}
                  </SheetTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px] font-sans cursor-default hover:text-foreground transition-colors">
                        {user.email || user.masked_phone}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="text-xs font-sans">
                      {user.email || user.masked_phone}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <SheetDescription className="sr-only">
                  User details and management options for {user.full_name}
                </SheetDescription>

                {/* Identity Badges / Pills in one clean row */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <StatusPill
                    variant={user.role === "admin" ? "admin" : "user"}
                    size="sm"
                  />
                  <Badge
                    variant="outline"
                    className={`text-[10px] rounded-md font-sans font-medium py-0.5 px-2 gap-1 ${
                      user.is_verified
                        ? "border-[color:var(--data-verified-border)] bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)]"
                        : "border-[color:var(--data-flows-border)] bg-[color:var(--data-flows-subtle)] text-[color:var(--data-flows-ink)]"
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
                    className="border-primary/30 bg-primary/10 text-primary text-[10px] rounded-md font-sans font-medium py-0.5 px-2"
                  >
                    Level {user.level_id} · {getLevelName(user.level_id)}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Profile Details & Metadata - 24px vertical rhythm, separated by 1px soft borders */}
          <div className="p-5 space-y-6 flex-1 text-xs">
            {/* Account Information Section */}
            <PanelSection title="Account information">
              <FieldList columns={2}>
                {revealedPhone ? (
                  <FieldItem label="Phone number (revealed)" span={2}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="tabular-nums font-mono text-xs font-semibold text-foreground">
                        {revealedPhone}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="p-1 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy phone number"
                        aria-label="Copy phone number"
                      >
                        {phoneCopied ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <a
                        href={`https://wa.me/${cleanWhatsAppPhone(revealedPhone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
                          setRevealedPhone(null);
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline ml-auto cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Auto-hides in 60s. Access is logged.
                    </p>
                  </FieldItem>
                ) : (
                  <FieldItem label="Phone (masked)">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs">{user.masked_phone}</span>
                      <button
                        type="button"
                        onClick={handleRevealPhone}
                        disabled={revealingPhone}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        {revealingPhone ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        <span>Show number</span>
                      </button>
                    </div>
                  </FieldItem>
                )}
                <FieldItem label="Joined date">
                  <span className="font-sans text-xs tabular-nums">
                    {new Date(user.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </FieldItem>
                {user.updated_at && (
                  <FieldItem label="Last updated">
                    <span className="font-sans text-xs tabular-nums">
                      {new Date(user.updated_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </FieldItem>
                )}
                <FieldItem label="User identifier" span={2}>
                  <span className="font-mono text-[11px] text-muted-foreground break-all select-all">
                    {user.id}
                  </span>
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Guide Progress Section */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection
                title="Guide progress"
                description={`${startedGuidesCount} of ${GUIDES_LIST.length} guides started`}
              >
                <div className="space-y-1.5 pt-1">
                  {GUIDES_LIST.map((fid) => {
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
                        className="flex items-center justify-between gap-3 text-xs py-1.5 px-1"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-foreground truncate font-sans block">
                              {name}
                            </span>
                            {prog?.started && (
                              <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                                {completedCount} of {totalSteps || "?"} steps completed
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-xs font-sans shrink-0",
                            isDone
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : prog?.started
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {isDone ? "Completed" : prog?.started ? "In progress" : "Not started"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </PanelSection>
            </div>

            {/* Manage Access Section */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection
                title="Manage access"
                description="Elevate permissions, moderate profile content, or manage account roles."
              >
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Make admin / Demote button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(user.role === "admin" ? "user" : "admin");
                        setRoleDialogOpen(true);
                      }}
                      disabled={isSelf}
                      className="gap-1.5 text-xs h-9 rounded-md border-border hover:bg-secondary font-sans"
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      <span>{user.role === "admin" ? "Demote from admin" : "Make admin"}</span>
                    </Button>

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
                      className="gap-1.5 text-xs h-9 rounded-md border-border hover:bg-secondary font-sans"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Clear profile fields</span>
                    </Button>

                    {/* Message User Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSendMessageOpen(true)}
                      className="gap-1.5 text-xs h-9 rounded-md border-border hover:bg-secondary font-sans"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>Message user</span>
                    </Button>
                  </div>

                  {isSelf && (
                    <p className="text-[11px] text-muted-foreground font-sans">
                      You cannot modify permissions or delete your own admin account.
                    </p>
                  )}
                  {!isSelf && isTargetAdmin && (
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Administrators cannot be directly deleted. Demote to user first if required.
                    </p>
                  )}
                </div>
              </PanelSection>
            </div>

            {/* Danger Zone Section */}
            <div className="border-t border-destructive/20 pt-6">
              <PanelSection
                title="Danger zone"
                description="Irreversible actions regarding this user account and associated data."
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTypedEmail("");
                    setDeleteDialogOpen(true);
                  }}
                  disabled={isSelf || isTargetAdmin}
                  className="w-full gap-2 text-xs h-9 rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-sans font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete user</span>
                </Button>
              </PanelSection>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete User Safeguard Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2 font-sans font-semibold">
              <Trash2 className="h-4 w-4" />
              Permanently delete user?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 space-y-2 font-sans">
              <span>
                This action is irreversible. It will delete the user account from Supabase Auth and cascade
                to all user profiles, documents, and guide progress.
              </span>
              <span className="block p-2.5 rounded-md border border-border bg-secondary/50 font-sans text-xs text-foreground mt-2">
                To confirm, type the user&apos;s email address:
                <strong className="block mt-0.5 text-foreground font-sans">{expectedEmail || "(no email on file)"}</strong>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <input
              type="email"
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              placeholder="Type user's email to confirm..."
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-xs font-sans text-foreground placeholder:text-muted-foreground outline-none focus:border-destructive transition-colors"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending} className="h-9 rounded-md">
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
              className="gap-1.5 h-9 rounded-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Profile Fields Dialog */}
      <Dialog open={clearProfileDialogOpen} onOpenChange={setClearProfileDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 font-sans font-semibold">
              <UserX className="h-4 w-4 text-amber-500" />
              Clear profile fields
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 font-sans">
              Reset profile fields for{" "}
              <strong className="text-foreground">{user.full_name}</strong> that violate community guidelines or impersonate official staff. An entry will be permanently logged in the audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2 font-sans">
                Select fields to clear:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none font-sans">
                  <input
                    type="checkbox"
                    checked={clearUsername}
                    onChange={(e) => setClearUsername(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Username (resets to null)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none font-sans">
                  <input
                    type="checkbox"
                    checked={clearDisplayName}
                    onChange={(e) => setClearDisplayName(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Display name (resets to null)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none font-sans">
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
              <label htmlFor="clear-reason" className="text-xs font-semibold text-foreground block mb-1 font-sans">
                Reason for action <span className="text-destructive">*</span>
              </label>
              <textarea
                id="clear-reason"
                value={clearReason}
                onChange={(e) => setClearReason(e.target.value)}
                rows={3}
                placeholder="e.g. Offensive username, impersonation, or copyright infringement..."
                className="w-full p-2.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none font-sans"
              />
              <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                Required for admin audit compliance (minimum 3 characters).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending} className="h-9 rounded-md">
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
              className="gap-1.5 h-9 rounded-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear selected fields"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Safeguard Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 font-sans font-semibold">
              <UserCog className="h-4 w-4 text-primary" />
              Change user role
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 font-sans">
              Change permissions for{" "}
              <strong className="text-foreground">{user.full_name}</strong>.
              Administrators have full read access to all user data, moderation tools, and the audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold text-foreground font-sans">Select new role:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`p-3 rounded-md border text-left text-xs transition-colors cursor-pointer ${
                  selectedRole === "user"
                    ? "border-primary bg-primary/10 text-foreground font-semibold"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="block font-medium font-sans">Standard user</span>
                <span className="text-[11px] text-muted-foreground font-sans">Standard access</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`p-3 rounded-md border text-left text-xs transition-colors cursor-pointer ${
                  selectedRole === "admin"
                    ? "border-[color:var(--data-flows-border)] bg-[color:var(--data-flows-subtle)] text-foreground font-semibold"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <span className="block font-medium text-[color:var(--data-flows-ink)] font-sans">Administrator</span>
                <span className="text-[11px] text-muted-foreground font-sans">Full console access</span>
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isPending} className="h-9 rounded-md">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              size="sm"
              disabled={isPending || selectedRole === user.role}
              onClick={handleRoleChange}
              className="gap-1.5 h-9 rounded-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message User Dialog */}
      <SendMessageDialog
        open={sendMessageOpen}
        onOpenChange={setSendMessageOpen}
        preselectedUser={{
          id: user.id,
          name: user.full_name || "User",
        }}
      />
    </>
  );
}
