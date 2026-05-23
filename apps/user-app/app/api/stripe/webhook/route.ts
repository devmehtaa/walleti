import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { enqueueStripeEvent } from "@repo/redis";
import { processStripeQueueEvent } from "@repo/wallet-core";
import { getStripe } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const queueEvent = {
    id: event.id,
    type: event.type,
    created: event.created,
    receivedAt: new Date().toISOString(),
    data: {
      object: event.data.object as unknown as Record<string, unknown>,
    },
  };

  const enqueued = await enqueueStripeEvent(queueEvent);

  if (!enqueued) {
    console.warn("[stripe-webhook] Redis unavailable, processing inline");
    try {
      await processStripeQueueEvent(queueEvent);
    } catch (error) {
      console.error("Stripe inline processing failed:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true, mode: "inline" });
  }

  return NextResponse.json({ received: true, mode: "queued" });
}
