"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { UserDetail, UserDetailDrawer } from "./UserDetailDrawer";
import { exportUsersCsvAction } from "./actions";
import { getLevelName } from "@/types";
import { StatusPill } from "@/components/admin/people/StatusPill";

interface UsersTableClientProps {
  users: UserDetail[];
  currentAdminId: string;
  totalUsers?: number;
  verifiedUsers?: number;
  adminCount?: number;
}

type SortField = "name" | "level" | "verified" | "joined";
type SortDirection = "asc" | "desc";

function formatRelativeDate(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

export function UsersTableClient({
  users,
  currentAdminId,
  totalUsers,
  verifiedUsers,
  adminCount,
}: UsersTableClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isExporting, startExportTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" shortcut focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered and sorted data
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search by name
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = (u.full_name || "").toLowerCase().includes(query);
        const matchesEmail = (u.email || "").toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Filter by verification
      if (filterVerified === "verified" && !u.is_verified) return false;
      if (filterVerified === "unverified" && u.is_verified) return false;

      // Filter by role
      if (filterRole !== "all" && u.role !== filterRole) return false;

      // Filter by level
      if (filterLevel !== "all" && u.level_id !== parseInt(filterLevel, 10)) return false;

      return true;
    });
  }, [users, search, filterVerified, filterRole, filterLevel]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = (a.full_name || "").localeCompare(b.full_name || "");
      } else if (sortField === "level") {
        comparison = a.level_id - b.level_id;
      } else if (sortField === "verified") {
        comparison = (a.is_verified ? 1 : 0) - (b.is_verified ? 1 : 0);
      } else if (sortField === "joined") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredUsers, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (user: UserDetail) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleExportCsv = () => {
    startExportTransition(async () => {
      const res = await exportUsersCsvAction();
      if (!res.success || !res.csv) {
        toast.error(res.error || "Failed to export CSV.");
      } else {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zed_citizens_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Users CSV exported successfully.");
      }
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Summary strip */}
      {totalUsers !== undefined && (
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{totalUsers}</span> citizens
          </span>
          <span>
            <span
              className="font-semibold"
              style={{ color: "var(--data-verified)" }}
            >
              {verifiedUsers}
            </span>{" "}
            verified
          </span>
          <span>
            <span
              className="font-semibold"
              style={{ color: "var(--data-flows)" }}
            >
              {adminCount}
            </span>{" "}
            admins
          </span>
        </div>
      )}

      {/* Control Bar: Search, Filters, CSV Export */}
      <Card className="p-3.5 border-border bg-card shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search citizens… (press / to focus)"
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Filters & Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter: Verified */}
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>

            {/* Filter: Role */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="user">User (Citizen)</option>
              <option value="admin">Administrator</option>
            </select>

            {/* Filter: Level */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1 · Rookie</option>
              <option value="2">Level 2 · Explorer</option>
              <option value="3">Level 3 · Builder</option>
              <option value="4">Level 4 · Pro</option>
              <option value="5">Level 5 · Zed Legend</option>
            </select>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="h-8 text-xs border-border gap-1.5"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count & Hint */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing {sortedUsers.length} of {users.length} citizens
          {(search || filterVerified !== "all" || filterRole !== "all" || filterLevel !== "all") &&
            " (filtered)"}
        </span>
        <span className="text-[11px] hidden sm:inline text-muted-foreground/80">
          Click any row to open full profile &amp; guide progress
        </span>
      </div>

      {/* Main Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {sortedUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm font-semibold text-foreground">No citizens found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  {/* Name Sortable */}
                  <th
                    onClick={() => toggleSort("name")}
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Citizen name</span>
                      {renderSortIndicator("name")}
                    </div>
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Phone (masked)
                  </th>

                  {/* Level Sortable */}
                  <th
                    onClick={() => toggleSort("level")}
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Level</span>
                      {renderSortIndicator("level")}
                    </div>
                  </th>

                  {/* Verified Sortable */}
                  <th
                    onClick={() => toggleSort("verified")}
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {renderSortIndicator("verified")}
                    </div>
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Role
                  </th>

                  {/* Joined Date Sortable */}
                  <th
                    onClick={() => toggleSort("joined")}
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Joined</span>
                      {renderSortIndicator("joined")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleRowClick(u)}
                    className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border shrink-0">
                          <AvatarImage src={u.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[200px]">
                          <span className="font-semibold text-foreground block truncate group-hover:text-primary transition-colors">
                            {u.full_name || "Citizen"}
                          </span>
                          {u.email && (
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {u.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                      {u.masked_phone}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-foreground">
                        <span className="font-medium">{u.level_id}</span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {getLevelName(u.level_id)}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill variant={u.is_verified ? "verified" : "pending"} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill variant={u.role === "admin" ? "admin" : "user"} />
                    </td>

                    <td className="px-4 py-3 text-muted-foreground text-right whitespace-nowrap">
                      <span
                        title={new Date(u.created_at).toLocaleString("en-NG", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      >
                        {formatRelativeDate(u.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User Detail Drawer Sheet */}
      <UserDetailDrawer
        user={selectedUser}
        currentAdminId={currentAdminId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUserUpdated={() => router.refresh()}
      />
    </div>
  );
}
