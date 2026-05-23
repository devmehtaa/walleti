import { NextResponse } from "next/server";
import { getAllFeatures } from "@repo/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const features = await getAllFeatures();
  return NextResponse.json({ features });
}
