import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getRecentActivity } from "@repo/redis";
import { authOptions } from "../../lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const activity = await getRecentActivity(Number(session.user.id), 20);
  return NextResponse.json({ activity });
}
