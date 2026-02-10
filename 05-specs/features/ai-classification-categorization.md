# Feature: AI Classification & Categorization

**Project:** Opgelucht Content Pipeline  
**Traceability:** F7, F8, F13, AC5, AC6, AC10  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature uses AI (LLM) to automatically classify selected news items as domestic or international, and assign appropriate categories. Editors can override AI decisions and manage the category list.

## User Roles

| Role | Interaction |
|------|-------------|
| **System** | Performs AI classification and categorization |
| **Editor** | Overrides AI decisions, manages categories |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-018** | MUST | The system shall use an LLM to classify each selected item/cluster as either "Domestic" (Binnenland) or "International" (Buitenland). | F7, AC5 |
| **FR-019** | MUST | The system shall use an LLM to assign one main category from the active Category list. | F8, AC6 |
| **FR-020** | MUST | The system shall allow the Editor to override the AI-assigned classification and category. | Step 5 |
| **FR-021** | MUST | The system shall provide a "Category Management" screen to add, edit, and remove available categories. | F13, AC10 |

---

## Data Requirements

### Category Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | String | Category name (e.g., "Overheid", "Wetenschap") |
| `displayOrder` | Int | Sort order for display |
| `isActive` | Boolean | Enable/disable category |
| `externalId` | Int, nullable | Corresponding Joomla Category ID |
| `createdAt` | Timestamp | Record creation time |
| `updatedAt` | Timestamp | Record update time |

### Classification Values

| Value | Dutch Label | Description |
|-------|-------------|-------------|
| `DOMESTIC` | Binnenland | Dutch/Netherlands-focused news |
| `INTERNATIONAL` | Buitenland | International news |

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

| Rule ID | Rule Description |
|---------|------------------|
| **BR-006** | All non-link output must be in Dutch |

---

## Acceptance Criteria

- **AC5:** Selected items are classified as Domestic or International by AI
- **AC6:** Items are assigned a category from the active category list
- **AC10:** Editors can manage the category list via UI
