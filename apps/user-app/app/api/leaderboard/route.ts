import { NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { getTopSenders } from "@repo/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const top = await getTopSenders(10);

  const userIds = top.map((e) => Number(e.userId)).filter((id) => !Number.isNaN(id));
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, number: true },
        })
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const leaderboard = top.map((entry, index) => {
    const user = userMap.get(Number(entry.userId));
    return {
      rank: index + 1,
      userId: entry.userId,
      name: user?.name ?? "User",
      phone: user?.number ?? entry.userId,
      totalSentPaise: entry.score,
    };
  });

  return NextResponse.json({ leaderboard });
}
