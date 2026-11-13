import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTableClient } from "./UsersTableClient";
import { UserDetail } from "./UserDetailDrawer";

export const metadata: Metadata = {
  title: "Admin Console — Users Directory",
  description: "Citizen user management and credentials review",
};

async function UsersContent() {
  const currentAdminId = await requireAdmin();
  const admin = createAdminClient();

  // 1. Fetch public.users (never query or select sensitive columns)
  const { data: usersRaw, error: usersErr } = await admin
    .from("users")
    .select("id, full_name, avatar_url, phone_number, level_id, is_verified, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (usersErr) {
    console.error("[AdminUsersPage] Error fetching users:", usersErr.message);
  }

  // 2. Fetch auth user emails to populate email map for delete verification
  const emailMap: Record<string, string> = {};
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const au of authData?.users ?? []) {
      if (au.id && au.email) {
        emailMap[au.id] = au.email;
      }
    }
  } catch (err) {
    console.warn("[AdminUsersPage] Could not list auth users:", err);
  }

  // 3. Fetch nav_progress records to display guide progress in detail drawer
  const progressMap: Record<
    string,
    Record<
      string,
      {
        started: boolean;
        completed: boolean;
        completed_steps?: string[];
        steps?: string[];
        current_step_id?: string;
      }
    >
  > = {};

  try {
    const { data: navRows } = await admin
      .from("nav_progress")
      .select("user_id, flow_id, state");

    for (const row of navRows ?? []) {
      const uid = row.user_id as string;
      const fid = row.flow_id as string;
      if (!progressMap[uid]) progressMap[uid] = {};

      const state = row.state as {
        completed_steps?: string[];
        steps?: string[];
        current_step_id?: string;
      } | null;

      const completedCount = state?.completed_steps?.length || 0;
      const totalSteps = state?.steps?.length || 0;
      const isCompleted = totalSteps > 0 && completedCount === totalSteps;

      progressMap[uid][fid] = {
        started: true,
        completed: isCompleted,
        completed_steps: state?.completed_steps,
        steps: state?.steps,
        current_step_id: state?.current_step_id,
      };
    }
  } catch (err) {
    console.warn("[AdminUsersPage] Could not fetch nav_progress:", err);
  }

  // 4. Assemble clean UserDetail array
  const users: UserDetail[] = (usersRaw ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    phone_number: u.phone_number,
    masked_phone: maskPhone(u.phone_number),
    email: emailMap[u.id] || undefined,
    level_id: u.level_id,
    is_verified: u.is_verified,
    role: u.role,
    created_at: u.created_at,
    updated_at: u.updated_at,
    guidesProgress: progressMap[u.id] || {},
  }));

  // 5. Compute summary stats from the fetched array — no extra queries
  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.is_verified).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <UsersTableClient
      users={users}
      currentAdminId={currentAdminId}
      totalUsers={totalUsers}
      verifiedUsers={verifiedUsers}
      adminCount={adminCount}
    />
  );
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Citizens Directory
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View registered citizens, track civic progress, and manage administrative roles.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4 max-w-[1400px] mx-auto animate-pulse">
            <div className="h-4 w-72 rounded bg-muted" />
            <div className="h-12 rounded-lg bg-card border border-border" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-card border border-border" />
            ))}
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </div>
  );
}
