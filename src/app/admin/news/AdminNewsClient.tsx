"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Pin,
  Trash2,
  Archive,
  Globe,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { NewsPostListItem, NewsStatus } from "@/lib/news/types";
import {
  adminSetNewsStatusAction,
  adminDeleteNewsPostAction,
} from "@/lib/news/admin-actions";
import { CATEGORY_LABELS } from "@/lib/news/validation";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusBadge } from "@/components/admin/primitives/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface AdminNewsClientProps {
  initialPosts: NewsPostListItem[];
}

export function AdminNewsClient({ initialPosts }: AdminNewsClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<NewsPostListItem[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [deletingPost, setDeletingPost] = useState<NewsPostListItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keyboard shortcut '/' focuses search
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
  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const archivedCount = posts.filter((p) => p.status === "archived").length;

  const tabOptions = useMemo(
    () => [
      { id: "all", label: `All (${totalCount})` },
      { id: "published", label: `Published (${publishedCount})` },
      { id: "draft", label: `Draft (${draftCount})` },
      { id: "archived", label: `Archived (${archivedCount})` },
    ],
    [totalCount, publishedCount, draftCount, archivedCount]
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" ? true : post.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [posts, statusFilter, search]);

  const handleStatusChange = async (post: NewsPostListItem, newStatus: NewsStatus) => {
    startTransition(async () => {
      const res = await adminSetNewsStatusAction(post.id, newStatus);
      if (!res.ok) {
        toast.error(res.error || "Failed to update post status");
        return;
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
      toast.success(`Post marked as ${newStatus}`);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setIsDeleting(true);

    const res = await adminDeleteNewsPostAction(deletingPost.id);
    setIsDeleting(false);

    if (!res.ok) {
      toast.error(res.error || "Failed to delete post");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
    setDeleteConfirmOpen(false);
    setDeletingPost(null);
    toast.success("News post deleted");
  };

  return (
    <main className="space-y-6 max-w-[1400px] mx-auto">
      <AdminPageHeader
        section="communication"
        icon={Newspaper}
        title="News & updates"
        description="Draft, publish, and manage platform announcements, articles, and changelogs."
        badge={
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {totalCount} post{totalCount !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <Button size="sm" asChild className="h-9 gap-1.5 text-xs rounded-md">
            <Link href="/admin/news/new">
              <Plus className="h-3.5 w-3.5" />
              <span>New post</span>
            </Link>
          </Button>
        }
      />

      {/* Tabs and search toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={tabOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          ariaLabel="News status filter"
        />

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts… (press / to focus)"
            className="h-9 text-xs pl-8 rounded-md"
          />
        </div>
      </div>

      {/* Posts table / list */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No news posts found"
          description={
            search
              ? `No articles match "${search}". Try clearing your search.`
              : statusFilter !== "all"
              ? `No posts currently in "${statusFilter}" status.`
              : "No articles have been created yet. Create your first news announcement."
          }
          action={
            search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="text-xs"
              >
                Clear search
              </Button>
            ) : (
              <Button size="sm" asChild className="text-xs">
                <Link href="/admin/news/new">Create post</Link>
              </Button>
            )
          }
        />
      ) : (
        <div
          className={`rounded-lg border border-border bg-card overflow-hidden transition-opacity duration-150 ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/20 border-b border-border text-[11px] text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-8" aria-label="Pinned status" />
                  <th className="p-3">Title &amp; summary</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    onClick={() => router.push(`/admin/news/${post.id}/edit`)}
                    className="cursor-pointer transition-colors duration-100 hover:bg-muted/40"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/admin/news/${post.id}/edit`);
                    }}
                    role="row"
                    aria-label={`Edit ${post.title}`}
                  >
                    {/* Pinned Marker */}
                    <td className="p-3 text-center">
                      {post.pinned && (
                        <span title="Pinned to top">
                          <Pin className="h-3.5 w-3.5 text-primary inline" />
                        </span>
                      )}
                    </td>

                    {/* Title and summary */}
                    <td className="p-3 max-w-[320px]">
                      <div className="font-semibold text-foreground truncate">
                        {post.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {post.summary}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <StatusBadge
                        status={post.status}
                        variantMap={{
                          published: { variant: "success", label: "Published" },
                          draft: { variant: "neutral", label: "Draft" },
                          archived: { variant: "warning", label: "Archived" },
                        }}
                      />
                    </td>

                    {/* Date */}
                    <td className="p-3 tabular-nums text-muted-foreground text-[11px]">
                      {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="p-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label={`Actions for ${post.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/news/${post.id}/edit`)}
                            className="gap-2"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit post</span>
                          </DropdownMenuItem>

                          {post.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post, "published")}
                              className="gap-2 text-emerald-600 dark:text-emerald-400"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span>Publish</span>
                            </DropdownMenuItem>
                          )}

                          {post.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post, "archived")}
                              className="gap-2 text-amber-600 dark:text-amber-400"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              <span>Archive</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingPost(post);
                              setDeleteConfirmOpen(true);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>Delete news post?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 space-y-2">
              <span>
                This will permanently remove &ldquo;{deletingPost?.title}&rdquo;. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete post</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
