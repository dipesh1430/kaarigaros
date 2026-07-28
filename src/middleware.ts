import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isLoggedIn = !!req.nextauth.token;
    const isOnAuthPage = req.nextUrl.pathname === "/login";

    // If logged in and on login page → redirect to dashboard
    if (isLoggedIn && isOnAuthPage) {
      return NextResponse.redirect(new URL("/batches", req.url));
    }

    // If not logged in and not on login page → let withAuth handle redirect
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        // Allow access to login page without auth
        if (req.nextUrl.pathname === "/login") return true;
        // All other routes require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
