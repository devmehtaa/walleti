"use client";

import { signIn } from "next-auth/react";
import { recordFailedLoginAction } from "../lib/actions/recordFailedLogin";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { checkLoginRateLimit } from "../lib/actions/loginRateLimit";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const rateCheck = await checkLoginRateLimit(phone);
    if (!rateCheck.ok) {
      setLoading(false);
      await recordFailedLoginAction("rate_limited");
      setError(rateCheck.message ?? "Too many attempts");
      return;
    }

    const result = await signIn("credentials", {
      phone,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      await recordFailedLoginAction("invalid_credentials");
      setError("Invalid phone or password. Try 1111111111 / alice if using seed data.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-bold text-[#6a51a6]">Sign in to Walleti</h1>
        <p className="mb-4 text-xs text-slate-500">
          First load in dev can take a few seconds while Next.js compiles.
        </p>
        <p className="mb-6 text-sm text-slate-600">
          Demo: phone <span className="font-mono">1111111111</span>, password{" "}
          <span className="font-mono">alice</span>
        </p>

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          required
          placeholder="1111111111"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#6a51a6] focus:outline-none focus:ring-1 focus:ring-[#6a51a6]"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#6a51a6] focus:outline-none focus:ring-1 focus:ring-[#6a51a6]"
        />

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#6a51a6] py-2.5 font-medium text-white hover:bg-[#5a448f] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
