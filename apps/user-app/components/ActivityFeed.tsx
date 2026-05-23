"use client";

import { Card } from "@repo/ui/card";
import { useEffect, useState } from "react";

type ActivityItem = {
  type: string;
  amount?: number;
  counterparty?: string;
  status?: string;
  timestamp: string;
};

function formatActivity(item: ActivityItem) {
  const amount = item.amount ? `₹${item.amount / 100}` : "";
  switch (item.type) {
    case "topup":
      return `Added ${amount} to wallet`;
    case "topup_failed":
      return `Top-up failed (${amount})`;
    case "p2p_sent":
      return `Sent ${amount} to ${item.counterparty ?? "user"}`;
    case "p2p_received":
      return `Received ${amount} from ${item.counterparty ?? "user"}`;
    default:
      return item.type;
  }
}

export function ActivityFeed() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => setActivity(data.activity ?? []))
      .catch(() => setActivity([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Recent activity">
      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No activity yet</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {activity.map((item, i) => (
            <div key={i} className="flex justify-between py-2 text-sm">
              <span>{formatActivity(item)}</span>
              <span className="text-xs text-slate-500">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
