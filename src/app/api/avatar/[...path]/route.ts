import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{
    path: string[];
  }>;
}

/**
 * Session-aware avatar proxy route.
 * Avatars bucket is private. Only authenticated users can fetch avatars.
 */
export async function GET(request: NextRequest, { params }: RouteProps) {
  // 1. Session check - verify caller is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Resolve storage path
  const resolvedParams = await params;
  if (!resolvedParams?.path || resolvedParams.path.length === 0) {
    return new NextResponse("Missing file path", { status: 400 });
  }

  const rawPath = resolvedParams.path.join("/");

  // Prevent directory traversal or invalid characters
  if (rawPath.includes("..") || rawPath.includes("//")) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  // Determine mime type from extension
  const ext = rawPath.split(".").pop()?.toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === "jpg" || ext === "jpeg") {
    contentType = "image/jpeg";
  } else if (ext === "png") {
    contentType = "image/png";
  } else if (ext === "webp") {
    contentType = "image/webp";
  } else {
    return new NextResponse("Unsupported image format", { status: 400 });
  }

  // 3. Download from private storage bucket using service role client
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("avatars").download(rawPath);

    if (error || !data) {
      console.warn("[api/avatar] File not found or failed to download:", rawPath, error);
      return new NextResponse("Avatar not found", { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[api/avatar] Unexpected error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
