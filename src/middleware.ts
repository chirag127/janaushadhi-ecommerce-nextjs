import { type NextRequest } from "next/server";
import { updateInsForgeSession } from "@/lib/insforge/middleware";

export async function middleware(request: NextRequest) {
  return await updateInsForgeSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets & images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
