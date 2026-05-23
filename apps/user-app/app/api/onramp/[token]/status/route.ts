import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { getOnRampStatus } from "@repo/redis";
import { authOptions } from "../../../../lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = params.token;
  const redisStatus = await getOnRampStatus(token);

  if (redisStatus) {
    return NextResponse.json({ status: redisStatus, source: "redis" });
  }

  const txn = await prisma.onRampTransaction.findUnique({
    where: { token },
    select: { status: true, userId: true },
  });

  if (!txn || txn.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: txn.status, source: "database" });
}
