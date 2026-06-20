
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const barbeiroId = request.cookies.get("barbeiro_id")?.value;
  const { pathname } = request.nextUrl;

  const rotasProtegidas = pathname.startsWith("/barbeiro/dashboard") ||
                          pathname.startsWith("/barbeiro/caixa") ||
                          pathname.startsWith("/barbeiro/agendamentos");

  if (rotasProtegidas && !barbeiroId) {
    return NextResponse.redirect(new URL("/barbeiro/login", request.url));
  }

  if (pathname === "/barbeiro/login" && barbeiroId) {
    return NextResponse.redirect(new URL("/barbeiro/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/barbeiro/:path*"],
};