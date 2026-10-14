import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { Users, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin — Users",
  description: "Manage and view platform users",
};

const PAGE_SIZE = 20;

/* ── User row type ────────────────────────────────────────────────── */
interface UserRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  level_id: number;
  is_verified: boolean;
  role: string;
  created_at: string;
}

function getInitials(name?: string | null) {
  if (!name) return "ZE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

/* ── Users content ────────────────────────────────────────────────── */
async function UsersContent({
  search,
  page,
}: {
  search: string;
  page: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Never query or select nin_hash. Only safe display fields.
  let query = admin
    .from("users")
    .select("id, full_name, avatar_url, phone_number, level_id, is_verified, role, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search.trim()) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }

  const { data: users, count } = await query;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  if (!users || users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-12 text-center space-y-2">
        <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm font-semibold text-foreground">No users found</p>
        <p className="text-xs text-muted-foreground">
          {search ? `No results for "${search}". Try a different name.` : "No users registered yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-mono">
        Showing {from + 1}–{Math.min(to + 1, count ?? 0)} of {count ?? 0} users
        {search && ` · filtered by "${search}"`}
      </p>

      <Card className="border-hairline bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-hairline">
                {["User", "Phone", "Level", "Status", "Role", "Joined"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(users as UserRow[]).map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 border-hairline shrink-0">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="bg-secondary font-mono text-[10px] font-semibold text-foreground">
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground max-w-[180px] truncate">
                        {u.full_name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                    {maskPhone(u.phone_number)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-muted-foreground">
                      Lvl {u.level_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {u.is_verified ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] gap-1 font-mono"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] gap-1 font-mono"
                      >
                        <ShieldAlert className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        u.role === "admin"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-mono"
                          : "border-hairline text-muted-foreground text-[10px] font-mono"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground font-mono">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-hairline text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/users?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-hairline text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  return (
    <>
      <Header
        title="Users"
        subtitle="Search and review registered citizen accounts."
      />
      <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
        {/* Search */}
        <form method="GET" action="/admin/users" className="flex gap-2 max-w-md">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search by name..."
            className="flex-1 h-10 px-3 rounded-lg border border-hairline bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            className="px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/users"
              className="px-3 h-10 flex items-center rounded-lg border border-hairline text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Table */}
        <Suspense
          fallback={
            <Card className="p-5 border-hairline bg-card space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          }
        >
          <UsersContent search={search} page={page} />
        </Suspense>
      </div>
    </>
  );
}
