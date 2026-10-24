"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminTrackDetail,
  AdminLessonItem,
  adminUpdateTrackAction,
  adminSetTrackPublishedAction,
  adminSaveLessonAction,
  adminReorderLessonsAction,
  adminDeleteLessonAction,
} from "@/lib/skill/admin-actions";
import {
  canPublishTrack,
  reorderLessonList,
  lessonSchema,
  trackSchema,
} from "@/lib/skill/validation";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialTrack: AdminTrackDetail;
}

export function AdminTrackDetailClient({ initialTrack }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Track edit modal
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState(initialTrack.title);
  const [trackSlug, setTrackSlug] = useState(initialTrack.slug);
  const [trackDesc, setTrackDesc] = useState(initialTrack.description);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Lesson editor modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonItem | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonPoints, setLessonPoints] = useState(15);
  const [lessonPos, setLessonPos] = useState(1);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");

  // Delete lesson modal
  const [deletingLesson, setDeletingLesson] = useState<AdminLessonItem | null>(null);

  // Track Edit Handlers
  const handleOpenTrackEdit = () => {
    setTrackTitle(initialTrack.title);
    setTrackSlug(initialTrack.slug);
    setTrackDesc(initialTrack.description);
    setTrackError(null);
    setTrackModalOpen(true);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);

    const validation = trackSchema.safeParse({
      title: trackTitle,
      slug: trackSlug,
      description: trackDesc,
    });

    if (!validation.success) {
      const msg = validation.error.issues[0]?.message ?? "Validation failed";
      setTrackError(msg);
      return;
    }

    startTransition(async () => {
      const res = await adminUpdateTrackAction(initialTrack.id, validation.data);
      if (!res.ok) {
        setTrackError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Track updated");
      setTrackModalOpen(false);
      router.refresh();
    });
  };

  const handleTogglePublish = () => {
    const nextState = !initialTrack.is_published;
    if (nextState) {
      const check = canPublishTrack(initialTrack.lessons);
      if (!check.allowed) {
        toast.error(check.reason || "Track cannot be published");
        return;
      }
    }

    startTransition(async () => {
      const res = await adminSetTrackPublishedAction(initialTrack.id, nextState);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        nextState
          ? `Published "${initialTrack.title}"`
          : `Unpublished "${initialTrack.title}"`
      );
      router.refresh();
    });
  };

  // Lesson Edit Handlers
  const handleOpenNewLesson = () => {
    const nextPos =
      initialTrack.lessons.length > 0
        ? Math.max(...initialTrack.lessons.map((l) => l.position)) + 1
        : 1;

    setEditingLesson(null);
    setLessonTitle("");
    setLessonSummary("");
    setLessonContent("");
    setLessonPoints(15);
    setLessonPos(nextPos);
    setLessonError(null);
    setEditorTab("edit");
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: AdminLessonItem) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonSummary(lesson.summary);
    setLessonContent(lesson.content_md);
    setLessonPoints(lesson.skill_points);
    setLessonPos(lesson.position);
    setLessonError(null);
    setEditorTab("edit");
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonError(null);

    const validation = lessonSchema.safeParse({
      title: lessonTitle,
      summary: lessonSummary,
      content_md: lessonContent,
      skill_points: Number(lessonPoints),
      position: Number(lessonPos),
    });

    if (!validation.success) {
      const msg = validation.error.issues[0]?.message ?? "Validation failed";
      setLessonError(msg);
      return;
    }

    startTransition(async () => {
      const res = await adminSaveLessonAction({
        lessonId: editingLesson ? editingLesson.id : null,
        trackId: initialTrack.id,
        input: validation.data,
      });

      if (!res.ok) {
        setLessonError(res.error);
        toast.error(res.error);
        return;
      }

      toast.success(
        editingLesson ? "Lesson updated successfully" : "Lesson created successfully"
      );
      setLessonModalOpen(false);
      router.refresh();
    });
  };

  // Reorder Lessons
  const handleMoveLesson = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= initialTrack.lessons.length) return;

    const reordered = reorderLessonList(initialTrack.lessons, index, targetIndex);
    const orderedIds = reordered.map((l) => l.id);

    startTransition(async () => {
      const res = await adminReorderLessonsAction(initialTrack.id, orderedIds);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Lessons reordered");
      router.refresh();
    });
  };

  // Delete Lesson
  const handleDeleteLesson = () => {
    if (!deletingLesson) return;

    if (deletingLesson.completion_count > 0) {
      toast.error(
        `Cannot delete a lesson that users have already completed (${deletingLesson.completion_count} completions). Please unpublish the track instead.`
      );
      setDeletingLesson(null);
      return;
    }

    startTransition(async () => {
      const res = await adminDeleteLessonAction(deletingLesson.id, initialTrack.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Lesson deleted");
      setDeletingLesson(null);
      router.refresh();
    });
  };

  const totalPoints = initialTrack.lessons.reduce((acc, l) => acc + l.skill_points, 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/skill"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Tracks</span>
        </Link>
      </div>

      {/* Track Header Card */}
      <Card className="p-6 border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  initialTrack.is_published
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[10px]"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px]"
                }
              >
                {initialTrack.is_published ? "Published" : "Draft"}
              </Badge>

              <span className="font-mono text-xs text-muted-foreground">
                Slug: /{initialTrack.slug}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              {initialTrack.title}
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {initialTrack.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenTrackEdit}
              className="gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </Button>

            <Button
              size="sm"
              variant={initialTrack.is_published ? "outline" : "default"}
              disabled={isPending}
              onClick={handleTogglePublish}
              className="gap-1.5"
            >
              {initialTrack.is_published ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                  <span>Unpublish</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Publish</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Track quick metrics bar */}
        <div className="flex items-center gap-6 pt-3 border-t border-border text-xs font-mono text-muted-foreground flex-wrap">
          <span>
            Lessons:{" "}
            <strong className="text-foreground">{initialTrack.lessons.length}</strong>
          </span>
          <span>
            Track Points:{" "}
            <strong className="text-primary font-bold">+{totalPoints} pts</strong>
          </span>
          <span>
            Created:{" "}
            <span className="text-foreground">
              {new Date(initialTrack.created_at).toLocaleDateString()}
            </span>
          </span>
        </div>
      </Card>

      {/* Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Track Lessons ({initialTrack.lessons.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Lessons are presented in ascending numerical position order.
            </p>
          </div>

          <Button onClick={handleOpenNewLesson} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Lesson</span>
          </Button>
        </div>

        {initialTrack.lessons.length === 0 ? (
          <Card className="p-8 border-border bg-card text-center space-y-3">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No lessons yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your first lesson to this track. You need at least 1 lesson before publishing.
            </p>
            <Button onClick={handleOpenNewLesson} size="sm" className="gap-1.5 mt-2">
              <Plus className="h-4 w-4" />
              <span>Add First Lesson</span>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {initialTrack.lessons.map((lesson, index) => (
              <Card
                key={lesson.id}
                className="p-4 border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary font-mono text-xs font-bold text-foreground shrink-0 mt-0.5">
                    {lesson.position}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {lesson.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-primary/20 bg-primary/10 text-primary py-0 px-1.5"
                      >
                        +{lesson.skill_points} pts
                      </Badge>
                      {lesson.completion_count > 0 ? (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-500 py-0 px-1.5 flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          <span>{lesson.completion_count} completed</span>
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          0 completions
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {lesson.summary}
                    </p>
                  </div>
                </div>

                {/* Actions & Ordering */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Reorder Buttons */}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={isPending || index === 0}
                    onClick={() => handleMoveLesson(index, "up")}
                    aria-label="Move lesson up"
                    title="Move up"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={isPending || index === initialTrack.lessons.length - 1}
                    onClick={() => handleMoveLesson(index, "down")}
                    aria-label="Move lesson down"
                    title="Move down"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  {/* Edit */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditLesson(lesson)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingLesson(lesson)}
                    className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                    title={
                      lesson.completion_count > 0
                        ? "Completed by users (cannot delete)"
                        : "Delete lesson"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Editor Dialog */}
      <Dialog
        open={lessonModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setLessonModalOpen(false);
            setEditingLesson(null);
            setLessonError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
            <DialogDescription>
              Draft or update structured Markdown content and lesson details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLesson} className="space-y-4 py-1">
            {lessonError && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{lessonError}</span>
              </div>
            )}

            {/* Safety Warning for Existing Completions */}
            {editingLesson && editingLesson.completion_count > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Safety Rule Notice: Existing User Completions
                  </p>
                  <p className="leading-relaxed">
                    <strong>{editingLesson.completion_count} user(s)</strong> have already
                    completed this lesson. Modifying the skill points value will only apply
                    to future completions and will <strong>not</strong> alter points already
                    earned by existing users.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="lesson-title" className="text-xs">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lesson-title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Structuring a Modern Professional CV"
                  maxLength={120}
                  required
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lessonTitle.length}/120 characters
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lesson-points" className="text-xs">
                  Skill Points (0–100) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lesson-points"
                  type="number"
                  min={0}
                  max={100}
                  value={lessonPoints}
                  onChange={(e) => setLessonPoints(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="lesson-summary" className="text-xs">
                  Summary <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lesson-summary"
                  value={lessonSummary}
                  onChange={(e) => setLessonSummary(e.target.value)}
                  placeholder="A concise 1-sentence overview of what this lesson covers..."
                  maxLength={300}
                  required
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lessonSummary.length}/300 characters
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lesson-pos" className="text-xs">
                  Position
                </Label>
                <Input
                  id="lesson-pos"
                  type="number"
                  min={1}
                  value={lessonPos}
                  onChange={(e) => setLessonPos(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Markdown Content with Live Preview Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Lesson Content (Markdown) <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {lessonContent.length}/20,000 characters
                </span>
              </div>

              <Tabs
                value={editorTab}
                onValueChange={(v) => setEditorTab(v as "edit" | "preview")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-9 bg-secondary">
                  <TabsTrigger value="edit" className="text-xs font-mono">
                    Edit Markdown
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs font-mono">
                    Live Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-2">
                  <Textarea
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="Write structured lesson content in Markdown: ### Headings, bullet points, and a 'Try this' section..."
                    rows={12}
                    maxLength={20000}
                    className="font-mono text-xs leading-relaxed resize-y"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Tip: Use headings (`###`), bullet lists (`-`), bold labels (`**bold**`), and a closing `Try this:` action.
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                  <div className="rounded-lg border border-border bg-card p-4 min-h-[250px] max-h-[400px] overflow-y-auto">
                    {lessonContent.trim().length > 0 ? (
                      <LessonMarkdown content={lessonContent} />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Type content in the editor to see the live preview.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setLessonModalOpen(false);
                  setEditingLesson(null);
                  setLessonError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{editingLesson ? "Save Lesson" : "Create Lesson"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation / Block Alert */}
      <Dialog
        open={deletingLesson !== null}
        onOpenChange={(open: boolean) => !open && setDeletingLesson(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Lesson</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {deletingLesson && deletingLesson.completion_count > 0 ? (
                <span className="text-destructive font-semibold">
                  Cannot delete this lesson: {deletingLesson.completion_count} user(s) have
                  already completed it and earned skill points. To hide this lesson, unpublish
                  the track instead.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete &quot;{deletingLesson?.title}&quot;? This action
                  cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setDeletingLesson(null)}
            >
              Cancel
            </Button>
            {deletingLesson && deletingLesson.completion_count === 0 && (
              <Button
                type="button"
                onClick={handleDeleteLesson}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Delete</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Track Edit Metadata Dialog */}
      <Dialog open={trackModalOpen} onOpenChange={(open: boolean) => setTrackModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Track Metadata</DialogTitle>
            <DialogDescription>
              Update the track title, slug, and summary description.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTrack} className="space-y-4 py-2">
            {trackError && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{trackError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="meta-title" className="text-xs">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meta-title"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta-slug" className="text-xs">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meta-slug"
                value={trackSlug}
                onChange={(e) => setTrackSlug(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta-desc" className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="meta-desc"
                value={trackDesc}
                onChange={(e) => setTrackDesc(e.target.value)}
                rows={4}
                maxLength={500}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setTrackModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Track</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}