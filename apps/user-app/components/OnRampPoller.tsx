"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OnRampPoller({ token }: { token?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/onramp/${token}/status`);
        if (!res.ok) return;

        const data = await res.json();
        setStatus(data.status);

        if (data.status === "Success" || data.status === "Failure") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // ignore
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [token, router]);

  if (!token || !status) return null;

  return (
    <p className="mb-4 text-sm text-slate-600">
      Payment status: <span className="font-medium">{status}</span>
      {status === "Processing" ? " (checking…)" : null}
    </p>
  );
}
