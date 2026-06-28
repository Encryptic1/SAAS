import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getRecurrenceSuggestions } from "@/lib/postmortem-data";

export async function GET(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const threshold = parseFloat(searchParams.get("threshold") ?? "0.4");
  const suggestions = await getRecurrenceSuggestions(ownerId, threshold);
  return NextResponse.json({ suggestions });
}
