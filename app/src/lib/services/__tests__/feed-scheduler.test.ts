import { describe, it, expect, vi } from "vitest";
import {
  startFeedScheduler,
  stopFeedScheduler,
  isSchedulerRunning,
} from "../feed-scheduler";

// Mock node-cron
vi.mock("node-cron", () => ({
  default: {
    validate: vi.fn().mockReturnValue(true),
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn(),
    }),
  },
}));

// Mock feed-fetcher
vi.mock("../feed-fetcher", () => ({
  fetchAllFeeds: vi.fn().mockResolvedValue({
    feedsProcessed: 0,
    totalItemsFetched: 0,
    totalItemsInserted: 0,
    totalDuplicatesSkipped: 0,
    results: [],
    errors: [],
  }),
}));

describe("Feed Scheduler", () => {
  it("should not be running initially", () => {
    expect(isSchedulerRunning()).toBe(false);
  });

  it("should start the scheduler", () => {
    startFeedScheduler();
    expect(isSchedulerRunning()).toBe(true);
  });

  it("should stop the scheduler", () => {
    startFeedScheduler();
    stopFeedScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });

  it("should handle stopping when not running", () => {
    stopFeedScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });
});
