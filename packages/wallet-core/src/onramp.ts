import prisma from "@repo/db/client";
import {
  enqueueNotification,
  invalidateBalance,
  pushActivity,
  setOnRampStatus,
} from "@repo/redis";

export async function completeOnRampTransaction(token: string) {
  const txn = await prisma.onRampTransaction.findUnique({
    where: { token },
  });

  if (!txn || txn.status === "Success") {
    return;
  }

  await prisma.$transaction([
    prisma.balance.updateMany({
      where: { userId: txn.userId },
      data: { amount: { increment: txn.amount } },
    }),
    prisma.onRampTransaction.updateMany({
      where: { token },
      data: { status: "Success" },
    }),
  ]);

  await setOnRampStatus(token, "Success");
  await invalidateBalance(txn.userId);
  await pushActivity(txn.userId, {
    type: "topup",
    amount: txn.amount,
    status: "Success",
  });
  await enqueueNotification({
    userId: txn.userId,
    type: "topup",
    message: `₹${txn.amount / 100} added to your wallet via Stripe`,
  });
}

export async function failOnRampTransaction(token: string) {
  const txn = await prisma.onRampTransaction.findUnique({
    where: { token },
  });

  await prisma.onRampTransaction.updateMany({
    where: { token, status: "Processing" },
    data: { status: "Failure" },
  });

  await setOnRampStatus(token, "Failure");

  if (txn) {
    await pushActivity(txn.userId, {
      type: "topup_failed",
      amount: txn.amount,
      status: "Failure",
    });
    await enqueueNotification({
      userId: txn.userId,
      type: "topup_failed",
      message: `Top-up of ₹${txn.amount / 100} failed`,
    });
  }
}
