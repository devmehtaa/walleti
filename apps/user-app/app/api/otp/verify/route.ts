import { NextResponse } from "next/server";
import { rateLimit, verifyOtp } from "@repo/redis";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!phone || !code) {
    return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
  }

  const limit = await rateLimit("otp:verify", phone, 10, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s` },
      { status: 429 }
    );
  }

  const valid = await verifyOtp(phone, code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  return NextResponse.json({ message: "OTP verified", verified: true });
}
