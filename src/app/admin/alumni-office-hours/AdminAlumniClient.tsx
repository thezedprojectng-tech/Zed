"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  ExternalLink,
  Building2,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Eye,
  EyeOff,
  Edit,
  Save,
  MessageSquare,
  Globe,
} from "lucide-react";
import type {
  AlumniApplicationRow,
  AlumniProfileRow,
} from "@/lib/alumni-office-hours/types";
import {
  ALUMNI_APPLICATION_STATUSES,
  ALUMNI_PROFILE_STATUSES,
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
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AdminAlumniClientProps {
  initialApplications: AlumniApplicationRow[];
  initialAppsTotal: number;
  initialProfiles: AlumniProfileRow[];
  initialProfilesTotal: number;
  loadError?: string | null;
}

const APP_STATUS_CONFIG: Record<
  AlumniApplicationStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  new: { label: "New", variant: "default" },
  reviewing: { label: "Reviewing", variant: "secondary" },
  approved: { label: "Approved", variant: "outline" },
  declined: { label: "Declined", variant: "destructive" },
};

export function AdminAlumniClient({
  initialApplications,
  initialAppsTotal,
  initialProfiles,
  initialProfilesTotal,
  loadError,
}: AdminAlumniClientProps) {
  const [activeTab, setActiveTab] = useState<"applications" | "profiles">("applications");

  // Applications state
  const [applications, setApplications] = useState<AlumniApplicationRow[]>(initialApplications);
  const [appsTotal, setAppsTotal] = useState(initialAppsTotal);
  const [appsPage, setAppsPage] = useState(1);
  const [appsSearch, setAppsSearch] = useState("");
  const [appsFilter, setAppsFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<AlumniApplicationRow | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");

  // Profiles state
  const [profiles, setProfiles] = useState<AlumniProfileRow[]>(initialProfiles);
  const [profilesTotal, setProfilesTotal] = useState(initialProfilesTotal);
  const [profilesPage, setProfilesPage] = useState(1);
  const [profilesSearch, setProfilesSearch] = useState("");
  const [profilesFilter, setProfilesFilter] = useState("all");

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

  const pageSize = 20;
  const appsTotalPages = Math.max(1, Math.ceil(appsTotal / pageSize));
  const profilesTotalPages = Math.max(1, Math.ceil(profilesTotal / pageSize));

  // Refresh applications query
  const refreshApplications = (
    page: number = appsPage,
    status: string = appsFilter,
    search: string = appsSearch
  ) => {
    startTransition(async () => {
      const res = await adminGetAlumniApplications({
        page,
        pageSize,
        status,
        search,
      });
      if (res.ok && res.data) {
        setApplications(res.data);
        setAppsTotal(res.total ?? 0);
        setAppsPage(res.page ?? 1);
      } else {
        toast.error(res.error || "Failed to reload applications");
      }
    });
  };

  // Refresh profiles query
  const refreshProfiles = (
    page: number = profilesPage,
    status: string = profilesFilter,
    search: string = profilesSearch
  ) => {
    startTransition(async () => {
      const res = await adminGetAlumniProfiles({
        page,
        pageSize,
        status,
        search,
      });
      if (res.ok && res.data) {
        setProfiles(res.data);
        setProfilesTotal(res.total ?? 0);
        setProfilesPage(res.page ?? 1);
      } else {
        toast.error(res.error || "Failed to reload profiles");
      }
    });
  };

  // Handle application status update
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
        setSelectedApp((prev) => (prev ? { ...prev, status, admin_notes: adminNotesInput } : null));
        refreshApplications();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  // Save notes only
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
        refreshApplications();
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
          setSelectedApp((prev) => (prev ? { ...prev, status: "approved" } : null));
        }
        refreshApplications();
        refreshProfiles();
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
        refreshProfiles();
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
        setDeleteConfirmAppId(null);
        if (selectedApp?.id === deleteConfirmAppId) {
          setSelectedApp(null);
        }
        refreshApplications();
        refreshProfiles();
      } else {
        toast.error(res.error || "Failed to delete application");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Alumni Office Hours
          </h1>
          <p className="text-sm text-muted-foreground">
            Review alumni volunteer applications and manage published directory profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/alumni-office-hours" target="_blank">
              <Globe className="w-3.5 h-3.5" />
              <span>Public Directory</span>
            </Link>
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "applications" | "profiles")}
        className="space-y-6"
      >
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="applications" className="gap-2">
            <Users className="w-4 h-4" />
            <span>Applications</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {appsTotal}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Published Profiles</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {profilesTotal}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Applications Tab ── */}
        <TabsContent value="applications" className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...ALUMNI_APPLICATION_STATUSES].map((st) => (
                <Button
                  key={st}
                  variant={appsFilter === st ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => {
                    setAppsFilter(st);
                    refreshApplications(1, st, appsSearch);
                  }}
                >
                  {st}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search applicant name, email, university..."
                value={appsSearch}
                onChange={(e) => {
                  setAppsSearch(e.target.value);
                  refreshApplications(1, appsFilter, e.target.value);
                }}
                className="pl-9 h-8 text-xs bg-card"
              />
            </div>
          </div>

          {/* Table / List */}
          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No alumni applications found matching the selected criteria.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Applicant</th>
                      <th className="p-3">Academic</th>
                      <th className="p-3">Current Role &amp; Field</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotesInput(app.admin_notes || "");
                        }}
                      >
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{app.full_name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{app.email}</div>
                        </td>
                        <td className="p-3">
                          <div>{app.institution}</div>
                          <div className="text-muted-foreground">Class of {app.graduation_year}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">{app.occupation}</div>
                          <div className="text-muted-foreground">{app.field}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant={APP_STATUS_CONFIG[app.status]?.variant || "outline"}>
                            {APP_STATUS_CONFIG[app.status]?.label || app.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedApp(app);
                                setAdminNotesInput(app.admin_notes || "");
                              }}
                            >
                              Review
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleOpenPublishDialog(app)}
                            >
                              Publish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing page {appsPage} of {appsTotalPages} ({appsTotal} total applications)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={appsPage <= 1 || isPending}
                    onClick={() => refreshApplications(appsPage - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={appsPage >= appsTotalPages || isPending}
                    onClick={() => refreshApplications(appsPage + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Profiles Tab ── */}
        <TabsContent value="profiles" className="space-y-4">
          {/* Profiles Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...ALUMNI_PROFILE_STATUSES].map((st) => (
                <Button
                  key={st}
                  variant={profilesFilter === st ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => {
                    setProfilesFilter(st);
                    refreshProfiles(1, st, profilesSearch);
                  }}
                >
                  {st}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search published alumni profiles..."
                value={profilesSearch}
                onChange={(e) => {
                  setProfilesSearch(e.target.value);
                  refreshProfiles(1, profilesFilter, e.target.value);
                }}
                className="pl-9 h-8 text-xs bg-card"
              />
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No alumni directory profiles found matching the selected criteria.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Display Name</th>
                      <th className="p-3">Institution &amp; Class</th>
                      <th className="p-3">Role &amp; Domain</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Published At</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{profile.display_name}</div>
                          <a
                            href={profile.contact_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>Profile Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-3">
                          <div>{profile.institution}</div>
                          <div className="text-muted-foreground">Class of {profile.graduation_year}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">{profile.occupation}</div>
                          <div className="text-muted-foreground">{profile.field}</div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={profile.status === "published" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {profile.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(profile.published_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {profile.status === "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-amber-600 dark:text-amber-400 gap-1"
                                onClick={() => handleToggleProfileStatus(profile)}
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>Unpublish</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 gap-1"
                                onClick={() => handleToggleProfileStatus(profile)}
                              >
                                <Eye className="w-3 h-3" />
                                <span>Republish</span>
                              </Button>
                            )}

                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                              <Link href={`/alumni-office-hours/${profile.id}`} target="_blank">
                                View
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing page {profilesPage} of {profilesTotalPages} ({profilesTotal} total profiles)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={profilesPage <= 1 || isPending}
                    onClick={() => refreshProfiles(profilesPage - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={profilesPage >= profilesTotalPages || isPending}
                    onClick={() => refreshProfiles(profilesPage + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Application Detail Sheet ── */}
      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto space-y-6">
          {selectedApp && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant={APP_STATUS_CONFIG[selectedApp.status]?.variant || "outline"}>
                    {APP_STATUS_CONFIG[selectedApp.status]?.label || selectedApp.status}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ID: {selectedApp.id.slice(0, 8)}...
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold font-display">
                  {selectedApp.full_name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Submitted {new Date(selectedApp.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              {/* Mandatory Identity Verification Notice */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  Verify identity (for example on LinkedIn) before approving. Confirm current role and graduation history.
                </p>
              </div>

              {/* Private Submitter Details */}
              <div className="space-y-3 border-y border-border py-4 text-xs">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Private Submitter Fields (Admin Only)
                </p>
                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Email Address</span>
                    <a
                      href={`mailto:${selectedApp.email}`}
                      className="text-primary hover:underline font-medium break-all"
                    >
                      {selectedApp.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">IP Hash (Salted)</span>
                    <span className="font-mono text-[10px] break-all">{selectedApp.ip_hash.slice(0, 16)}...</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Consent Publicly Given</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yes (Confirmed)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Reviewed By</span>
                    <span>{selectedApp.reviewed_by ? selectedApp.reviewed_by.slice(0, 8) : "Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Public Application Fields */}
              <div className="space-y-4 text-xs">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Application Information
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">University / Institution</span>
                    <span className="font-medium text-foreground">{selectedApp.institution}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Graduation Year</span>
                    <span className="font-medium text-foreground">Class of {selectedApp.graduation_year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Current Occupation</span>
                    <span className="font-medium text-foreground">{selectedApp.occupation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Field / Expertise</span>
                    <span className="font-medium text-foreground">{selectedApp.field}</span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] mb-1">Public Contact Link</span>
                  <a
                    href={selectedApp.contact_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-xs break-all inline-flex items-center gap-1.5"
                  >
                    <span>{selectedApp.contact_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] mb-1">Bio</span>
                  <div className="p-3 rounded-lg bg-muted/40 text-foreground leading-relaxed whitespace-pre-line">
                    {selectedApp.bio}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] mb-1">Advising Topics</span>
                  <div className="p-3 rounded-lg bg-muted/40 text-foreground leading-relaxed whitespace-pre-line">
                    {selectedApp.topics}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] mb-1">Availability</span>
                  <div className="p-3 rounded-lg bg-muted/40 text-foreground leading-relaxed whitespace-pre-line">
                    {selectedApp.availability}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Admin Internal Notes</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1"
                    onClick={handleSaveNotes}
                    disabled={isPending}
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Notes</span>
                  </Button>
                </label>
                <Textarea
                  rows={2}
                  placeholder="Record identity verification results, LinkedIn verification link, notes..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setDeleteConfirmAppId(selectedApp.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.status !== "reviewing" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSetAppStatus("reviewing")}
                      disabled={isPending}
                    >
                      Mark Reviewing
                    </Button>
                  )}
                  {selectedApp.status !== "declined" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleSetAppStatus("declined")}
                      disabled={isPending}
                    >
                      Decline
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => handleOpenPublishDialog(selectedApp)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Publish</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Publish & Review Dialog ── */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-display">
                Approve &amp; Publish Alumni Profile
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review and finalize the public fields before publishing to the directory. You can edit any field to ensure accuracy and professionalism.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Display Name</label>
                  <Input
                    required
                    value={publishForm.displayName}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, displayName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Graduation Year</label>
                  <Input
                    type="number"
                    required
                    min={1970}
                    max={2100}
                    value={publishForm.graduationYear}
                    onChange={(e) =>
                      setPublishForm((p) => ({
                        ...p,
                        graduationYear: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">University / Institution</label>
                  <Input
                    required
                    value={publishForm.institution}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, institution: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Field / Domain</label>
                  <Input
                    required
                    value={publishForm.field}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, field: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Current Occupation / Role</label>
                <Input
                  required
                  value={publishForm.occupation}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, occupation: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Public Contact Link</label>
                <Input
                  type="url"
                  required
                  value={publishForm.contactUrl}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, contactUrl: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Short Bio (20-600 characters)</label>
                <Textarea
                  required
                  rows={3}
                  value={publishForm.bio}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, bio: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Advising Topics</label>
                <Textarea
                  required
                  rows={2}
                  value={publishForm.topics}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, topics: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Availability</label>
                <Input
                  required
                  value={publishForm.availability}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, availability: e.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPublishDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm &amp; Publish</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteConfirmAppId}
        onOpenChange={(open) => !open && setDeleteConfirmAppId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display">
              Delete Alumni Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete this application? If this application has a published profile in the directory, it will also be deleted immediately. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmAppId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeleteApplication}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Yes, Delete Record</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

