"use client";

import { useEffect, useState } from "react";
import { BalanceCard } from "./BalanceCard";

export function BalanceCardClient({
  initialAmount,
  initialLocked,
}: {
  initialAmount: number;
  initialLocked: number;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [locked, setLocked] = useState(initialLocked);

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((data) => {
        if (data.balance) {
          setAmount(data.balance.amount);
          setLocked(data.balance.locked);
        }
      })
      .catch(() => {});
  }, [initialAmount, initialLocked]);

  return <BalanceCard amount={amount} locked={locked} />;
}
