# Feature: Dashboard & Selection

**Project:** Opgelucht Content Pipeline  
**Traceability:** F5, F6, AC4  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature provides editors with a dashboard interface to view, filter, and select ingested news items and topic clusters for article generation.

## User Roles

| Role | Interaction |
|------|-------------|
| **Editor** | Views dashboard, selects items for processing |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-013** | MUST | The system shall display a "News Item Dashboard" showing all ingested topic clusters and individual items, sorted by date (newest first). | F5, AC4 |
| **FR-014** | MUST | The dashboard shall clearly indicate the paywall status of each item. | F5, Step 4 |
| **FR-015** | MUST | The system shall allow the Editor to select one or more topic clusters (or individual items) for article generation. | F6, Step 4 |
| **FR-016** | SHOULD | The system shall allow the Editor to manually merge or split topic clusters if the automatic deduplication was incorrect. | R7 |
| **FR-017** | MUST | The system shall support bulk selection of items. | Step 4 |

---

## UI Design

**Design Direction:** Brutalist / Industrial  
**Reference Mockup:** `06-mockups/dashboard-mockup-2-brutalist.html`

### Visual Specifications

| Element | Specification |
|---------|---------------|
| Background | Dark (#0a0a0a) |
| Text | Light (#f5f5f0) |
| Accent | Electric yellow (#e8ff00) |
| Fonts | Archivo Black (headings/stats), Space Mono (titles), IBM Plex Mono (body/UI) |
| Layout | Grid-based, no rounded corners, explicit 1px borders (#444) |

### Layout Structure

The dashboard uses a two-column layout:

1. **Main Column — Cluster List**
   - Section title bar with yellow accent background
   - Grid rows: checkbox | source count | cluster content | status indicator
   - Selected rows: yellow-tinted background with left border accent
   - Hover state: darker background (#2a2a2a)

2. **Sidebar (300px) — Selection & Filters**
   - Selection count (large Archivo Black number in yellow)
   - Generate button (yellow border, brutalist hover with box-shadow offset)
   - Statistics block (compact rows with yellow values)
   - Filter checkboxes (accent-colored)

### Stats Strip

Top-level stats displayed in a 5-column grid:
- Items opgehaald | Clusters | Paywalled | Archief opgelost | Onopgelost
- Large yellow numbers (Archivo Black, 2rem), uppercase labels

### Navigation

- Tab bar with numbered prefixes: `[01] Dashboard`, `[02] RSS Feeds`, `[03] Categorieën`, `[04] Prompts`
- Active tab: yellow background with black text
- Inactive: gray text, dark background, border-right separator

### Cluster Row Components

| Component | Details |
|-----------|---------|
| Checkbox | Yellow-bordered, × mark when checked, dark fill |
| Source count | Large yellow number (Archivo Black 1.4rem) centered in bordered cell |
| Title | Space Mono 0.9rem bold, white |
| Meta row | Date + source count, uppercase, small gray text |
| Source tags | Bordered pills: default (gray border), `.archived` (yellow border + text), `.paywalled` (red border + text) |
| Status badge | Bordered text: `.open` = green, `.partial` = yellow, `.blocked` = red |

### Actions Bar

- Dark gray background (#2a2a2a)
- Left: bulk select checkbox + label
- Right: Samenvoegen, Splitsen (default buttons), Genereer (yellow primary button)
- Button style: uppercase IBM Plex Mono, brutalist hover (translate + box-shadow)

---

## Acceptance Criteria

- **AC4:** Dashboard displays ingested clusters and items with clear paywall status indicators
- Editors can select items individually or in bulk
- Selection flows to AI classification step
