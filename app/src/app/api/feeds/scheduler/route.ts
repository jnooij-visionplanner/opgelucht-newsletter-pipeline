import { NextResponse } from "next/server";
import {
  startFeedScheduler,
  stopFeedScheduler,
  isSchedulerRunning,
} from "@/lib/services/feed-scheduler";

/**
 * GET /api/feeds/scheduler — Check scheduler status.
 */
export async function GET() {
  return NextResponse.json({
    running: isSchedulerRunning(),
    cronExpression: process.env.FEED_FETCH_CRON || "*/30 * * * *",
  });
}

/**
 * POST /api/feeds/scheduler — Start or stop the scheduler.
 * Body: { "action": "start" | "stop" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "start") {
      startFeedScheduler();
      return NextResponse.json({ running: true, message: "Scheduler started" });
    }

    if (action === "stop") {
      stopFeedScheduler();
      return NextResponse.json({
        running: false,
        message: "Scheduler stopped",
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "stop".' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
