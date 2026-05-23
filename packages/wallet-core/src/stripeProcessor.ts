import {
  isStripeEventProcessed,
  markStripeEventProcessed,
  type StripeQueueEvent,
} from "@repo/redis";
import { completeOnRampTransaction, failOnRampTransaction } from "./onramp";

export async function processStripeQueueEvent(
  event: StripeQueueEvent
): Promise<void> {
  if (await isStripeEventProcessed(event.id)) {
    return;
  }

  const session = event.data.object as {
    metadata?: { token?: string };
    payment_status?: string;
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const token = session.metadata?.token;
      if (token && session.payment_status === "paid") {
        await completeOnRampTransaction(token);
      }
      break;
    }
    case "checkout.session.expired": {
      const token = session.metadata?.token;
      if (token) {
        await failOnRampTransaction(token);
      }
      break;
    }
    default:
      break;
  }

  await markStripeEventProcessed(event.id);
}
