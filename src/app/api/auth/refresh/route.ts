/**
 * Token refresh endpoint — stub pending Better Auth.
 * Returns 204 (no content) until the real session refresh is wired.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
