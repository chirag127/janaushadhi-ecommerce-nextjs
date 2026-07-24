import { NextResponse, type NextRequest } from "next/server";
import { dbSearchProducts } from "@/lib/db/repository";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data, error } = await dbSearchProducts(q, 8);
  if (error) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: data ?? [] });
}
