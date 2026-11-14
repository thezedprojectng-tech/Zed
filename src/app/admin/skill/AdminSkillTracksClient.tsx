"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  BookOpen,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminTrackListItem } from "@/lib/skill/admin-actions";
import {
  adminCreateTrackAction,
  adminSetTrackPublishedAction,
} from "@/lib/skill/admin-actions";
import { trackSchema } from "@/lib/skill/validation";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminSkillTracksClientProps {
  initialTracks: AdminTrackListItem[];
}

export function AdminSkillTracksClient({
  initialTracks,
}: AdminSkillTracksClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<AdminTrackListItem[]>(initialTracks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title_asc" | "lessons_desc" | "points_desc" | "created_desc">("title_asc");
  const [isPending, startTransition] = useTransition();

  // Create track dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Counts
  const totalCount = tracks.length;
  const publishedCount = tracks.filter((t) => t.is_published).length;
  const draftCount = tracks.filter((t) => !t.is_published).length;
  const totalLessons = tracks.reduce((acc, t) => acc + (t.lesson_count || 0), 0);

  const tabOptions = useMemo(
    () => [
      { id: "all", label: `All (${totalCount})` },
      { id: "published", label: `Published (${publishedCount})` },
      { id: "draft", label: `Draft (${draftCount})` },
    ],
    [totalCount, publishedCount, draftCount]
  );

  const filteredTracks = useMemo(() => {
    let list = tracks.filter((track) => {
      if (statusFilter === "published" && !track.is_published) return false;
      if (statusFilter === "draft" && track.is_published) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const matchTitle = track.title.toLowerCase().includes(q);
        const matchSlug = track.slug.toLowerCase().includes(q);
        const matchDesc = track.description.toLowerCase().includes(q);
        return matchTitle || matchSlug || matchDesc;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "lessons_desc") return b.lesson_count - a.lesson_count;
      if (sortBy === "points_desc") return b.total_points - a.total_points;
      if (sortBy === "created_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [tracks, statusFilter, search, sortBy]);

  const handleTogglePublished = (track: AdminTrackListItem) => {
    startTransition(async () => {
      const newStatus = !track.is_published;
      const res = await adminSetTrackPublishedAction(track.id, newStatus);
      if (!res.ok) {
        toast.error(res.error || "Failed to update track status");
        return;
      }

      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, is_published: newStatus } : t))
      );
      toast.success(
        newStatus
          ? `Track "${track.title}" published`
          : `Track "${track.title}" unpublished to draft`
      );
      router.refresh();
    });
  };

  const handleTitleChange = (val: string) => {
    setCreateTitle(val);
    if (!hasManuallyEditedSlug) {
      setCreateSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
    if (createErrors.title) {
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const handleCreateTrack = () => {
    setCreateErrors({});
    const parsed = trackSchema.safeParse({
      title: createTitle,
      slug: createSlug,
      description: createDesc,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString() || "form";
        if (!errs[path]) errs[path] = issue.message;
      });
      setCreateErrors(errs);
      return;
    }

    startTransition(async () => {
      const res = await adminCreateTrackAction({
        title: createTitle,
        slug: createSlug,
        description: createDesc,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to create track");
        return;
      }

      toast.success("Learning track created");
      setCreateDialogOpen(false);
      setCreateTitle("");
      setCreateSlug("");
      setCreateDesc("");
      setHasManuallyEditedSlug(false);

      if (res.data?.track_id) {
        router.push(`/admin/skill/${res.data.track_id}`);
      } else {
        router.refresh();
      }
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("title_asc");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Skill content"
        description={`${totalCount} ${totalCount === 1 ? "track" : "tracks"} · ${totalLessons} ${totalLessons === 1 ? "lesson" : "lessons"}`}
        icon={GraduationCap}
        section="programs"
        actions={
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setCreateTitle("");
              setCreateSlug("");
              setCreateDesc("");
              setHasManuallyEditedSlug(false);
              setCreateErrors({});
              setCreateDialogOpen(true);
            }}
            className="gap-1.5 rounded-lg h-9 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New track</span>
          </Button>
        }
      />

      {/* Toolbar: Status Tabs + Sort + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={tabOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Skill tracks status filter"
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sort selector */}
          <div className="w-36 shrink-0">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 text-xs rounded-lg bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="lessons_desc">Most lessons</SelectItem>
                <SelectItem value="points_desc">Most points</SelectItem>
                <SelectItem value="created_desc">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search with '/' shortcut hint */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search tracks, slugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-lg bg-card border-border"
            />
            <kbd className="absolute right-2.5 top-2.5 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/80 rounded">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {tracks.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No skill tracks yet"
            description="Create your first structured learning track to host courses and lessons."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5 rounded-lg border-border h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create first track</span>
              </Button>
            }
          />
        ) : filteredTracks.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching tracks"
            description="No skill tracks match your active search and filter criteria."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="rounded-lg border-border h-8 text-xs"
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-sans text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Track & Slug</th>
                  <th className="py-3 px-4 font-semibold">Lessons</th>
                  <th className="py-3 px-4 font-semibold">Skill Points</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTracks.map((track) => (
                  <tr
                    key={track.id}
                    onClick={() => router.push(`/admin/skill/${track.id}`)}
                    className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    {/* Track Title & Slug */}
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground truncate max-w-[240px] sm:max-w-none block font-sans">
                          {track.title}
                        </span>
                        <span className="font-mono text-muted-foreground text-[11px] truncate block">
                          /{track.slug}
                        </span>
                      </div>
                    </td>

                    {/* Lesson Count */}
                    <td className="py-3 px-4 font-sans tabular-nums text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{track.lesson_count} {track.lesson_count === 1 ? "lesson" : "lessons"}</span>
                      </span>
                    </td>

                    {/* Skill Points */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-sans tabular-nums font-semibold px-2 py-0.5 rounded-full text-[11px] bg-[color:var(--data-signups-subtle)] text-[color:var(--data-signups-ink)] border border-[color:var(--data-signups-border)]">
                        <Award className="h-3 w-3" />
                        <span>{track.total_points} pts</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusPill variant={track.is_published ? "verified" : "pending"} />
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 font-sans tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(track.created_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs rounded-md border-border"
                        >
                          <Link href={`/admin/skill/${track.id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Manage
                          </Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
                              aria-label="Track actions"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-md">
                            <DropdownMenuItem asChild className="text-xs gap-2">
                              <Link href={`/skill/${track.slug}`} target="_blank">
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>View student view</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePublished(track)}
                              className="text-xs gap-2"
                            >
                              {track.is_published ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Unpublish to draft</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Publish track</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Track Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground font-sans">
              Create learning track
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Add a new structured curriculum track to host modules and lessons.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                Track title *
              </label>
              <Input
                value={createTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Modern Frontend Engineering"
                className="h-9 text-xs rounded-md bg-background border-border"
              />
              {createErrors.title && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {createErrors.title}
                </p>
              )}
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                URL slug *
              </label>
              <div className="flex items-center rounded-md border border-border bg-background h-9 px-2.5 focus-within:ring-2 focus-within:ring-ring">
                <span className="font-sans text-muted-foreground text-xs select-none pr-1">
                  /skill/
                </span>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => {
                    setHasManuallyEditedSlug(true);
                    setCreateSlug(e.target.value);
                  }}
                  placeholder="frontend-engineering"
                  className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-hidden"
                />
              </div>
              {createErrors.slug && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {createErrors.slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                Description *
              </label>
              <Textarea
                rows={3}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Overview of curriculum objectives and learner outcomes..."
                className="text-xs rounded-md bg-background border-border leading-relaxed font-sans"
              />
              {createErrors.description && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {createErrors.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isPending}
              className="text-xs h-8 rounded-md border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={handleCreateTrack}
              className="text-xs h-8 rounded-md gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create track</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
