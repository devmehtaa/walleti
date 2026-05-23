import { getServerSession } from "next-auth";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCardClient } from "../../../components/BalanceCardClient";
import { OnRampPoller } from "../../../components/OnRampPoller";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { PaymentStatusBanner } from "../../../components/PaymentStatusBanner";
import { authOptions } from "../../lib/auth";
import { getUserBalance } from "../../lib/balance";
import prisma from "@repo/db/client";

async function getOnRampTransactions(userId: number) {
  const txns = await prisma.onRampTransaction.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
    take: 10,
  });
  return txns.map((t) => ({
    time: t.startTime,
    amount: t.amount,
    status: t.status,
    provider: t.provider,
  }));
}

export default async function TransferPage({
  searchParams,
}: {
  searchParams?: { success?: string; canceled?: string; token?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const balance = userId ? await getUserBalance(userId) : { amount: 0, locked: 0 };
  const transactions = userId ? await getOnRampTransactions(userId) : [];

  return (
    <div className="w-screen">
      <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">Transfer</div>
      <PaymentStatusBanner
        success={searchParams?.success === "1"}
        canceled={searchParams?.canceled === "1"}
      />
      <OnRampPoller token={searchParams?.token} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
        <div>
          <AddMoney />
        </div>
        <div>
          <BalanceCardClient
            initialAmount={balance.amount}
            initialLocked={balance.locked}
          />
          <div className="pt-4">
            <OnRampTransactions transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
