import { NextResponse } from "next/server";
import { ensureRedis } from "@repo/redis";
import prisma from "@repo/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  let redis = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  redis = (await ensureRedis()) !== null;

  return NextResponse.json({
    ok: db,
    db,
    redis,
    hint: !db
      ? "Start Postgres: docker compose up -d"
      : !redis
        ? "Start Redis: docker compose up -d"
        : "All services up",
  });
}
