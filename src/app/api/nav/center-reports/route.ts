import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  center_name: z.string().min(2).max(120),
  state: z.string().min(2).max(60),
  wait_minutes: z.number().int().min(0).max(600),
});

/**
 * GET /api/nav/center-reports
 * Returns the 50 most recent center reports (open read).
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("center_reports")
    .select("id, center_name, state, wait_minutes, reported_at")
    .order("reported_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/nav/center-reports
 * Creates a new center wait-time report (authenticated users only).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = reportSchema.parse(body);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("center_reports")
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
