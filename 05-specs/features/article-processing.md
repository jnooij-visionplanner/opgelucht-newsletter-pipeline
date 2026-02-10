# Feature: Article Processing (Extraction, Deduplication, Paywalls)

**Project:** Opgelucht Content Pipeline  
**Traceability:** F3, F4, AC2, AC3, Step 2, Step 3  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature handles the processing of ingested news items, including content extraction, deduplication through topic clustering, and paywall bypass attempts via archive services.

## User Roles

| Role | Interaction |
|------|-------------|
| **System/Scheduler** | Automatically processes ingested items |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-007** | MUST | The system shall identify and group news items from different sources that refer to the same story into "Topic Clusters". | F3, AC2 |
| **FR-008** | MUST | The system shall detect if a news item is likely behind a paywall (based on source or content analysis). | F4, AC3 |
| **FR-009** | MUST | The system shall attempt to resolve paywalled URLs by sequentially querying archive services: `archive.ph`, `1ft.io`, `12ft.io`, `web.archive.org`. | F4, AC3 |
| **FR-010** | MUST | If an archive link is found, the system shall store both the original URL and the resolved archive URL. | F4 |
| **FR-011** | MUST | If no archive link is found for a paywalled item, the system shall still ingest the item but flag it as "Paywalled/Unresolved". | F4, R1 |
| **FR-012** | MUST | The system shall attempt to retrieve the full content of the article from the original or archive URL for use in generation. | F2 |

---

## Data Requirements

### NewsItem Entity (Processing Fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| `archiveUrl` | String, nullable | Bypass link from archive service |
| `fullContent` | Text, nullable | Scraped article content |
| `isPaywalled` | Boolean | Paywall detection flag |
| `paywallResolved` | Boolean | Whether archive URL was found |

### TopicCluster Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier |
| `label` | String | Representative title for the cluster |
| `primaryDate` | DateTime | Date of the freshest item |
| `createdAt` | Timestamp | Record creation time |

### TopicClusterItem Entity (Junction)

| Attribute | Type | Description |
|-----------|------|-------------|
| `topicClusterId` | FK | Reference to cluster |
| `newsItemId` | FK | Reference to news item |

---

## External Interface: Archive Services

| Service | Method |
|---------|--------|
| `archive.ph` | URL construction / scraping |
| `1ft.io` | URL construction / scraping |
| `12ft.io` | URL construction / scraping |
| `web.archive.org` | URL construction / scraping |

**Response:** HTML content check for readability

---

## Acceptance Criteria

- **AC2:** News items covering the same story are grouped into topic clusters
- **AC3:** Paywalled articles are detected and archive resolution is attempted
