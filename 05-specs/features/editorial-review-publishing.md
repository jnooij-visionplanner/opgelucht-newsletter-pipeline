# Feature: Editorial Review & Publishing

**Project:** Opgelucht Content Pipeline  
**Traceability:** F11, F15, AC8  
**Version:** 1.0  
**Date:** February 10, 2026

---

## Overview

This feature provides editors with the ability to review generated articles, request regeneration with modifications, and publish approved drafts to the Joomla CMS.

## User Roles

| Role | Interaction |
|------|-------------|
| **Editor** | Reviews articles, triggers regeneration, pushes to Joomla |

---

## Functional Requirements

| ID | Priority | Requirement | Trace |
|----|----------|-------------|-------|
| **FR-030** | MUST | The system shall provide an "Article Review" screen to preview the generated Title, Intro, Narrative, Source List, Class, and Category. | F15 |
| **FR-031** | MUST | The system shall allow the Editor to trigger a re-generation of the article with specific instructions or modified parameters. | F15 |
| **FR-032** | MUST | The system shall allow the Editor to "Push to Joomla". | F11 |
| **FR-033** | MUST | Upon "Push to Joomla", the system shall create a new article in the Joomla CMS via API with status "Draft" or equivalent. | F11, AC8 |
| **FR-034** | MUST | The pushed article must include the HTML Narrative and Source List in the body, and map the Title, Alias (if applicable), Category, and intro text fields correctly. | F11 |
| **FR-035** | SHOULD | The system shall log the "Push to Joomla" action and store the returned Joomla Article ID for reference. | Audit |

---

## UI Requirements

### Article Review Screen

Display elements:
- **Title** with character count indicator (max 36)
- **Introduction** with character count indicator (max 175)
- **Classification** (Domestic/International) - editable
- **Category** - dropdown to change
- **Narrative Summary** - HTML preview
- **Source List** - HTML preview with clickable links

Actions:
- **Regenerate** - Opens dialog for specific instructions
- **Push to Joomla** - Publishes draft to CMS
- **Back to Dashboard** - Return to selection

### Regeneration Dialog

- Text area for specific instructions
- Option to modify classification/category before regeneration
- Confirm/Cancel buttons

---

## External Interface: Joomla CMS API

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/index.php/v1/content/articles` |
| **Auth** | Bearer Token / API Token |
| **Payload** | JSON with fields below |

### Joomla Article Payload

```json
{
  "title": "Generated title",
  "alias": "auto-generated-slug",
  "catid": 123,
  "introtext": "Generated introduction",
  "fulltext": "Narrative HTML + Source List HTML",
  "state": 0
}
```

| Field | Mapped From |
|-------|-------------|
| `title` | GeneratedArticle.title |
| `catid` | Category.externalId |
| `introtext` | GeneratedArticle.introduction |
| `fulltext` | GeneratedArticle.narrativeHtml + sourceListHtml |
| `state` | 0 (Draft/Unpublished) |

---

## Data Requirements

### GeneratedArticle (Publishing Fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| `joomlaPushStatus` | Enum | PENDING, PUSHED, FAILED |
| `joomlaArticleId` | String, nullable | Returned Joomla article ID |

---

## Business Rules

| Rule ID | Rule Description |
|---------|------------------|
| **BR-005** | Selection rate is typically 10-20% of incoming items (editorial process, not system enforced) |

---

## Acceptance Criteria

- **AC8:** Articles are successfully pushed to Joomla CMS as drafts via API
- Editors can preview all article components before publishing
- Regeneration with specific instructions is supported
