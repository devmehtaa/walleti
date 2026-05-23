"use server";

import { randomUUID } from "crypto";
import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import {
  checkTopUpVelocity,
  FEATURE_FLAGS,
  isFeatureEnabled,
  rateLimit,
  setOnRampStatus,
} from "@repo/redis";
import { authOptions } from "../auth";
import { getStripe } from "../stripe";

export async function createStripeCheckoutSession(amountInRupees: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "You must be logged in to add money" };
  }

  if (!(await isFeatureEnabled(FEATURE_FLAGS.STRIPE_ONRAMP))) {
    return { error: "Add money is temporarily disabled" };
  }

  const topUpLimit = await rateLimit("topup", session.user.id, 5, 60);
  if (!topUpLimit.ok) {
    return {
      error: `Too many top-up attempts. Try again in ${topUpLimit.retryAfterSeconds}s`,
    };
  }

  if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
    return { error: "Enter a valid amount greater than zero" };
  }

  const amountInPaise = Math.round(amountInRupees * 100);
  if (amountInPaise < 100) {
    return { error: "Minimum amount is ₹1" };
  }

  const velocity = await checkTopUpVelocity(Number(session.user.id), amountInPaise);
  if (!velocity.ok) {
    return { error: velocity.message ?? "Top-up limit exceeded" };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
  const token = randomUUID();
  const userId = Number(session.user.id);

  await prisma.onRampTransaction.create({
    data: {
      provider: "Stripe",
      status: "Processing",
      startTime: new Date(),
      token,
      userId,
      amount: amountInPaise,
    },
  });

  await setOnRampStatus(token, "Processing");

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Add money to wallet",
              description: "Top up your Walleti balance",
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      metadata: {
        token,
        userId: String(userId),
      },
      success_url: `${baseUrl}/transfer?success=1&token=${token}`,
      cancel_url: `${baseUrl}/transfer?canceled=1&token=${token}`,
    });

    if (!checkoutSession.url) {
      await failCheckout(token);
      return { error: "Could not start Stripe checkout" };
    }

    return { url: checkoutSession.url, token };
  } catch (error) {
    console.error(error);
    await failCheckout(token);
    return { error: "Payment service unavailable. Check Stripe configuration." };
  }
}

async function failCheckout(token: string) {
  await prisma.onRampTransaction.updateMany({
    where: { token, status: "Processing" },
    data: { status: "Failure" },
  });
  await setOnRampStatus(token, "Failure");
}
