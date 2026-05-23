"use server";

import { recordTransferDuration } from "@repo/metrics";
import { getServerSession } from "next-auth";
import {
  enqueueNotification,
  FEATURE_FLAGS,
  incrementLeaderboard,
  invalidateBalance,
  isFeatureEnabled,
  pushActivity,
  rateLimit,
  rollbackTransferVelocity,
  withLock,
  checkTransferVelocity,
} from "@repo/redis";
import prisma from "@repo/db/client";
import { authOptions } from "../auth";

export async function p2pTransfer(to: string, amount: number) {
  const started = Date.now();
  const session = await getServerSession(authOptions);
  const from = session?.user?.id;

  if (!from) {
    return { message: "Error while sending" };
  }

  if (!(await isFeatureEnabled(FEATURE_FLAGS.P2P_TRANSFER))) {
    return { message: "P2P transfers are temporarily disabled" };
  }

  const transferLimit = await rateLimit("p2p", from, 10, 60);
  if (!transferLimit.ok) {
    return {
      message: `Too many transfers. Try again in ${transferLimit.retryAfterSeconds}s`,
    };
  }

  const velocity = await checkTransferVelocity(Number(from), amount);
  if (!velocity.ok) {
    return { message: velocity.message ?? "Transfer limit exceeded" };
  }

  const toUser = await prisma.user.findFirst({
    where: { number: to },
  });

  if (!toUser) {
    await rollbackTransferVelocity(Number(from), amount);
    return { message: "User not found" };
  }

  if (toUser.id === Number(from)) {
    await rollbackTransferVelocity(Number(from), amount);
    return { message: "Cannot send money to yourself" };
  }

  try {
    await withLock(`transfer:${from}`, async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

        const fromBalance = await tx.balance.findUnique({
          where: { userId: Number(from) },
        });

        if (!fromBalance || fromBalance.amount < amount) {
          throw new Error("Insufficient funds");
        }

        await tx.balance.update({
          where: { userId: Number(from) },
          data: { amount: { decrement: amount } },
        });

        await tx.balance.update({
          where: { userId: toUser.id },
          data: { amount: { increment: amount } },
        });

        await tx.p2pTransfer.create({
          data: {
            fromUserId: Number(from),
            toUserId: toUser.id,
            amount,
            timestamp: new Date(),
          },
        });
      });
    });

    await invalidateBalance(Number(from));
    await invalidateBalance(toUser.id);
    await incrementLeaderboard(Number(from), amount);

    await pushActivity(Number(from), {
      type: "p2p_sent",
      amount,
      counterparty: to,
      status: "Success",
    });
    await pushActivity(toUser.id, {
      type: "p2p_received",
      amount,
      counterparty: session.user?.email ?? from,
      status: "Success",
    });

    await enqueueNotification({
      userId: Number(from),
      type: "transfer_sent",
      message: `Sent ₹${amount / 100} to ${to}`,
    });
    await enqueueNotification({
      userId: toUser.id,
      type: "transfer_received",
      message: `Received ₹${amount / 100} from ${session.user?.email ?? from}`,
    });

    recordTransferDuration("success", Date.now() - started);
    return { message: "Success" };
  } catch (error) {
    await rollbackTransferVelocity(Number(from), amount);
    recordTransferDuration("error", Date.now() - started);
    const msg = error instanceof Error ? error.message : "Error while sending";
    return { message: msg };
  }
}
