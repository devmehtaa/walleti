"use client";

import { Card } from "@repo/ui/card";
import { useEffect, useState } from "react";

type Entry = {
  rank: number;
  name: string;
  phone: string;
  totalSentPaise: number;
};

export function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => setEntries(data.leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Top senders today">
      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No transfers yet today</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.rank}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                <span className="mr-2 font-bold text-[#6a51a6]">#{entry.rank}</span>
                {entry.name || entry.phone}
              </span>
              <span className="font-medium">₹{entry.totalSentPaise / 100}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
