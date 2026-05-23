import prisma from "@repo/db/client";

export type ReconciliationResult = {
  checkedUsers: number;
  discrepancies: Array<{
    userId: number;
    balanceAmount: number;
    expectedFromTopups: number;
    diff: number;
  }>;
};

/**
 * Compares wallet balances against successful on-ramp top-ups (simplified reconciliation).
 * P2P net flow is not included in this v1 check — extend for full ledger reconciliation.
 */
export async function runReconciliation(): Promise<ReconciliationResult> {
  const balances = await prisma.balance.findMany({
    include: {
      user: {
        include: {
          OnRampTransaction: {
            where: { status: "Success" },
          },
        },
      },
    },
  });

  const discrepancies: ReconciliationResult["discrepancies"] = [];

  for (const balance of balances) {
    const topupTotal = balance.user.OnRampTransaction.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Seed users start with balance from seed, not only topups — flag large unexpected diffs only
    const diff = balance.amount - topupTotal;
    if (Math.abs(diff) > 0 && topupTotal > 0 && Math.abs(diff) > 100) {
      discrepancies.push({
        userId: balance.userId,
        balanceAmount: balance.amount,
        expectedFromTopups: topupTotal,
        diff,
      });
    }
  }

  return {
    checkedUsers: balances.length,
    discrepancies,
  };
}
