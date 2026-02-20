import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes — require auth
  const isProtectedRoute = pathname.startsWith("/shipper") || pathname.startsWith("/carrier");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    const role = profile?.role;
    if (role === "carrier") {
      url.pathname = "/carrier/dashboard";
    } else if (role === "shipper") {
      url.pathname = "/shipper/dashboard";
    } else {
      // No profile or legacy role (e.g. "seller") — send to onboarding
      url.pathname = "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // No profile or legacy role — must onboard
    if (!role || (role !== "shipper" && role !== "carrier")) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/shipper") && role === "carrier") {
      const url = request.nextUrl.clone();
      url.pathname = "/carrier/dashboard";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/carrier") && role === "shipper") {
      const url = request.nextUrl.clone();
      url.pathname = "/shipper/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
