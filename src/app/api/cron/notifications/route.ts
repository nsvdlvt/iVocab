import { NextRequest, NextResponse } from "next/server";
import { AutomationEngine } from "@/lib/notifications/automation-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for batch processing

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // Check Authorization / CRON_SECRET if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      const urlSecret = request.nextUrl.searchParams.get("secret");

      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    const startTime = Date.now();
    const summaries = await AutomationEngine.runAllActiveRules();
    const durationMs = Date.now() - startTime;

    const totalEligible = summaries.reduce((s, r) => s + r.eligibleRecipients, 0);
    const totalInApp = summaries.reduce((s, r) => s + r.inAppSentCount, 0);
    const totalPush = summaries.reduce((s, r) => s + r.pushSentCount, 0);
    const totalFailed = summaries.reduce((s, r) => s + r.failedCount, 0);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      durationMs,
      rulesExecuted: summaries.length,
      totals: {
        eligibleRecipients: totalEligible,
        inAppSent: totalInApp,
        pushSent: totalPush,
        failed: totalFailed,
      },
      summaries,
    });
  } catch (err: any) {
    console.error("Cron notification error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Cron execution error" },
      { status: 500 }
    );
  }
}
