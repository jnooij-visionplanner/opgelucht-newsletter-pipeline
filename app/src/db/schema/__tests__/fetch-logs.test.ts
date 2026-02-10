import { describe, it, expect } from "vitest";
import { fetchLogs } from "@/db/schema/fetch-logs";

describe("FetchLogs Schema", () => {
  it("should export fetchLogs table", () => {
    expect(fetchLogs).toBeDefined();
  });

  it("should have the expected columns", () => {
    const columns = Object.keys(fetchLogs);
    expect(columns).toContain("id");
    expect(columns).toContain("rssFeedId");
    expect(columns).toContain("status");
    expect(columns).toContain("itemsFetched");
    expect(columns).toContain("itemsInserted");
    expect(columns).toContain("duplicatesSkipped");
    expect(columns).toContain("errorMessages");
    expect(columns).toContain("startedAt");
    expect(columns).toContain("completedAt");
  });
});
