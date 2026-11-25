"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  ExternalLink,
  Award,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AdminTrackDetail,
  AdminLessonItem,
  AdminQuizItem,
} from "@/lib/skill/admin-actions";
import {
  adminUpdateTrackAction,
  adminSetTrackPublishedAction,
  adminSaveLessonAction,
  adminReorderLessonsAction,
  adminDeleteLessonAction,
  adminUpdateTrackSettingsAction,
  adminUpdateLessonContentUrlAction,
  adminUpdateLessonTimingAction,
} from "@/lib/skill/admin-actions";
import {
  lessonSchema,
  trackSchema,
  trackSettingsSchema,
  minutesToSeconds,
  secondsToMinutes,
  computeAutoMinSeconds,
  formatSecondsAsMinutesLabel,
} from "@/lib/skill/validation";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";
import { QuizBuilderDialog } from "@/components/admin/skill/QuizBuilderDialog";
import { PanelSection } from "@/components/admin/primitives/PanelSection";
import { AdminCard } from "@/components/admin/primitives/AdminCard";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AdminTrackDetailClientProps {
  initialTrack: AdminTrackDetail;
}

export function AdminTrackDetailClient({
  initialTrack,
}: AdminTrackDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Track editable states
  const [trackTitle, setTrackTitle] = useState(initialTrack.title);
  const [trackSlug, setTrackSlug] = useState(initialTrack.slug);
  const [trackDesc, setTrackDesc] = useState(initialTrack.description);
  const [isPublished, setIsPublished] = useState(initialTrack.is_published);
  const [trackErrors, setTrackErrors] = useState<Record<string, string>>({});

  // Lessons list state (ordered)
  const [lessons, setLessons] = useState<AdminLessonItem[]>(initialTrack.lessons || []);

  // Pricing & rules state
  const [priceNgn, setPriceNgn] = useState(String(initialTrack.price_ngn ?? 0));
  const [passMark, setPassMark] = useState(
    initialTrack.pass_mark !== null ? String(initialTrack.pass_mark) : ""
  );
  const [maxAttempts, setMaxAttempts] = useState(
    initialTrack.max_attempts !== null ? String(initialTrack.max_attempts) : ""
  );
  const [minTimePct, setMinTimePct] = useState(
    initialTrack.min_time_pct !== null ? String(initialTrack.min_time_pct) : ""
  );
  const [certificateEnabled, setCertificateEnabled] = useState(
    Boolean(initialTrack.certificate_enabled)
  );
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Quiz builder modal state
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null);
  const [quizLessonTitle, setQuizLessonTitle] = useState<string | undefined>(
    undefined
  );

  // Lesson editor modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonContentUrl, setLessonContentUrl] = useState("");
  const [lessonDurationMin, setLessonDurationMin] = useState("");
  const [lessonMinTimeMin, setLessonMinTimeMin] = useState("");
  const [lessonPoints, setLessonPoints] = useState(15);
  const [lessonPosition, setLessonPosition] = useState(1);
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  const [lessonEditorMode, setLessonEditorMode] = useState<"write" | "preview">("write");

  // Lesson deletion modal state
  const [deletingLesson, setDeletingLesson] = useState<AdminLessonItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute total points from lessons
  const totalPoints = useMemo(
    () => lessons.reduce((acc, l) => acc + (l.skill_points || 0), 0),
    [lessons]
  );

  const isTrackDirty = useMemo(
    () =>
      trackTitle !== initialTrack.title ||
      trackSlug !== initialTrack.slug ||
      trackDesc !== initialTrack.description,
    [trackTitle, trackSlug, trackDesc, initialTrack]
  );

  const quizByLessonId = useMemo(() => {
    const map = new Map<string, AdminQuizItem>();
    for (const q of initialTrack.quizzes ?? []) {
      if (q.lesson_id) map.set(q.lesson_id, q);
    }
    return map;
  }, [initialTrack.quizzes]);

  const finalExamQuiz = useMemo(
    () => (initialTrack.quizzes ?? []).find((q) => q.lesson_id === null) ?? null,
    [initialTrack.quizzes]
  );

  const effectiveMinTimePct = useMemo(() => {
    if (minTimePct.trim() !== "" && !Number.isNaN(Number(minTimePct))) {
      return Number(minTimePct);
    }
    return initialTrack.settingsDefaults.default_min_time_pct;
  }, [minTimePct, initialTrack.settingsDefaults.default_min_time_pct]);

  const parsedPricingInput = useMemo(
    () => ({
      price_ngn: priceNgn.trim() === "" ? 0 : Number(priceNgn),
      pass_mark: passMark.trim() === "" ? null : Number(passMark),
      max_attempts: maxAttempts.trim() === "" ? null : Number(maxAttempts),
      min_time_pct: minTimePct.trim() === "" ? null : Number(minTimePct),
      certificate_enabled: certificateEnabled,
    }),
    [priceNgn, passMark, maxAttempts, minTimePct, certificateEnabled]
  );

  const isPricingDirty = useMemo(
    () =>
      parsedPricingInput.price_ngn !== (initialTrack.price_ngn ?? 0) ||
      parsedPricingInput.pass_mark !== (initialTrack.pass_mark ?? null) ||
      parsedPricingInput.max_attempts !== (initialTrack.max_attempts ?? null) ||
      parsedPricingInput.min_time_pct !== (initialTrack.min_time_pct ?? null) ||
      parsedPricingInput.certificate_enabled !==
        Boolean(initialTrack.certificate_enabled),
    [parsedPricingInput, initialTrack]
  );

  const handleSavePricing = () => {
    setPricingError(null);
    const parsed = trackSettingsSchema.safeParse(parsedPricingInput);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Please fix pricing and rules errors.";
      setPricingError(msg);
      toast.error(msg);
      return;
    }

    const patch: Record<string, number | boolean | null> = {};
    if (parsed.data.price_ngn !== (initialTrack.price_ngn ?? 0)) {
      patch.price_ngn = parsed.data.price_ngn;
    }
    if (parsed.data.pass_mark !== (initialTrack.pass_mark ?? null)) {
      patch.pass_mark = parsed.data.pass_mark;
    }
    if (parsed.data.max_attempts !== (initialTrack.max_attempts ?? null)) {
      patch.max_attempts = parsed.data.max_attempts;
    }
    if (parsed.data.min_time_pct !== (initialTrack.min_time_pct ?? null)) {
      patch.min_time_pct = parsed.data.min_time_pct;
    }
    if (
      parsed.data.certificate_enabled !==
      Boolean(initialTrack.certificate_enabled)
    ) {
      patch.certificate_enabled = parsed.data.certificate_enabled;
    }

    startTransition(async () => {
      const res = await adminUpdateTrackSettingsAction(initialTrack.id, patch);
      if (!res.ok) {
        setPricingError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Pricing and rules updated");
      router.refresh();
    });
  };

  const openQuizModal = (lessonId: string | null, title?: string) => {
    setQuizLessonId(lessonId);
    setQuizLessonTitle(title);
    setQuizModalOpen(true);
  };

  // Track Save handler
  const handleSaveTrack = () => {
    setTrackErrors({});
    const parsed = trackSchema.safeParse({
      title: trackTitle,
      slug: trackSlug,
      description: trackDesc,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString() || "form";
        if (!errs[path]) errs[path] = issue.message;
      });
      setTrackErrors(errs);
      toast.error("Please fix the errors before updating track");
      return;
    }

    startTransition(async () => {
      const res = await adminUpdateTrackAction(initialTrack.id, {
        title: trackTitle,
        slug: trackSlug,
        description: trackDesc,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to update track");
        return;
      }

      toast.success("Track details updated");
      router.refresh();
    });
  };

  // Toggle Track Publishing
  const handleTogglePublish = () => {
    startTransition(async () => {
      const nextPublished = !isPublished;
      const res = await adminSetTrackPublishedAction(initialTrack.id, nextPublished);

      if (!res.ok) {
        toast.error(res.error || "Failed to toggle publishing status");
        return;
      }

      setIsPublished(nextPublished);
      toast.success(
        nextPublished
          ? "Track is now published and visible to learners"
          : "Track reverted to draft"
      );
      router.refresh();
    });
  };

  // Lesson editor handlers
  const openNewLessonModal = () => {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonSummary("");
    setLessonContent("");
    setLessonContentUrl("");
    setLessonDurationMin("");
    setLessonMinTimeMin("");
    setLessonPoints(15);
    setLessonPosition(lessons.length + 1);
    setLessonErrors({});
    setLessonEditorMode("write");
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: AdminLessonItem) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonSummary(lesson.summary);
    setLessonContent(lesson.content_md);
    setLessonContentUrl(lesson.content_url ?? "");
    setLessonDurationMin(secondsToMinutes(lesson.duration_seconds));
    setLessonMinTimeMin(secondsToMinutes(lesson.min_seconds));
    setLessonPoints(lesson.skill_points);
    setLessonPosition(lesson.position);
    setLessonErrors({});
    setLessonEditorMode("write");
    setLessonModalOpen(true);
  };

  const handleSaveLesson = () => {
    setLessonErrors({});
    const inputData = {
      title: lessonTitle,
      summary: lessonSummary,
      content_md: lessonContent,
      skill_points: Number(lessonPoints),
      position: Number(lessonPosition),
    };

    const parsed = lessonSchema.safeParse(inputData);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString() || "form";
        if (!errs[path]) errs[path] = issue.message;
      });
      setLessonErrors(errs);
      toast.error("Please fix the highlighted errors");
      return;
    }

    const durationSeconds = minutesToSeconds(lessonDurationMin);
    const minSeconds = minutesToSeconds(lessonMinTimeMin);

    if (
      durationSeconds !== null &&
      minSeconds !== null &&
      minSeconds > durationSeconds
    ) {
      setLessonErrors({
        min_seconds: "Minimum time cannot exceed lesson duration.",
      });
      toast.error("Minimum time cannot exceed lesson duration.");
      return;
    }

    startTransition(async () => {
      const res = await adminSaveLessonAction({
        lessonId: editingLessonId ?? null,
        trackId: initialTrack.id,
        input: inputData,
      });

      if (!res.ok) {
        setLessonErrors({ form: res.error || "Failed to save lesson" });
        toast.error(res.error || "Failed to save lesson");
        return;
      }

      const savedLessonId = res.data?.lesson_id ?? editingLessonId;
      if (savedLessonId) {
        const existingLesson = editingLessonId
          ? lessons.find((l) => l.id === editingLessonId)
          : null;
        const nextUrl = lessonContentUrl.trim();
        const prevUrl = (existingLesson?.content_url ?? "").trim();

        const timingRes = await adminUpdateLessonTimingAction(
          savedLessonId,
          initialTrack.id,
          durationSeconds,
          minSeconds
        );
        if (!timingRes.ok) {
          setLessonErrors({ min_seconds: timingRes.error });
          toast.error(timingRes.error);
          return;
        }

        if (nextUrl !== prevUrl) {
          const urlRes = await adminUpdateLessonContentUrlAction(
            savedLessonId,
            initialTrack.id,
            lessonContentUrl
          );
          if (!urlRes.ok) {
            setLessonErrors({ content_url: urlRes.error });
            toast.error(urlRes.error);
            return;
          }
        }
      }

      toast.success(editingLessonId ? "Lesson updated" : "Lesson created");
      setLessonModalOpen(false);
      router.refresh();
    });
  };

  // Reorder lessons
  const handleMoveLesson = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const [moved] = newLessons.splice(index, 1);
    newLessons.splice(targetIndex, 0, moved);

    // Reassign position numbers
    const updated = newLessons.map((l, i) => ({ ...l, position: i + 1 }));
    setLessons(updated);

    startTransition(async () => {
      const ids = updated.map((l) => l.id);
      const res = await adminReorderLessonsAction(initialTrack.id, ids);
      if (!res.ok) {
        toast.error(res.error || "Failed to reorder lessons");
        setLessons(initialTrack.lessons || []);
        return;
      }
      toast.success("Lessons reordered");
      router.refresh();
    });
  };

  // Delete lesson
  const handleDeleteLesson = () => {
    if (!deletingLesson) return;
    setIsDeleting(true);

    startTransition(async () => {
      const res = await adminDeleteLessonAction(deletingLesson.id, initialTrack.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete lesson");
        setIsDeleting(false);
        return;
      }

      setLessons((prev) => prev.filter((l) => l.id !== deletingLesson.id));
      toast.success("Lesson deleted");
      setDeleteConfirmOpen(false);
      setDeletingLesson(null);
      setIsDeleting(false);
      router.refresh();
    });
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-md"
          >
            <Link href="/admin/skill">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to tracks</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <h1 className="text-lg font-semibold text-foreground truncate font-sans">
            {initialTrack.title}
          </h1>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-md border-border"
        >
          <Link href={`/skill/${initialTrack.slug}`} target="_blank">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Student curriculum view</span>
          </Link>
        </Button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Track Details & Lessons List */}
        <div className="space-y-8 min-w-0">
          {/* Track Basics Form */}
          <PanelSection
            title="Track details"
            description="Manage title, description, and vanity slug for this learning track."
          >
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4 items-start">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block font-sans">
                    Title *
                  </label>
                  <Input
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="h-10 text-sm rounded-md bg-card border-border"
                  />
                  {trackErrors.title && (
                    <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                      {trackErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block font-sans">
                    URL slug *
                  </label>
                  <div className="flex items-center rounded-md border border-border bg-card h-10 px-2.5 focus-within:ring-2 focus-within:ring-ring">
                    <span className="font-sans text-muted-foreground text-xs select-none pr-1">
                      /skill/
                    </span>
                    <input
                      type="text"
                      value={trackSlug}
                      onChange={(e) => setTrackSlug(e.target.value)}
                      className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-hidden min-w-0"
                    />
                  </div>
                  {trackErrors.slug && (
                    <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                      {trackErrors.slug}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block font-sans">
                  Description *
                </label>
                <Textarea
                  rows={3}
                  value={trackDesc}
                  onChange={(e) => setTrackDesc(e.target.value)}
                  className="text-xs rounded-md bg-card border-border leading-relaxed font-sans"
                />
                {trackErrors.description && (
                  <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                    {trackErrors.description}
                  </p>
                )}
              </div>

              {isTrackDirty && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Unsaved track changes</span>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isPending}
                    onClick={handleSaveTrack}
                    className="h-8 text-xs rounded-md gap-1.5"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Update track</span>
                  </Button>
                </div>
              )}
            </div>
          </PanelSection>

          {/* Pricing & Rules Section */}
          <PanelSection
            title="Pricing and rules"
            description="Set course price, pass mark, attempt limits, and certificate eligibility."
          >
            <div className="rounded-lg border border-border/70 bg-card p-5 space-y-4">
              {pricingError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
                  <span>{pricingError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="trackPriceNgn" className="text-xs font-medium">
                    Price (NGN)
                  </Label>
                  <Input
                    id="trackPriceNgn"
                    type="number"
                    min={0}
                    value={priceNgn}
                    onChange={(e) => setPriceNgn(e.target.value)}
                    disabled={isPending}
                    className="h-9 rounded-lg text-sm tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Set to 0 for a free course. Free courses issue certificates instantly upon passing.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trackPassMark" className="text-xs font-medium">
                    Pass mark (%)
                  </Label>
                  <Input
                    id="trackPassMark"
                    type="number"
                    min={1}
                    max={100}
                    value={passMark}
                    onChange={(e) => setPassMark(e.target.value)}
                    placeholder={`Default (${initialTrack.settingsDefaults.default_pass_mark}%)`}
                    disabled={isPending}
                    className="h-9 rounded-lg text-sm tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to use the global default.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trackMaxAttempts" className="text-xs font-medium">
                    Max quiz attempts
                  </Label>
                  <Input
                    id="trackMaxAttempts"
                    type="number"
                    min={1}
                    max={20}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    placeholder={`Default (${initialTrack.settingsDefaults.default_max_attempts})`}
                    disabled={isPending}
                    className="h-9 rounded-lg text-sm tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to use the global default.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trackMinTimePct" className="text-xs font-medium">
                    Minimum lesson time (%)
                  </Label>
                  <Input
                    id="trackMinTimePct"
                    type="number"
                    min={0}
                    max={100}
                    value={minTimePct}
                    onChange={(e) => setMinTimePct(e.target.value)}
                    placeholder={`Default (${initialTrack.settingsDefaults.default_min_time_pct}%)`}
                    disabled={isPending}
                    className="h-9 rounded-lg text-sm tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used when a lesson has no custom minimum time.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
                <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={certificateEnabled}
                    onCheckedChange={(checked) => {
                      setCertificateEnabled(Boolean(checked));
                      setPricingError(null);
                    }}
                    disabled={isPending}
                  />
                  <span>Issue certificate when course requirements are met</span>
                </label>

                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || !isPricingDirty}
                  onClick={handleSavePricing}
                  className="h-8 text-xs rounded-lg gap-1.5 self-start sm:self-auto"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save pricing and rules</span>
                </Button>
              </div>
            </div>
          </PanelSection>

          {/* Lessons Section */}
          <PanelSection
            title="Lessons & curriculum"
            description="Ordered lesson sequence. Learners unlock rewards and skill points as they progress."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openQuizModal(null)}
                  className="gap-1.5 rounded-lg h-8 text-xs border-border/70"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>
                    {finalExamQuiz
                      ? `Final exam (${finalExamQuiz.questions.length})`
                      : "Add final exam"}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={openNewLessonModal}
                  className="gap-1.5 rounded-lg h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add lesson</span>
                </Button>
              </div>
            }
          >
            <div className="space-y-2 pt-1">
              {lessons.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border/80 rounded-lg space-y-3">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground font-sans">
                    No lessons created in this track yet. Add the first lesson to begin building curriculum.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openNewLessonModal}
                    className="text-xs h-8 rounded-md gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create lesson 1</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card divide-y divide-border/60 overflow-hidden">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      onClick={() => openEditLessonModal(lesson)}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* Left: Reorder Controls + Position + Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Up/Down buttons */}
                        <div
                          className="flex flex-col gap-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={idx === 0 || isPending}
                            onClick={() => handleMoveLesson(idx, "up")}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            aria-label="Move lesson up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === lessons.length - 1 || isPending}
                            onClick={() => handleMoveLesson(idx, "down")}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            aria-label="Move lesson down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-sans font-semibold text-xs tabular-nums text-muted-foreground w-5 text-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <span className="font-medium text-foreground truncate font-sans block text-sm">
                            {lesson.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate font-sans block">
                            {lesson.summary}
                          </span>
                        </div>
                      </div>

                      {/* Right: Badges + Actions */}
                      <div
                        className="flex items-center gap-2 shrink-0 flex-wrap justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lesson.duration_seconds !== null &&
                          lesson.duration_seconds > 0 && (
                            <span className="inline-flex items-center gap-1 font-sans tabular-nums text-[11px] px-2 py-0.5 rounded-md border border-border/70 bg-secondary/50 text-muted-foreground">
                              <Clock className="h-3 w-3 stroke-[1.5]" />
                              <span>
                                {formatSecondsAsMinutesLabel(
                                  lesson.duration_seconds
                                )}
                              </span>
                            </span>
                          )}

                        {(() => {
                          const lessonQuiz = quizByLessonId.get(lesson.id);
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                openQuizModal(lesson.id, lesson.title)
                              }
                              className={cn(
                                "inline-flex items-center gap-1 font-sans tabular-nums font-medium text-[11px] px-2 py-0.5 rounded-md border motion-safe:transition-colors duration-150",
                                lessonQuiz
                                  ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)] hover:opacity-90"
                                  : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <HelpCircle className="h-3 w-3 stroke-[1.5]" />
                              <span>
                                {lessonQuiz
                                  ? `Quiz (${lessonQuiz.questions.length} ${
                                      lessonQuiz.questions.length === 1
                                        ? "question"
                                        : "questions"
                                    })`
                                  : "Add quiz"}
                              </span>
                            </button>
                          );
                        })()}

                        <span className="font-sans tabular-nums font-semibold text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--data-signups-subtle)] text-[color:var(--data-signups-ink)] border border-[color:var(--data-signups-border)]">
                          {lesson.skill_points} pts
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditLessonModal(lesson)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
                          aria-label="Edit lesson"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeletingLesson(lesson);
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-md"
                          aria-label="Delete lesson"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {finalExamQuiz && (
                    <div
                      onClick={() => openQuizModal(null)}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs bg-secondary/20 hover:bg-muted/40 motion-safe:transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary shrink-0">
                          Final exam
                        </span>
                        <span className="font-medium text-foreground truncate text-sm">
                          {finalExamQuiz.title}
                        </span>
                      </div>
                      <span className="font-sans tabular-nums text-[11px] text-muted-foreground shrink-0">
                        {finalExamQuiz.questions.length}{" "}
                        {finalExamQuiz.questions.length === 1
                          ? "question"
                          : "questions"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PanelSection>
        </div>

        {/* Right Sticky Column: Track Publishing Card */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <AdminCard className="p-5 space-y-5 rounded-lg border-border">
            <h2 className="text-sm font-semibold text-foreground font-sans">
              Track overview
            </h2>

            {/* Publishing Status Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground font-sans">Status</span>
                <StatusPill variant={isPublished ? "verified" : "pending"} />
              </div>
              <Button
                type="button"
                variant={isPublished ? "outline" : "default"}
                size="sm"
                disabled={isPending}
                onClick={handleTogglePublish}
                className="w-full text-xs h-9 rounded-md gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPublished ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Unpublish to draft</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Publish track</span>
                  </>
                )}
              </Button>
            </div>

            {/* Metrics */}
            <div className="border-t border-border/60 pt-4 space-y-2.5 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total lessons:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {lessons.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total skill points:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {totalPoints} pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">URL slug:</span>
                <span className="font-mono text-muted-foreground text-[11px] truncate max-w-[140px]">
                  /{trackSlug}
                </span>
              </div>
            </div>

            {/* View student curriculum link */}
            <div className="border-t border-border/60 pt-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 rounded-md gap-1.5 border-border"
              >
                <Link href={`/skill/${initialTrack.slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View curriculum</span>
                </Link>
              </Button>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Lesson Editor Modal */}
      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground font-sans">
              {editingLessonId ? "Edit lesson" : "Add new lesson"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Curate lesson summary, position index, skill reward points, and markdown body.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {lessonErrors.form && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span>{lessonErrors.form}</span>
              </div>
            )}
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                Lesson title *
              </label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. Introduction to Semantic HTML"
                className="h-9 text-xs rounded-md bg-background border-border"
              />
              {lessonErrors.title && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {lessonErrors.title}
                </p>
              )}
            </div>

            {/* Position & Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block font-sans">
                  Position index *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={lessonPosition}
                  onChange={(e) => setLessonPosition(Number(e.target.value))}
                  className="h-9 text-xs rounded-md bg-background border-border font-sans tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block font-sans">
                  Skill points reward *
                </label>
                <Input
                  type="number"
                  min={0}
                  value={lessonPoints}
                  onChange={(e) => setLessonPoints(Number(e.target.value))}
                  className="h-9 text-xs rounded-md bg-background border-border font-sans tabular-nums"
                />
              </div>
            </div>

            {/* Video link & Timing */}
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block font-sans">
                  Video link
                </label>
                <Input
                  type="url"
                  value={lessonContentUrl}
                  onChange={(e) => setLessonContentUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-9 text-xs rounded-lg bg-background border-border"
                />
                <p className="text-[11px] text-muted-foreground font-sans">
                  Use YouTube or Vimeo links in the video link field. Short lessons of 10–15 minutes work best.
                </p>
                {lessonErrors.content_url && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 font-sans">
                    {lessonErrors.content_url}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block font-sans">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    value={lessonDurationMin}
                    onChange={(e) => setLessonDurationMin(e.target.value)}
                    placeholder="e.g. 12"
                    className="h-9 text-xs rounded-lg bg-background border-border font-sans tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block font-sans">
                    Minimum time (minutes)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    value={lessonMinTimeMin}
                    onChange={(e) => setLessonMinTimeMin(e.target.value)}
                    placeholder="Automatic"
                    className="h-9 text-xs rounded-lg bg-background border-border font-sans tabular-nums"
                  />
                  {(() => {
                    const durSecs = minutesToSeconds(lessonDurationMin);
                    const autoSecs = computeAutoMinSeconds(
                      durSecs,
                      effectiveMinTimePct
                    );
                    if (lessonMinTimeMin.trim() === "" && autoSecs !== null) {
                      return (
                        <p className="text-[11px] text-muted-foreground font-sans tabular-nums">
                          Automatic: {formatSecondsAsMinutesLabel(autoSecs)} (
                          {effectiveMinTimePct}% of {lessonDurationMin} min)
                        </p>
                      );
                    }
                    return null;
                  })()}
                  {lessonErrors.min_seconds && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 font-sans">
                      {lessonErrors.min_seconds}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                Summary *
              </label>
              <Textarea
                rows={2}
                value={lessonSummary}
                onChange={(e) => setLessonSummary(e.target.value)}
                placeholder="Brief takeaway and learning objectives..."
                className="text-xs rounded-md bg-background border-border leading-relaxed font-sans"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground font-sans">
                <span>Core overview of topic.</span>
                <span className="tabular-nums">{lessonSummary.length} chars</span>
              </div>
              {lessonErrors.summary && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {lessonErrors.summary}
                </p>
              )}
            </div>

            {/* Markdown Content (with Write | Preview toggle) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground block font-sans">
                  Lesson content (Markdown) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground tabular-nums font-sans">
                    {lessonContent.length} chars
                  </span>
                  <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                    <button
                      type="button"
                      onClick={() => setLessonEditorMode("write")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-sans transition-colors",
                        lessonEditorMode === "write"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonEditorMode("preview")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-sans transition-colors",
                        lessonEditorMode === "preview"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              {lessonEditorMode === "write" ? (
                <Textarea
                  rows={10}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder="## Section Heading&#10;&#10;Write comprehensive markdown content with code samples and checklists..."
                  className="font-mono text-xs rounded-md bg-background border-border leading-relaxed"
                />
              ) : (
                <div className="min-h-[220px] p-4 rounded-md border border-border/60 bg-muted/20 text-xs overflow-y-auto max-h-[360px]">
                  {lessonContent.trim() ? (
                    <LessonMarkdown content={lessonContent} />
                  ) : (
                    <p className="text-muted-foreground italic font-sans">
                      Write markdown to see a preview.
                    </p>
                  )}
                </div>
              )}
              {lessonErrors.content_md && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {lessonErrors.content_md}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLessonModalOpen(false)}
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
              onClick={handleSaveLesson}
              className="text-xs h-8 rounded-md gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{editingLessonId ? "Save changes" : "Create lesson"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground font-sans">
              Delete lesson?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{deletingLesson?.title}</strong>? Note: if any
              students have completed this lesson, deletion will be rejected to protect student
              records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingLesson(null);
              }}
              disabled={isDeleting}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteLesson}
              className="text-xs h-8 rounded-lg gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Builder Dialog */}
      <QuizBuilderDialog
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        trackId={initialTrack.id}
        lessonId={quizLessonId}
        lessonTitle={quizLessonTitle}
        existingQuiz={
          quizLessonId
            ? quizByLessonId.get(quizLessonId) ?? null
            : finalExamQuiz
        }
        defaultPassMark={
          passMark.trim() !== "" && !Number.isNaN(Number(passMark))
            ? Number(passMark)
            : initialTrack.settingsDefaults.default_pass_mark
        }
        defaultMaxAttempts={
          maxAttempts.trim() !== "" && !Number.isNaN(Number(maxAttempts))
            ? Number(maxAttempts)
            : initialTrack.settingsDefaults.default_max_attempts
        }
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
