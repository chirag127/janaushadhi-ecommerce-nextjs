import { neonAuth } from "@/lib/auth";

export default neonAuth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
