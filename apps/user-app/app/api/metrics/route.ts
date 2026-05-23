import { getMetricsText } from "@repo/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getMetricsText();
  return new Response(metrics, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
