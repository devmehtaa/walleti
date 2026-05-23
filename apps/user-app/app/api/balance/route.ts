import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../lib/auth";
import { getUserBalance, refreshUserBalanceCache } from "../../lib/balance";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1";

  const balance = refresh
    ? await refreshUserBalanceCache(userId)
    : await getUserBalance(userId);

  return NextResponse.json({ balance, cached: !refresh });
}
