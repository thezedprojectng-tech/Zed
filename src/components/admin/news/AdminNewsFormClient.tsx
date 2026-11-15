"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  Pin,
  FileText,
  AlertCircle,
  Eye,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  slugifyNews,
  newsPostSchema,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/news/validation";
import {
  adminSaveNewsPostAction,
  adminSetNewsStatusAction,
} from "@/lib/news/admin-actions";
import type { NewsPost, NewsCategory, NewsStatus } from "@/lib/news/types";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";
import { PanelSection } from "@/components/admin/primitives/PanelSection";
import { AdminCard } from "@/components/admin/primitives/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminNewsFormClientProps {
  mode: "create" | "edit";
  initialPost?: NewsPost;
}

export function AdminNewsFormClient({
  mode,
  initialPost,
}: AdminNewsFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(mode === "edit");
  const [category, setCategory] = useState<NewsCategory>(initialPost?.category || "news");
  const [summary, setSummary] = useState(initialPost?.summary || "");
  const [bodyMd, setBodyMd] = useState(initialPost?.body_md || "");
  const [pinned, setPinned] = useState<boolean>(initialPost?.pinned || false);
  const [status, setStatus] = useState<NewsStatus>(initialPost?.status || "draft");

  // Write vs Preview tab for markdown
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Dirty state tracking
  const initialValues = useMemo(
    () => ({
      title: initialPost?.title || "",
      slug: initialPost?.slug || "",
      category: initialPost?.category || "news",
      summary: initialPost?.summary || "",
      bodyMd: initialPost?.body_md || "",
      pinned: initialPost?.pinned || false,
      status: initialPost?.status || "draft",
    }),
    [initialPost]
  );

  const isDirty = useMemo(() => {
    return (
      title !== initialValues.title ||
      slug !== initialValues.slug ||
      category !== initialValues.category ||
      summary !== initialValues.summary ||
      bodyMd !== initialValues.bodyMd ||
      pinned !== initialValues.pinned ||
      status !== initialValues.status
    );
  }, [title, slug, category, summary, bodyMd, pinned, status, initialValues]);

  // Warn before unload when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle auto-slugification
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugifyNews(val));
    }
    if (fieldErrors.title) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  const handleSave = useCallback(async () => {
    setFieldErrors({});

    const payload = {
      id: initialPost?.id,
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim(),
      body_md: bodyMd.trim(),
      category,
      status,
      pinned,
    };

    const parsed = newsPostSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString();
        if (path) errs[path] = issue.message;
      }
      setFieldErrors(errs);
      toast.error("Please correct the highlighted form errors");
      return;
    }

    startTransition(async () => {
      const res = await adminSaveNewsPostAction(payload);
      if (!res.ok) {
        toast.error(res.error || "Failed to save news post");
        return;
      }

      toast.success(
        mode === "create" ? "News post created successfully" : "News post saved successfully"
      );

      if (mode === "create" && res.data?.id) {
        router.push(`/admin/news/${res.data.id}/edit`);
      } else {
        router.refresh();
      }
    });
  }, [initialPost, slug, title, summary, bodyMd, category, status, pinned, mode, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 gap-1.5 text-xs rounded-md"
          >
            <Link href="/admin/news">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to news</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {mode === "create" ? "New news post" : `Edit post: ${initialPost?.title || ""}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Draft or publish announcements, feature updates, and platform articles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Unsaved changes
            </span>
          )}
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleSave}
            className="h-9 gap-1.5 text-xs rounded-md"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save post (Ctrl+S)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Post Content Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-5 sm:p-6 space-y-5 rounded-lg border-border">
            <PanelSection title="Post content">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="post-title" className="text-xs font-semibold text-foreground">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {title.length}/140
                    </span>
                  </div>
                  <Input
                    id="post-title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Introducing Internship Radar & Verified Skills"
                    maxLength={140}
                    className={`h-9 text-xs ${fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] text-destructive">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="post-slug" className="text-xs font-semibold text-foreground">
                      URL slug <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {slug.length}/80
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-mono bg-secondary px-2.5 py-2 rounded-md border border-border select-none shrink-0">
                      /news/
                    </span>
                    <Input
                      id="post-slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="introducing-internship-radar"
                      maxLength={80}
                      className={`h-9 text-xs font-mono ${fieldErrors.slug ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {fieldErrors.slug ? (
                    <p className="text-[11px] text-destructive">{fieldErrors.slug}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Lowercase alphanumeric with hyphens. Auto-generated from title until manually edited.
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label htmlFor="post-category" className="text-xs font-semibold text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as NewsCategory)}
                  >
                    <SelectTrigger id="post-category" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="update">Product update</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="post-summary" className="text-xs font-semibold text-foreground">
                      Summary / Excerpt <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {summary.length}/300
                    </span>
                  </div>
                  <Textarea
                    id="post-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief 1-2 sentence overview shown in notifications and cards..."
                    maxLength={300}
                    rows={3}
                    className={`text-xs resize-none ${fieldErrors.summary ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {fieldErrors.summary && (
                    <p className="text-[11px] text-destructive">{fieldErrors.summary}</p>
                  )}
                </div>

                {/* Markdown Body with Write / Preview Tabs */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Article body (Markdown) <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {bodyMd.length}/20000
                      </span>
                      <div className="inline-flex items-center rounded-md border border-border bg-secondary/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setEditorTab("write")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                            editorTab === "write"
                              ? "bg-card text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <PenLine className="h-3 w-3" />
                          <span>Write</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab("preview")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                            editorTab === "preview"
                              ? "bg-card text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {editorTab === "write" ? (
                    <Textarea
                      id="post-body"
                      value={bodyMd}
                      onChange={(e) => setBodyMd(e.target.value)}
                      placeholder="Write your article in Markdown format. Supports headings, bold, bullet points, links, and code blocks..."
                      maxLength={20000}
                      rows={14}
                      className={`text-xs font-mono leading-relaxed resize-y min-h-[300px] ${
                        fieldErrors.body_md ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                    />
                  ) : (
                    <div className="rounded-md border border-border bg-card p-4 min-h-[300px] overflow-y-auto">
                      {bodyMd.trim() ? (
                        <LessonMarkdown content={bodyMd} />
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Nothing to preview yet. Switch to the Write tab to draft your content.
                        </p>
                      )}
                    </div>
                  )}

                  {fieldErrors.body_md && (
                    <p className="text-[11px] text-destructive">{fieldErrors.body_md}</p>
                  )}
                </div>
              </div>
            </PanelSection>
          </AdminCard>
        </div>

        {/* Right Column: Sticky Sidebar Card */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-20 space-y-5">
            <AdminCard className="p-5 space-y-4 rounded-lg border-border">
              <PanelSection title="Publishing status">
                <div className="space-y-4">
                  {/* Status Select */}
                  <div className="space-y-1.5">
                    <label htmlFor="post-status" className="text-xs font-semibold text-foreground">
                      Status
                    </label>
                    <Select
                      value={status}
                      onValueChange={(val) => setStatus(val as NewsStatus)}
                    >
                      <SelectTrigger id="post-status" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Hidden)</SelectItem>
                        <SelectItem value="published">Published (Public)</SelectItem>
                        <SelectItem value="archived">Archived (Locked)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      Publishing notifies all users once. Later edits do not notify again.
                    </p>
                  </div>

                  {/* Pinned toggle */}
                  <div className="pt-2 border-t border-border/70">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Pin className="h-3.5 w-3.5 text-primary" />
                          <span>Pin to top</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          Featured at the top of the news feed above chronological posts.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Publication metadata if editing */}
                  {initialPost?.published_at && (
                    <div className="pt-2 border-t border-border/70 text-[11px] text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>First published:</span>
                        <span className="font-sans tabular-nums text-foreground">
                          {new Date(initialPost.published_at).toLocaleString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {initialPost.updated_at && (
                        <div className="flex justify-between">
                          <span>Last updated:</span>
                          <span className="font-sans tabular-nums text-foreground">
                            {new Date(initialPost.updated_at).toLocaleString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save button inside card */}
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={handleSave}
                    className="w-full h-9 gap-1.5 text-xs rounded-md mt-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save post</span>
                      </>
                    )}
                  </Button>
                </div>
              </PanelSection>
            </AdminCard>
          </div>
        </div>
      </div>
    </div>
  );
}
