import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Utility used inside middleware.ts to refresh the Supabase session cookie,
 * protect (app) routes from unauthenticated access, and redirect authenticated
 * users away from /login and /signup to /home.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Refreshes the session cookie so it does not expire during active use
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public marketing & informational routes (never require authentication):
  // '/', '/whitepaper', '/fund', '/privacy', '/terms', '/cookies'
  const isAppRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/nav") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Redirect authenticated users away from /login and /signup to /home
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
