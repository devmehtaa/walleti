import { NextResponse } from "next/server";
import { rateLimit, setOtp } from "@repo/redis";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const limit = await rateLimit("otp:send", phone, 3, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many OTP requests. Try again in ${limit.retryAfterSeconds}s` },
      { status: 429 }
    );
  }

  const code = generateOtp();
  await setOtp(phone, code, 300);

  if (process.env.NODE_ENV === "development") {
    console.log(`[otp] ${phone} => ${code}`);
    return NextResponse.json({
      message: "OTP sent (dev mode: check server console)",
      devCode: code,
    });
  }

  return NextResponse.json({ message: "OTP sent" });
}
