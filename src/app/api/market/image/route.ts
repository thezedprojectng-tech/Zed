import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");

  if (!path) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  // Validate path format: <uuid>/<filename>
  if (!/^[a-f0-9-]{36}\/[A-Za-z0-9_.-]{1,100}$/.test(path)) {
    return new NextResponse("Invalid image path format", { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from("market-images").download(path);

    if (error || !data) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const buffer = await data.arrayBuffer();
    const contentType = data.type || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
