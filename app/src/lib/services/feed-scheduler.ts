import cron, { type ScheduledTask } from "node-cron";
import { fetchAllFeeds } from "./feed-fetcher";

let scheduledTask: ScheduledTask | null = null;

/**
 * Default cron expression: every 30 minutes.
 * Configurable via FEED_FETCH_CRON environment variable.
 */
function getCronExpression(): string {
  return process.env.FEED_FETCH_CRON || "*/30 * * * *";
}

/**
 * Start the scheduled RSS feed fetch cycle.
 * Only one schedule can be active at a time.
 */
export function startFeedScheduler(): void {
  if (scheduledTask) {
    console.log("[Scheduler] Already running — stopping previous schedule");
    scheduledTask.stop();
  }

  const cronExpr = getCronExpression();

  if (!cron.validate(cronExpr)) {
    console.error(`[Scheduler] Invalid cron expression: "${cronExpr}"`);
    return;
  }

  console.log(`[Scheduler] Starting feed fetch schedule: "${cronExpr}"`);

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log(
      `[Scheduler] Triggered at ${new Date().toISOString()}`
    );

    try {
      const result = await fetchAllFeeds();
      console.log(
        `[Scheduler] Cycle complete: ` +
          `${result.feedsProcessed} feeds, ` +
          `${result.totalItemsInserted} new items, ` +
          `${result.totalDuplicatesSkipped} duplicates`
      );

      if (result.errors.length > 0) {
        console.warn(
          `[Scheduler] Errors: ${result.errors.join("; ")}`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      console.error(`[Scheduler] Fatal error during fetch cycle: ${message}`);
    }
  });
}

/**
 * Stop the scheduled feed fetch.
 */
export function stopFeedScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Scheduler] Feed fetch schedule stopped");
  }
}

/**
 * Check whether the scheduler is currently running.
 */
export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}
