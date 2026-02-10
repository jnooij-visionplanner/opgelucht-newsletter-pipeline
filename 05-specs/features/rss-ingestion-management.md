# Feature: RSS Ingestion & Management

**Project:** Opgelucht Content Pipeline  
**Traceability:** F1, F2, F12, AC1, AC9  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature enables the automated ingestion of news items from Google Alerts RSS feeds and provides management capabilities for editors to configure feed sources.

## User Roles

| Role | Interaction |
|------|-------------|
| **System/Scheduler** | Automatically fetches feeds on schedule |
| **Editor** | Manages RSS feed configuration |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-001** | MUST | The system shall allow the Editor to add, edit, and remove RSS feed URLs via a management screen. | F12, AC9 |
| **FR-002** | MUST | The system shall allow the Editor to assign a "search term label" to each RSS feed for identification. | F12 |
| **FR-003** | MUST | The system shall automatically fetch all active RSS feeds on a configurable schedule (default: daily at 12:00). | F1, Step 1 |
| **FR-004** | MUST | The system shall parse each RSS item to extract: Title, Link (URL), PubDate, Source/Creator, and Snippet/Description. | F2, Step 2 |
| **FR-005** | MUST | The system shall handle duplicate RSS items across fetch cycles (idempotent ingestion) by checking unique URLs or GUIDs. | F3 |
| **FR-006** | SHOULD | The system shall validate the format of RSS feeds and log errors if parsing fails. | R4 |

---

## Data Requirements

### RssFeed Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier via SQLite |
| `url` | String | The RSS feed address |
| `searchTermLabel` | String | Label matching the Google Alert term |
| `isActive` | Boolean | Enable/disable fetching |
| `createdAt` | Timestamp | Record creation time |
| `updatedAt` | Timestamp | Record update time |

### NewsItem Entity (Partial - Ingestion Fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier |
| `rssFeedId` | FK | Origin feed reference |
| `title` | String | Article headline |
| `sourceName` | String | Publisher name |
| `originalUrl` | String | Direct link |
| `publishedDate` | DateTime | Publication date |
| `snippet` | Text | RSS description/summary |
| `crawledAt` | Timestamp | Time of ingestion |

---

## External Interface: Google Alerts (RSS)

| Property | Value |
|----------|-------|
| **Protocol** | HTTP/HTTPS GET |
| **Format** | RSS 2.0 or Atom |
| **Frequency** | Polling schedule (daily default) |

---

## Acceptance Criteria

- **AC1:** Feeds are fetched automatically on schedule
- **AC9:** Editors can manage feed configuration via UI
