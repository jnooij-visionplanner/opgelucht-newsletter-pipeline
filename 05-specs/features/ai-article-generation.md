# Feature: AI Article Generation

**Project:** Opgelucht Content Pipeline  
**Traceability:** F9, F10, F14, AC7, AC11  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature uses AI (LLM) to generate article drafts following the "Standard Pattern" format. It includes prompt management capabilities and validation of generated content against business rules.

## User Roles

| Role | Interaction |
|------|-------------|
| **System** | Generates articles using LLM |
| **Editor** | Manages prompts, reviews generated content |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-022** | MUST | The system shall generate an article draft using an LLM based on the content of the selected items. | F9 |
| **FR-023** | MUST | The generated article must follow the "Standard Pattern": Source List (HTML), Title (≤36 chars), Intro (≤175 chars), Narrative Summary (HTML). | F9, AC7 |
| **FR-024** | MUST | The system shall prompt the LLM to search for related articles from the past month to enrich the source list (simulated via prompt context or vector search if implemented, otherwise strictly from feed history). | F10 |
| **FR-025** | MUST | The system shall validate that the generated title is ≤36 characters. If not, it shall trigger a regeneration or truncation. | Business Rule |
| **FR-026** | MUST | The system shall validate that the generated intro is ≤175 characters. If not, it shall trigger a regeneration or truncation. | Business Rule |
| **FR-027** | MUST | The system shall provide a "Prompt Management" screen to view and edit the system prompt used for generation. | F14, AC11 |
| **FR-028** | MUST | The system shall version system prompts to track changes over time. | F14 |
| **FR-029** | MUST | The system shall generate the Source List as an HTML unordered list `<ul>`, sorted by date (newest first), with `target="_blank"` links. | F9, AC7 |

---

## Standard Pattern Definition

The generated article must contain:

1. **Source List** (HTML)
   - Format: `<ul>` unordered list
   - Each source as `<li>` with link (`target="_blank"`)
   - Sorted by date (newest first)

2. **Title**
   - Maximum: 36 characters
   - Language: Dutch

3. **Introduction (Intro)**
   - Maximum: 175 characters
   - Language: Dutch

4. **Narrative Summary** (HTML)
   - Full article body in HTML format
   - Language: Dutch

---

## Data Requirements

### GeneratedArticle Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier |
| `topicClusterId` | FK, nullable | Source cluster reference |
| `title` | String | Generated title (≤36 chars) |
| `introduction` | String | Generated intro (≤175 chars) |
| `narrativeHtml` | Text | Generated article body |
| `sourceListHtml` | Text | Generated sources list |
| `classification` | Enum | DOMESTIC or INTERNATIONAL |
| `categoryId` | FK | Assigned category reference |
| `joomlaPushStatus` | Enum | PENDING, PUSHED, or FAILED |
| `joomlaArticleId` | String, nullable | Joomla article reference |
| `createdAt` | Timestamp | Record creation time |
| `updatedAt` | Timestamp | Record update time |

### SystemPrompt Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier |
| `promptText` | Text | The actual LLM instruction |
| `version` | String/Int | Version identifier |
| `isActive` | Boolean | Current active prompt flag |
| `comment` | String, nullable | Reason for change |
| `createdAt` | Timestamp | Record creation time |

---

## External Interface: OpenAI API

| Property | Value |
|----------|-------|
| **Service** | Chat Completion (GPT-4 class) |
| **Auth** | Bearer Token (API Key) |
| **Input** | JSON (Prompt + Context) |
| **Output** | JSON or Structured Text |

---

## Business Rules

| Rule ID | Rule Description | Enforcement |
|---------|------------------|-------------|
| **BR-001** | Article Title must be ≤ 36 characters | Application Logic (Post-processing check) |
| **BR-002** | Article Introduction must be ≤ 175 characters | Application Logic (Post-processing check) |
| **BR-003** | Source list must be sorted by date (newest first) | LLM Prompt + verification |
| **BR-004** | Use the "Standard Pattern" for all full articles | LLM Prompt |
| **BR-006** | All non-link output must be in Dutch | System configuration / Prompt |

---

## Acceptance Criteria

- **AC7:** Generated articles follow the Standard Pattern with correct constraints
- **AC11:** Editors can manage and version system prompts via UI
