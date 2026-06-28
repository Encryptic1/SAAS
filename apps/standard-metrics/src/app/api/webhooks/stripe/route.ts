import { handleStripeWebhookRequest } from "@market-standard/billing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  return handleStripeWebhookRequest(body, signature);
}
