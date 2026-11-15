export type NewsCategory = "news" | "update" | "announcement";
export type NewsStatus = "draft" | "published" | "archived";

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  category: NewsCategory;
  status: NewsStatus;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NewsPostListItem = Omit<NewsPost, "body_md">;
