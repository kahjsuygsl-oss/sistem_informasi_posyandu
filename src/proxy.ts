import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Mapping role ke prefix route yang diizinkan
const ROLE_ROUTES: Record<string, string> = {
  KADER: "/kader",
  ADMIN: "/admin",
  SUPERADMIN: "/superadmin",
}

// Route yang bisa diakses tanpa login
const PUBLIC_ROUTES = ["/login"]

// req.url/req.nextUrl.origin tidak selalu bisa dipercaya di balik reverse proxy
// (Prisma Compute dkk) — pakai header X-Forwarded-Host/Proto kalau ada, baru fallback
// ke NEXTAUTH_URL, baru ke origin bawaan request.
function resolveOrigin(req: Parameters<Parameters<typeof auth>[0]>[0]) {
  const forwardedHost = req.headers.get("x-forwarded-host")
  if (forwardedHost) {
    const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https"
    return `${forwardedProto}://${forwardedHost}`
  }
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  return req.nextUrl.origin
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const origin = resolveOrigin(req)

  // Izinkan public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    // Kalau sudah login, redirect ke dashboard role-nya
    if (session?.user) {
      const dashboardUrl = getDashboardUrl(session.user.role)
      return NextResponse.redirect(new URL(dashboardUrl, origin))
    }
    return NextResponse.next()
  }

  // Izinkan akses ke API auth (next-auth internal)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Belum login → redirect ke login
  if (!session?.user) {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role
  const allowedPrefix = ROLE_ROUTES[userRole]

  // Redirect dari root ke dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole), origin))
  }

  // Cek apakah user mengakses route yang bukan haknya
  const isProtectedRoute = Object.values(ROLE_ROUTES).some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isProtectedRoute && !pathname.startsWith(allowedPrefix)) {
    // Akses route role lain → redirect ke dashboard sendiri
    return NextResponse.redirect(new URL(getDashboardUrl(userRole), origin))
  }

  return NextResponse.next()
})

function getDashboardUrl(role: string): string {
  switch (role) {
    case "KADER":
      return "/kader/dashboard"
    case "ADMIN":
      return "/admin/dashboard"
    case "SUPERADMIN":
      return "/superadmin/dashboard"
    default:
      return "/login"
  }
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - file statis lain (.png, .svg, dll)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
