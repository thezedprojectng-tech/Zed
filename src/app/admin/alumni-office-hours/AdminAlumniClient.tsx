"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  ExternalLink,
  GraduationCap,
  Globe,
  Save,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Layers,
} from "lucide-react";
import type {
  AlumniApplicationRow,
  AlumniProfileRow,
} from "@/lib/alumni-office-hours/types";
import {
  type AlumniApplicationStatus,
  type AlumniProfileStatus,
} from "@/lib/alumni-office-hours/constants";
import {
  adminGetAlumniApplications,
  adminGetAlumniProfiles,
  adminSetAlumniApplicationStatusAction,
  adminPublishAlumniAction,
  adminSetAlumniProfileStatusAction,
  adminDeleteAlumniApplicationAction,
} from "@/lib/alumni-office-hours/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { AdminDrawer } from "@/components/admin/primitives/AdminDrawer";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { AgePill } from "@/components/admin/people/AgePill";

interface AdminAlumniClientProps {
  initialApplications: AlumniApplicationRow[];
  initialAppsTotal: number;
  initialProfiles: AlumniProfileRow[];
  initialProfilesTotal: number;
  initialTab: "applications" | "profiles";
  initialAppStatus: string;
  initialProfileStatus: string;
  initialSearch: string;
  initialPage: number;
  initialPageSize: number;
  loadError?: string | null;
}

const TOP_TABS = [
  { id: "applications", label: "Applications" },
  { id: "profiles", label: "Directory Profiles" },
];

const APP_STATUS_OPTIONS = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
  { id: "all", label: "All" },
];

const PROFILE_STATUS_OPTIONS = [
  { id: "all", label: "All Profiles" },
  { id: "published", label: "Published" },
  { id: "unpublished", label: "Unpublished" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminAlumniClient({
  initialApplications,
  initialAppsTotal,
  initialProfiles,
  initialProfilesTotal,
  initialTab,
  initialAppStatus,
  initialProfileStatus,
  initialSearch,
  initialPage,
  initialPageSize,
  loadError,
}: AdminAlumniClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"applications" | "profiles">(initialTab);

  // Applications state
  const [applications, setApplications] = useState<AlumniApplicationRow[]>(initialApplications);
  const [appsTotal, setAppsTotal] = useState(initialAppsTotal);
  const [appsPage, setAppsPage] = useState(initialTab === "applications" ? initialPage : 1);
  const [appsSearch, setAppsSearch] = useState(initialTab === "applications" ? initialSearch : "");
  const [appsFilter, setAppsFilter] = useState(initialAppStatus);
  const [selectedApp, setSelectedApp] = useState<AlumniApplicationRow | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");

  // Profiles state
  const [profiles, setProfiles] = useState<AlumniProfileRow[]>(initialProfiles);
  const [profilesTotal, setProfilesTotal] = useState(initialProfilesTotal);
  const [profilesPage, setProfilesPage] = useState(initialTab === "profiles" ? initialPage : 1);
  const [profilesSearch, setProfilesSearch] = useState(initialTab === "profiles" ? initialSearch : "");
  const [profilesFilter, setProfilesFilter] = useState(initialProfileStatus);

  // Modals state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    applicationId: "",
    displayName: "",
    graduationYear: new Date().getFullYear(),
    institution: "",
    field: "",
    occupation: "",
    bio: "",
    topics: "",
    availability: "",
    contactUrl: "",
  });
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const appsTotalPages = Math.max(1, Math.ceil(appsTotal / initialPageSize));
  const profilesTotalPages = Math.max(1, Math.ceil(profilesTotal / initialPageSize));

  const updateUrl = useCallback(
    (newParams: {
      tab?: string;
      appStatus?: string;
      profileStatus?: string;
      search?: string;
      page?: number;
    }) => {
      const current = new URLSearchParams(searchParams.toString());
      if (newParams.tab !== undefined) current.set("tab", newParams.tab);
      if (newParams.appStatus !== undefined) current.set("appStatus", newParams.appStatus);
      if (newParams.profileStatus !== undefined) current.set("profileStatus", newParams.profileStatus);
      if (newParams.search !== undefined) {
        if (newParams.search) current.set("search", newParams.search);
        else current.delete("search");
      }
      if (newParams.page !== undefined) current.set("page", String(newParams.page));
      current.set("pageSize", String(initialPageSize));
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams, initialPageSize]
  );

  const fetchApplications = useCallback(
    (targetPage: number, targetStatus: string, targetSearch: string) => {
      startTransition(async () => {
        const res = await adminGetAlumniApplications({
          page: targetPage,
          pageSize: initialPageSize,
          status: targetStatus,
          search: targetSearch,
        });
        if (res.ok && res.data) {
          setApplications(res.data);
          setAppsTotal(res.total ?? 0);
          setAppsPage(res.page ?? targetPage);
          setAppsFilter(targetStatus);
        } else {
          toast.error(res.error || "Failed to reload applications");
        }
      });
    },
    [initialPageSize]
  );

  const fetchProfiles = useCallback(
    (targetPage: number, targetStatus: string, targetSearch: string) => {
      startTransition(async () => {
        const res = await adminGetAlumniProfiles({
          page: targetPage,
          pageSize: initialPageSize,
          status: targetStatus,
          search: targetSearch,
        });
        if (res.ok && res.data) {
          setProfiles(res.data);
          setProfilesTotal(res.total ?? 0);
          setProfilesPage(res.page ?? targetPage);
          setProfilesFilter(targetStatus);
        } else {
          toast.error(res.error || "Failed to reload profiles");
        }
      });
    },
    [initialPageSize]
  );

  const handleTopTabChange = (val: string) => {
    const nextTab = val as "applications" | "profiles";
    setActiveTab(nextTab);
    updateUrl({
      tab: nextTab,
      search: nextTab === "applications" ? appsSearch : profilesSearch,
      page: nextTab === "applications" ? appsPage : profilesPage,
    });
  };

  const openAppDetail = (app: AlumniApplicationRow) => {
    setSelectedApp(app);
    setAdminNotesInput(app.admin_notes || "");
  };

  const advanceToNextApp = (currentId: string) => {
    const currentIndex = applications.findIndex((a) => a.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < applications.length) {
      const next = applications[currentIndex + 1];
      setSelectedApp(next);
      setAdminNotesInput(next.admin_notes || "");
    } else {
      setSelectedApp(null);
    }
  };

  // Status changes
  const handleSetAppStatus = (status: AlumniApplicationStatus) => {
    if (!selectedApp) return;
    startTransition(async () => {
      const res = await adminSetAlumniApplicationStatusAction(
        selectedApp.id,
        status,
        adminNotesInput
      );
      if (res.ok) {
        toast.success(`Application marked as ${status}`);
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id
              ? { ...app, status, admin_notes: adminNotesInput || app.admin_notes }
              : app
          )
        );
        advanceToNextApp(selectedApp.id);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleSaveNotes = () => {
    if (!selectedApp) return;
    startTransition(async () => {
      const res = await adminSetAlumniApplicationStatusAction(
        selectedApp.id,
        selectedApp.status,
        adminNotesInput
      );
      if (res.ok) {
        toast.success("Admin notes saved");
        setSelectedApp((prev) => (prev ? { ...prev, admin_notes: adminNotesInput } : null));
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id ? { ...app, admin_notes: adminNotesInput } : app
          )
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save notes");
      }
    });
  };

  // Open publish dialog prefilled from application
  const handleOpenPublishDialog = (app: AlumniApplicationRow) => {
    setPublishForm({
      applicationId: app.id,
      displayName: app.full_name,
      graduationYear: app.graduation_year,
      institution: app.institution,
      field: app.field,
      occupation: app.occupation,
      bio: app.bio,
      topics: app.topics,
      availability: app.availability,
      contactUrl: app.contact_url,
    });
    setPublishDialogOpen(true);
  };

  // Submit publish
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adminPublishAlumniAction(publishForm);
      if (res.ok) {
        toast.success("Alumni profile published successfully!");
        setPublishDialogOpen(false);
        if (selectedApp) {
          advanceToNextApp(selectedApp.id);
        }
        fetchApplications(appsPage, appsFilter, appsSearch);
        fetchProfiles(profilesPage, profilesFilter, profilesSearch);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to publish alumni profile");
      }
    });
  };

  // Toggle profile status (publish/unpublish)
  const handleToggleProfileStatus = (profile: AlumniProfileRow) => {
    const nextStatus: AlumniProfileStatus =
      profile.status === "published" ? "unpublished" : "published";
    startTransition(async () => {
      const res = await adminSetAlumniProfileStatusAction(profile.id, nextStatus);
      if (res.ok) {
        toast.success(`Profile ${nextStatus === "published" ? "published" : "unpublished"}`);
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, status: nextStatus } : p))
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update profile status");
      }
    });
  };

  // Delete application
  const handleDeleteApplication = () => {
    if (!deleteConfirmAppId) return;
    startTransition(async () => {
      const res = await adminDeleteAlumniApplicationAction(deleteConfirmAppId);
      if (res.ok) {
        toast.success("Application and any linked profile removed");
        const nextTarget = applications.find((a) => a.id !== deleteConfirmAppId);
        setSelectedApp(nextTarget || null);
        if (nextTarget) setAdminNotesInput(nextTarget.admin_notes || "");
        setDeleteConfirmAppId(null);
        fetchApplications(appsPage, appsFilter, appsSearch);
        fetchProfiles(profilesPage, profilesFilter, profilesSearch);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete application");
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Alumni Office Hours"
        description="Review volunteer alumni mentor applications and manage published directory listings."
        icon={GraduationCap}
        section="programs"
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg border-border h-8 text-xs">
            <Link href="/alumni-office-hours" target="_blank">
              <Globe className="h-3.5 w-3.5" />
              <span>Public Directory</span>
            </Link>
          </Button>
        }
      />

      {loadError && (
        <div className="rounded-lg border border-[color:var(--data-negative-border)] bg-[color:var(--data-negative-subtle)] p-4 text-xs font-medium text-[color:var(--data-negative-ink)]">
          {loadError}
        </div>
      )}

      {/* Dual top tabs */}
      <div className="border-b border-border">
        <SegmentedControl
          options={TOP_TABS}
          value={activeTab}
          onChange={handleTopTabChange}
          ariaLabel="Alumni sections"
        />
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="space-y-5">
          {/* Sub Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SegmentedControl
              options={APP_STATUS_OPTIONS}
              value={appsFilter}
              onChange={(val) => {
                setAppsFilter(val);
                setAppsPage(1);
                updateUrl({ appStatus: val, page: 1, search: appsSearch });
                fetchApplications(1, val, appsSearch);
              }}
              ariaLabel="Alumni applications status filter"
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppsPage(1);
                updateUrl({ appStatus: appsFilter, page: 1, search: appsSearch });
                fetchApplications(1, appsFilter, appsSearch);
              }}
              className="relative w-full sm:w-72"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidate, role, company..."
                value={appsSearch}
                onChange={(e) => setAppsSearch(e.target.value)}
                className="h-9 pl-9 text-xs rounded-lg bg-card border-border"
              />
            </form>
          </div>

          {/* Applications Table */}
          <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
            {isPending ? (
              <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading alumni applications...</span>
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No alumni applications found"
                description={
                  appsFilter !== "all"
                    ? `No applications currently in status "${appsFilter}".`
                    : "No alumni applications have been submitted yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Candidate</th>
                      <th className="py-3 px-4 font-semibold">Field & Role</th>
                      <th className="py-3 px-4 font-semibold">Grad Year & School</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Submitted</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {applications.map((app) => {
                      const initials = getInitials(app.full_name);
                      return (
                        <tr
                          key={app.id}
                          onClick={() => openAppDetail(app)}
                          className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                        >
                          {/* Candidate */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[color:var(--data-signups-subtle)] border border-[color:var(--data-signups-border)] text-[color:var(--data-signups-ink)] flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
                                  {app.full_name}
                                </div>
                                <div className="text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                                  {app.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Field & Role */}
                          <td className="py-3 px-4">
                            <div className="text-foreground font-medium truncate max-w-[180px]">
                              {app.field}
                            </div>
                            <div className="text-muted-foreground truncate max-w-[180px] text-[11px]">
                              {app.occupation}
                            </div>
                          </td>

                          {/* Grad Year & School */}
                          <td className="py-3 px-4">
                            <div className="text-foreground font-mono text-[11px]">
                              Class of {app.graduation_year}
                            </div>
                            <div className="text-muted-foreground truncate max-w-[180px] text-[11px]">
                              {app.institution}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <StatusPill variant={app.status as any} />
                          </td>

                          {/* Submitted Date / Age */}
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                            {app.status === "new" || app.status === "reviewing" ? (
                              <AgePill submittedAt={app.created_at} />
                            ) : (
                              new Date(app.created_at).toLocaleDateString()
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAppDetail(app);
                              }}
                              className="h-7 px-2.5 text-xs text-muted-foreground group-hover:text-foreground"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {appsTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Page {appsPage} of {appsTotalPages} ({appsTotal} applications)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={appsPage <= 1 || isPending}
                  onClick={() => {
                    const p = appsPage - 1;
                    setAppsPage(p);
                    updateUrl({ appStatus: appsFilter, page: p, search: appsSearch });
                    fetchApplications(p, appsFilter, appsSearch);
                  }}
                  className="h-8 px-2.5 rounded-lg border-border"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={appsPage >= appsTotalPages || isPending}
                  onClick={() => {
                    const p = appsPage + 1;
                    setAppsPage(p);
                    updateUrl({ appStatus: appsFilter, page: p, search: appsSearch });
                    fetchApplications(p, appsFilter, appsSearch);
                  }}
                  className="h-8 px-2.5 rounded-lg border-border"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECTORY PROFILES */}
      {activeTab === "profiles" && (
        <div className="space-y-5">
          {/* Sub Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SegmentedControl
              options={PROFILE_STATUS_OPTIONS}
              value={profilesFilter}
              onChange={(val) => {
                setProfilesFilter(val);
                setProfilesPage(1);
                updateUrl({ profileStatus: val, page: 1, search: profilesSearch });
                fetchProfiles(1, val, profilesSearch);
              }}
              ariaLabel="Alumni profile status filter"
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProfilesPage(1);
                updateUrl({ profileStatus: profilesFilter, page: 1, search: profilesSearch });
                fetchProfiles(1, profilesFilter, profilesSearch);
              }}
              className="relative w-full sm:w-72"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alumni name, role, field..."
                value={profilesSearch}
                onChange={(e) => setProfilesSearch(e.target.value)}
                className="h-9 pl-9 text-xs rounded-lg bg-card border-border"
              />
            </form>
          </div>

          {/* Profiles Table */}
          <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
            {isPending ? (
              <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading directory profiles...</span>
              </div>
            ) : profiles.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No directory profiles found"
                description={
                  profilesFilter !== "all"
                    ? `No profiles with status "${profilesFilter}".`
                    : "No alumni profiles published yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Alumni</th>
                      <th className="py-3 px-4 font-semibold">Field & Institution</th>
                      <th className="py-3 px-4 font-semibold">Role & Occupation</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Published</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {profiles.map((profile) => {
                      const initials = getInitials(profile.display_name);
                      return (
                        <tr
                          key={profile.id}
                          className="hover:bg-secondary/40 transition-colors"
                        >
                          {/* Alumni */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[color:var(--data-verified-subtle)] border border-[color:var(--data-verified-border)] text-[color:var(--data-verified-ink)] flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
                                  {profile.display_name}
                                </div>
                                <div className="text-muted-foreground font-mono text-[11px]">
                                  Class of {profile.graduation_year}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Field & Institution */}
                          <td className="py-3 px-4">
                            <div className="text-foreground font-medium truncate max-w-[180px]">
                              {profile.field}
                            </div>
                            <div className="text-muted-foreground truncate max-w-[180px] text-[11px]">
                              {profile.institution}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <div className="text-foreground truncate max-w-[200px]">
                              {profile.occupation}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <StatusPill variant={profile.status as any} />
                          </td>

                          {/* Published Date */}
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {profile.published_at
                              ? new Date(profile.published_at).toLocaleDateString("en-NG", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleProfileStatus(profile)}
                                disabled={isPending}
                                className="h-7 px-2 text-xs rounded-lg border-border"
                              >
                                {profile.status === "published" ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Publish
                                  </>
                                )}
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Link
                                  href={`/alumni-office-hours/${profile.id}`}
                                  target="_blank"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {profilesTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Page {profilesPage} of {profilesTotalPages} ({profilesTotal} profiles)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={profilesPage <= 1 || isPending}
                  onClick={() => {
                    const p = profilesPage - 1;
                    setProfilesPage(p);
                    updateUrl({ profileStatus: profilesFilter, page: p, search: profilesSearch });
                    fetchProfiles(p, profilesFilter, profilesSearch);
                  }}
                  className="h-8 px-2.5 rounded-lg border-border"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={profilesPage >= profilesTotalPages || isPending}
                  onClick={() => {
                    const p = profilesPage + 1;
                    setProfilesPage(p);
                    updateUrl({ profileStatus: profilesFilter, page: p, search: profilesSearch });
                    fetchProfiles(p, profilesFilter, profilesSearch);
                  }}
                  className="h-8 px-2.5 rounded-lg border-border"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application Detail Drawer */}
      <AdminDrawer
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        title={selectedApp?.full_name || "Candidate Details"}
        subtitle={
          selectedApp
            ? `${selectedApp.occupation} • ${selectedApp.institution}`
            : undefined
        }
        badge={
          selectedApp && (
            <StatusPill variant={selectedApp.status as any} />
          )
        }
        timestamp={
          selectedApp && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {new Date(selectedApp.created_at).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )
        }
        footer={
          selectedApp && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmAppId(selectedApp.id)}
                className="text-xs text-[color:var(--data-negative-ink)] border-[color:var(--data-negative-border)] hover:bg-[color:var(--data-negative-subtle)] gap-1.5 h-8 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || selectedApp.status === "declined"}
                  onClick={() => handleSetAppStatus("declined")}
                  className="text-xs h-8 rounded-lg text-[color:var(--data-negative-ink)] hover:bg-[color:var(--data-negative-subtle)] border-border"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Decline
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleOpenPublishDialog(selectedApp)}
                  className="text-xs h-8 rounded-lg gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Publish to Directory
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedApp && (
          <div className="space-y-5 text-xs p-5">
            {/* Quick Status Bar */}
            <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                Set Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["new", "reviewing", "approved", "declined"] as AlumniApplicationStatus[]).map(
                  (st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedApp.status === st ? "default" : "outline"}
                      disabled={isPending || selectedApp.status === st}
                      onClick={() => handleSetAppStatus(st)}
                      className="text-xs h-7 px-2.5 rounded-lg border-border capitalize"
                    >
                      {st}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Candidate details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </span>
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="font-medium text-primary hover:underline block truncate"
                >
                  {selectedApp.email}
                </a>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Booking / LinkedIn URL
                </span>
                <a
                  href={selectedApp.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline block truncate"
                >
                  {selectedApp.contact_url}
                </a>
              </div>
            </div>

            {/* Professional Profile */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-2.5">
              <div className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Professional Details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Field / Track</span>
                  <p className="font-semibold text-foreground">{selectedApp.field}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Current Role</span>
                  <p className="font-medium text-foreground">{selectedApp.occupation}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Alma Mater</span>
                  <p className="font-medium text-foreground">{selectedApp.institution}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Graduation Year</span>
                  <p className="font-mono font-medium text-foreground">{selectedApp.graduation_year}</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <div className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Bio & Background
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {selectedApp.bio}
              </p>
            </div>

            {/* Topics & Availability */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground block text-[11px]">Topics Offered</span>
                <p className="font-medium text-foreground">{selectedApp.topics}</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground block text-[11px]">Availability Schedule</span>
                <p className="font-medium text-foreground">{selectedApp.availability}</p>
              </div>
            </div>

            {/* Admin Review Notes */}
            <div className="p-3.5 rounded-lg border border-border bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Admin Review Notes
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleSaveNotes}
                  className="text-[11px] h-7 px-2 gap-1 rounded-lg border-border"
                >
                  <Save className="h-3 w-3" />
                  <span>Save Notes</span>
                </Button>
              </div>
              <textarea
                rows={3}
                placeholder="Private internal notes regarding this alumni..."
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed resize-y"
              />
            </div>
          </div>
        )}
      </AdminDrawer>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-lg">
          <form onSubmit={handlePublishSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Publish to Alumni Directory
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sanitize and confirm the public profile that will be visible to students and youth.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Display Name</label>
                  <Input
                    value={publishForm.displayName}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, displayName: e.target.value }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Graduation Year</label>
                  <Input
                    type="number"
                    value={publishForm.graduationYear}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, graduationYear: parseInt(e.target.value, 10) }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Institution</label>
                  <Input
                    value={publishForm.institution}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, institution: e.target.value }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Field / Domain</label>
                  <Input
                    value={publishForm.field}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, field: e.target.value }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Occupation / Title</label>
                <Input
                  value={publishForm.occupation}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, occupation: e.target.value }))
                  }
                  className="h-8 text-xs rounded-lg bg-background border-border"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Public Bio</label>
                <Textarea
                  rows={3}
                  value={publishForm.bio}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  className="text-xs rounded-lg bg-background border-border leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Topics Offered</label>
                  <Input
                    value={publishForm.topics}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, topics: e.target.value }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Availability</label>
                  <Input
                    value={publishForm.availability}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, availability: e.target.value }))
                    }
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Public Contact / Booking URL</label>
                <Input
                  type="url"
                  value={publishForm.contactUrl}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, contactUrl: e.target.value }))
                  }
                  className="h-8 text-xs rounded-lg bg-background border-border"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPublishDialogOpen(false)}
                disabled={isPending}
                className="text-xs h-8 rounded-lg border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isPending}
                className="text-xs h-8 rounded-lg gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Publish to Directory</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmAppId}
        onOpenChange={(open) => !open && setDeleteConfirmAppId(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Alumni Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this alumni application and any linked
              directory profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmAppId(null)}
              disabled={isPending}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeleteApplication}
              className="text-xs h-8 rounded-lg gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
