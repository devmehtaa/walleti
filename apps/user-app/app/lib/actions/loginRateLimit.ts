"use server";

import { headers } from "next/headers";
import { rateLimit } from "@repo/redis";

export async function checkLoginRateLimit(phone: string) {
  const headerList = headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  const byIp = await rateLimit("login:ip", ip, 20, 3600);
  if (!byIp.ok) {
    return {
      ok: false,
      message: `Too many login attempts from this network. Try again in ${byIp.retryAfterSeconds}s`,
    };
  }

  const byPhone = await rateLimit("login:phone", phone, 10, 3600);
  if (!byPhone.ok) {
    return {
      ok: false,
      message: `Too many login attempts for this number. Try again in ${byPhone.retryAfterSeconds}s`,
    };
  }

  return { ok: true };
}
