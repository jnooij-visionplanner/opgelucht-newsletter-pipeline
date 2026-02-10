import { describe, it, expect } from "vitest";
import { rssFeeds } from "@/db/schema/rss-feeds";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { categories } from "@/db/schema/categories";
import {
  generatedArticles,
  systemPrompts,
  auditLog,
} from "@/db/schema/generated-articles";

describe("Database Schema", () => {
  it("should export rssFeeds table", () => {
    expect(rssFeeds).toBeDefined();
  });

  it("should export newsItems table", () => {
    expect(newsItems).toBeDefined();
  });

  it("should export topicClusters table", () => {
    expect(topicClusters).toBeDefined();
  });

  it("should export categories table", () => {
    expect(categories).toBeDefined();
  });

  it("should export generatedArticles table", () => {
    expect(generatedArticles).toBeDefined();
  });

  it("should export systemPrompts table", () => {
    expect(systemPrompts).toBeDefined();
  });

  it("should export auditLog table", () => {
    expect(auditLog).toBeDefined();
  });
});
