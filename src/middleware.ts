import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define your token type
interface MyToken {
  exp?: number;
  role?: string;
  // add other fields you expect from your JWT
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as MyToken | null;
  const { pathname } = req.nextUrl;

  // ✅ Token expiration check
  if (token?.exp) {
    const currentTime: number = Math.floor(Date.now() / 1000);
    if (currentTime > token.exp) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 🔐 Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const role = token.role;
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (pathname.startsWith("/dashboard/manager") && role !== "manager") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (pathname.startsWith("/dashboard/salesmen") && role !== "salesmen") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
   
  }

  // 🔐 Protect POS routes
  if (pathname.startsWith("/pos")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*"],
};
