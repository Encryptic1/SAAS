import { NextResponse } from "next/server";
import { isLocalGatewayMode, postGateway } from "@market-standard/db";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_LOCAL_DEV !== "true") {
    return NextResponse.json({ error: "Not available outside local dev" }, { status: 404 });
  }

  const body = await request.json();
  const { question, options } = body as { question?: string; options?: string[] };

  if (!question?.trim() || !Array.isArray(options)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cleaned = options.map((o) => String(o).trim()).filter(Boolean);
  if (cleaned.length < 2) {
    return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const result = await postGateway<{ ok: boolean; poll: unknown }>("/polls", {
      question,
      options: cleaned,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Gateway required in local mode" }, { status: 503 });
}
