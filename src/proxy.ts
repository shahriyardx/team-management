import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session) return NextResponse.next()

  const callbackUrl = encodeURIComponent(
    request.nextUrl.pathname + request.nextUrl.search,
  )
  return NextResponse.redirect(
    new URL(`/auth/login?callbackURL=${callbackUrl}`, request.url),
  )
}

export const config = {
  matcher: ["/onboard/:path*", "/profile/:path*", "/:companySlug/:path*"],
}
