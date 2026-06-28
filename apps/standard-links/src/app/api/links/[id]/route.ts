import { NextResponse } from "next/server";
import { deleteLink, updateLink } from "@/lib/links-data";

interface LinkRouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: LinkRouteProps) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    stripeUrl?: string;
    stripeLinkId?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  const row = await updateLink(id, body);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ link: row });
}

export async function DELETE(_request: Request, { params }: LinkRouteProps) {
  const { id } = await params;
  await deleteLink(id);
  return NextResponse.json({ ok: true });
}
