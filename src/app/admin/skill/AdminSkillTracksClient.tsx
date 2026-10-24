"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminTrackListItem,
  adminCreateTrackAction,
  adminUpdateTrackAction,
  adminSetTrackPublishedAction,
} from "@/lib/skill/admin-actions";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  Plus,
  BookOpen,
  ArrowRight,
  Edit,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialTracks: AdminTrackListItem[];
}

export function AdminSkillTracksClient({ initialTracks }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTrack, setEditTrack] = useState<AdminTrackListItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setFormError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (track: AdminTrackListItem) => {
    setTitle(track.title);
    setSlug(track.slug);
    setDescription(track.description);
    setFormError(null);
    setEditTrack(track);
  };

  // Auto-generate slug from title if creating
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (createDialogOpen && !editTrack) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      if (editTrack) {
        const res = await adminUpdateTrackAction(editTrack.id, {
          title,
          slug,
          description,
        });
        if (!res.ok) {
          setFormError(res.error);
          toast.error(res.error);
          return;
        }
        toast.success("Track updated successfully");
        setEditTrack(null);
        resetForm();
        router.refresh();
      } else {
        const res = await adminCreateTrackAction({
          title,
          slug,
          description,
        });
        if (!res.ok) {
          setFormError(res.error);
          toast.error(res.error);
          return;
        }
        toast.success("Track created successfully");
        setCreateDialogOpen(false);
        resetForm();
        router.refresh();
      }
    });
  };

  const handleTogglePublish = (track: AdminTrackListItem) => {
    const nextState = !track.is_published;
    if (nextState && track.lesson_count === 0) {
      toast.error("Cannot publish a track with no lessons. Please add at least 1 lesson first.");
      return;
    }

    startTransition(async () => {
      const res = await adminSetTrackPublishedAction(track.id, nextState);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        nextState ? `Published "${track.title}"` : `Unpublished "${track.title}"`
      );
      router.refresh();
    });
  };

  const publishedCount = initialTracks.filter((t) => t.is_published).length;
  const draftCount = initialTracks.length - publishedCount;
  const totalLessons = initialTracks.reduce((sum, t) => sum + t.lesson_count, 0);
  const totalPoints = initialTracks.reduce((sum, t) => sum + t.total_points, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Skill Content Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage practical learning tracks, lessons, publishing status, and point allocations.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Track</span>
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 border-border bg-card">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Total Tracks</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">
            {initialTracks.length}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-emerald-500 font-semibold">{publishedCount} published</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-amber-500 font-semibold">{draftCount} draft</span>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Total Lessons</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">
            {totalLessons}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Across all tracks</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Skill Points</p>
          <p className="text-2xl font-bold font-mono text-primary mt-1">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available to earn</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Target Level</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">
            Level {totalPoints >= 250 ? (totalPoints >= 500 ? (totalPoints >= 1000 ? 5 : 4) : 3) : 2}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPoints >= 250 ? "Clears Level 3 (250 pts)" : "Under Level 3"}
          </p>
        </Card>
      </div>

      {/* Tracks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">All Learning Tracks</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {initialTracks.length} tracks configured
          </span>
        </div>

        {initialTracks.length === 0 ? (
          <Card className="p-10 border-border bg-card text-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No tracks yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first practical learning track to start adding lessons and skill points.
            </p>
            <Button onClick={openCreateDialog} className="gap-2 mt-2">
              <Plus className="h-4 w-4" />
              <span>Create Track</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialTracks.map((track) => (
              <Card
                key={track.id}
                className="p-5 border-border bg-card shadow-xs flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          track.is_published
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[10px]"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px]"
                        }
                      >
                        {track.is_published ? "Published" : "Draft"}
                      </Badge>

                      <span className="font-mono text-xs text-muted-foreground">
                        /{track.slug}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-semibold text-primary shrink-0">
                      +{track.total_points} pts
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-foreground leading-snug">
                    {track.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{track.lesson_count} lessons</span>
                    </span>
                    <span>Created {new Date(track.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(track)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleTogglePublish(track)}
                        className={`h-8 px-2 text-xs ${
                          track.is_published
                            ? "text-amber-500 hover:text-amber-400"
                            : "text-emerald-500 hover:text-emerald-400"
                        }`}
                      >
                        {track.is_published ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>

                    <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                      <Link href={`/admin/skill/${track.id}`}>
                        <span>Manage Lessons</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Track Dialog */}
      <Dialog
        open={createDialogOpen || editTrack !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditTrack(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editTrack ? "Edit Track Details" : "Create New Track"}
            </DialogTitle>
            <DialogDescription>
              {editTrack
                ? "Update the track title, URL slug, and description."
                : "Create a learning track. You can add lessons and publish it once ready."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTrack} className="space-y-4 py-2">
            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="track-title" className="text-xs">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="track-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Freelancing & Getting Paid Online"
                maxLength={120}
                required
              />
              <span className="text-[10px] text-muted-foreground font-mono">
                {title.length}/120 characters
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="track-slug" className="text-xs">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="track-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. freelancing-and-getting-paid-online"
                maxLength={120}
                required
              />
              <span className="text-[10px] text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="track-description" className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="track-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what practical skills users will learn in this track..."
                rows={4}
                maxLength={500}
                required
              />
              <span className="text-[10px] text-muted-foreground font-mono">
                {description.length}/500 characters
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditTrack(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{editTrack ? "Save Changes" : "Create Track"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
