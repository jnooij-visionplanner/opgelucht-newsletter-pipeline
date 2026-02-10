# Project Proposal: "Opgelucht" AI-Powered Newsletter Automation Pipeline

**Prepared for:** Rookvrije Generatie NL (Smokefree Generation NL)  
**Prepared by:** Info Support  
**Date:** February 10, 2026  
**Version:** 1.0  
**Status:** Proposal — for client evaluation  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [About the Client](#2-about-the-client)
3. [Problem Statement](#3-problem-statement)
4. [Proposed Solution](#4-proposed-solution)
5. [Value Proposition](#5-value-proposition)
6. [Functional Scope](#6-functional-scope)
7. [System Workflow](#7-system-workflow)
8. [Technical Architecture](#8-technical-architecture)
9. [AI in the Product — Intelligent Content Features](#9-ai-in-the-product--intelligent-content-features)
10. [AI in Development — Accelerated Delivery](#10-ai-in-development--accelerated-delivery)
11. [Timeline & Milestones](#11-timeline--milestones)
12. [Deliverables](#12-deliverables)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Assumptions](#14-assumptions)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Commercial Terms](#16-commercial-terms)
17. [Appendix A: Example Output — "Nee tegen Vapen"](#appendix-a-example-output--nee-tegen-vapen)
18. [Appendix B: System Architecture Diagram](#appendix-b-system-architecture-diagram)

---

## 1. Executive Summary

Rookvrije Generatie NL publishes *Opgelucht*, a monthly newsletter reaching approximately 50,000 subscribers, alongside weekly news items on cleanairnederland.nl. Currently, processing daily Google Alerts into publishable articles is a labor-intensive, manual effort — consuming significant editorial hours each week.

We propose building an **AI-powered content pipeline** that automates the most time-consuming steps in this workflow: ingesting RSS feeds from Google Alerts, extracting and deduplicating news items, generating publication-ready article drafts (title, introduction, narrative summary, and source list), and delivering them into the existing Joomla CMS as drafts ready for human review.

The system preserves the editorial team's judgment at every critical decision point. Staff will continue selecting which items (10–20% of incoming alerts) merit a full article, and they will review and edit every AI-generated draft before publication. The result is a **human-in-the-loop content pipeline** that eliminates repetitive processing work while maintaining editorial quality and the organization's voice.

By leveraging AI both *within* the product (for content generation, classification, and categorization) and *during* development (for accelerated coding, testing, and design), we can deliver a production-ready system at a timeline and price point that reflects our commitment to supporting Rookvrije Generatie NL's nonprofit mission.

---

## 2. About the Client

Rookvrije Generatie NL has been the Dutch advocacy association for a smoke-free society since 1974 and is the initiator of the Smokefree Generation movement. The organization maintains an active communications program to keep members, supporters, and the public informed about developments in tobacco and nicotine policy, science, and advocacy.

**Current communication assets:**
- Website: cleanairnederland.nl (Joomla CMS)
- Monthly newsletter: *Opgelucht* (~50,000 circulation)
- Weekly news publication cadence: 4–5 articles per week
- Social media presence: Facebook, X, LinkedIn, Instagram, TikTok, Threads
- Google Alerts monitoring: 16 search terms across Dutch tobacco/nicotine topics
- ChatGPT Plus subscription
- Existing article generation script

---

## 3. Problem Statement

The editorial workflow for *Opgelucht* and the website faces three core challenges:

### 3.1 Volume vs. Capacity
Google Alerts deliver 10–15 emails daily across 16 search terms. Each email contains multiple links. Multiple media outlets frequently report on the same story, creating duplication. Processing this volume into a curated, structured news feed requires significant daily effort.

### 3.2 Repetitive Transformation Work
Each published article follows a well-defined standard pattern: source list compilation, title generation (≤36 characters), introduction writing (≤175 characters), and narrative summary creation. This structured, repeatable work is an ideal candidate for AI automation.

### 3.3 Paywall Barriers
A portion of the source material is behind paywalls, requiring manual lookup through archive services (archive.ph, 1ft.io, 12ft.io, web.archive.org). This adds friction and time to every affected article.

**The core need:** Free up editorial time by automating the mechanical steps — ingestion, extraction, deduplication, classification, and draft generation — so the team can focus on what humans do best: selecting newsworthy items, ensuring quality, and adding editorial judgment.

---

## 4. Proposed Solution

We will build the **Opgelucht Content Pipeline** — a web application that automates the processing of Google Alerts RSS feeds into publication-ready article drafts in the Joomla CMS.

### Key Design Principles

| Principle | Implementation |
|---|---|
| **Human-in-the-loop** | Users select relevant items and review every generated article before publication |
| **AI-assisted, not AI-replaced** | The system generates drafts; editors retain full control over published content |
| **Client autonomy** | Maintenance screens for RSS feeds, categories, and prompts — no developer needed for day-to-day changes |
| **Minimal infrastructure** | Single application, lightweight database, hosted in client's existing environment |
| **Dutch-language native** | All AI-generated content, UI labels, and classifications operate in Dutch |

### Workflow at a Glance

```
Google Alerts (RSS) → Ingest & Deduplicate → User Selects Items → AI Classifies & Generates → Draft in Joomla → Editor Reviews & Publishes
```

---

## 5. Value Proposition

### For the Editorial Team
- **80% reduction in manual processing time** for Google Alerts ingestion and article drafting
- Consistent article quality following the established standard pattern
- One-click classification and categorization instead of manual tagging
- Centralized view of all incoming news items, organized by topic

### For the Organization
- **Faster news turnaround** — alerts processed daily instead of accumulating
- Scalable: adding new search terms means adding an RSS feed, not more staff hours
- The investment in AI-generated content infrastructure positions Rookvrije Generatie NL as an innovative nonprofit
- Maintainable by the editorial team without ongoing developer dependency

### AI as a Cost Enabler
By using AI tools during development (detailed in [Section 10](#10-ai-in-development--accelerated-delivery)), we achieve a significant productivity multiplier that allows us to offer this system at a fixed price reflecting our commitment to the nonprofit sector and our investment in building AI agent capabilities.

---

## 6. Functional Scope

### 6.1 In Scope ✅

| # | Feature | Description |
|---|---------|-------------|
| F1 | **RSS feed ingestion** | Scheduled daily ingestion of Google Alerts RSS feeds (matching the current ~12:00 delivery cadence) |
| F2 | **Article extraction** | Extract article metadata (title, source, URL, date) from RSS feed items |
| F3 | **Deduplication** | Identify and group articles from multiple outlets reporting on the same topic |
| F4 | **Paywall detection & fallback** | Detect paywalled content and attempt retrieval via archive.ph, 1ft.io, 12ft.io, and web.archive.org; store both original and archive URLs |
| F5 | **News item dashboard** | Display aggregated and deduplicated items for editorial review and selection |
| F6 | **Item selection** | User selects relevant items (10–20% of total) for article generation |
| F7 | **Auto-classification** | LLM-based binary classification: Domestic / International |
| F8 | **Auto-categorization** | LLM-based category assignment: Government, Politics, Science, Education, Short News, Opinion, Smoke Screen, Association, Press Releases |
| F9 | **Article generation** | LLM-powered generation following the standard pattern: title (≤36 chars), introduction (≤175 chars), narrative summary in HTML, source list in HTML |
| F10 | **Related article search** | Search for additional articles on the same topic from the past month to enrich the source list |
| F11 | **Joomla CMS integration** | Push generated article draft to Joomla CMS via its API |
| F12 | **RSS feed management screen** | Add, edit, remove RSS feed URLs; copy/paste from Google Alerts |
| F13 | **Category management screen** | Add, edit, remove article categories |
| F14 | **Prompt management screen** | View and edit the system prompt used for article generation, so the client can refine output quality without developer involvement |
| F15 | **Article review screen** | Preview generated articles before pushing to Joomla; allow re-generation with adjusted parameters |

### 6.2 Out of Scope ❌

| Item | Rationale |
|------|-----------|
| Processing of professional reports, own projects, or reporting point items | Only Google Alerts (85–90% of volume) is in scope per assignment |
| Social media publishing (Facebook, X, LinkedIn, Instagram, TikTok, Threads) | Out of scope per assignment |
| Photo/image selection and attachment | Images are added manually during the Joomla publication process |
| Replacing Google Alerts with ChatGPT search queries | The relative completeness of this alternative is unclear; Google Alerts RSS is the proven baseline |
| Manual editing interface within the pipeline | Editing occurs in Joomla after draft placement |
| Newsletter assembly and distribution | The newsletter is auto-generated from published website articles by Joomla |
| Post-launch maintenance and changes | Covered by a separate future proposal |
| Hosting infrastructure provisioning | The client provides the hosting environment |

### 6.3 System Boundary

The system's responsibility **begins** at reading RSS feeds and **ends** at placing a draft article in Joomla. Everything after — editing, image attachment, final publication, newsletter generation, and social media distribution — remains the client's existing manual/Joomla workflow.

```
┌─────────────────────────────────────────────────────────────┐
│                  SYSTEM BOUNDARY                            │
│                                                             │
│  Google Alerts ──► RSS Ingest ──► Process ──► Generate      │
│  (RSS feeds)       & Extract      & Select    Article       │
│                                                    │        │
│                                              Draft to       │
│                                              Joomla API     │
│                                                    │        │
└────────────────────────────────────────────────────┼────────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │  Joomla CMS    │
                                            │  (manual edit  │
                                            │   & publish)   │
                                            └────────────────┘
```

---

## 7. System Workflow

The following describes the end-to-end editorial workflow as supported by the system:

### Step 1: RSS Feed Ingestion
The system fetches all configured Google Alerts RSS feeds on a scheduled basis (default: daily at 12:00, matching the current Google Alerts delivery cadence). Each feed corresponds to one of the 16 search terms (smoking, smoker, smoke-free, smoking ban, tobacco, nicotine, cigarette, rolling tobacco, cigar, waterpipe, shisha, vape, e-cigarette, vaping, e-liquid, snus).

### Step 2: Article Extraction & Deduplication
Raw RSS items are parsed to extract metadata: article title, source name, URL, publication date, and snippet. The system identifies clusters of articles reporting on the same story (e.g., multiple outlets covering a new government policy) and groups them as a single topic.

### Step 3: Paywall Detection & Archive Fallback
For each extracted article, the system attempts to access the full content. If a paywall is detected, it sequentially queries archive services:
1. archive.ph
2. 1ft.io
3. 12ft.io
4. web.archive.org

If an accessible version is found, both the original (paywalled) URL and the archive URL are stored. If no accessible version is found, the article is still included with a paywall indicator.

### Step 4: Editorial Dashboard & Selection
The editorial team sees a dashboard of all extracted and deduplicated items, organized by topic. Each item shows the headline, source(s), date, and paywall status. The editor selects items (typically 10–20% of total) that are relevant for publication.

### Step 5: Auto-Classification & Categorization
Selected items are automatically classified by the LLM:
- **Binary classification:** Domestic or International
- **Category assignment:** Government, Politics, Science, Education, Short News, Opinion, Smoke Screen, Association, or Press Releases

The editor can adjust these assignments before proceeding.

### Step 6: Article Generation
For each selected topic, the LLM generates an article draft following the standard pattern:
1. **Source list** — HTML unordered list, sorted by date (newest first), each line showing `Source — Title` as a clickable link opening in a new window
2. **Title** — ≤36 characters, concise summary of the main topic
3. **Introduction** — ≤175 characters, brief summary or lead-in
4. **Narrative summary** — Detailed, fluent summary of all sources, presented in HTML format

The system also searches for related articles from the past month to enrich the source list, following step 2 of the standard pattern.

### Step 7: Review & Push to Joomla
The editor previews the generated article in the pipeline's review screen. They can:
- Accept and push to Joomla as a draft
- Regenerate with different parameters
- Adjust classification/category before pushing

The article is placed in Joomla as a **draft** via the Joomla API, tagged with the assigned category and classification.

### Step 8: Manual Publication (Outside System)
In Joomla, the editor adds photos, makes final edits, and publishes. Published website articles feed automatically into the monthly *Opgelucht* newsletter via Joomla's existing mechanism.

---

## 8. Technical Architecture

### 8.1 Architecture Overview

The system follows a **2-tier architecture**: a SQLite database and a Next.js application that serves as both frontend and backend.

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
│                                                                  │
│   Dashboard    RSS Mgmt    Category Mgmt    Prompt Mgmt          │
│   (React)      (React)     (React)          (React)              │
│                                                                  │
│   Tailwind CSS  ·  React Hook Form  ·  Zod Validation            │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ API Routes  │  │  Server     │  │  Scheduled Jobs          │ │
│  │ (REST)      │  │  Actions    │  │  (RSS fetch, ingestion)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘ │
│         │                │                     │                 │
│  ┌──────▼────────────────▼─────────────────────▼───────────────┐ │
│  │                   SERVICE LAYER                             │ │
│  │                                                             │ │
│  │  RSS Parser  ·  Deduplication  ·  Paywall Resolver          │ │
│  │  LLM Client  ·  Joomla API Client  ·  Article Generator    │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                   DATA ACCESS LAYER                         │ │
│  │              Drizzle ORM (TypeScript-native)                │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   SQLite Database   │
                    │                     │
                    │  · RSS Feeds        │
                    │  · News Items       │
                    │  · Topic Clusters   │
                    │  · Generated Arts   │
                    │  · Categories       │
                    │  · Prompts          │
                    │  · Audit Log        │
                    └─────────────────────┘

              ┌───────────────────────────────┐
              │      EXTERNAL SERVICES        │
              │                               │
              │  · Google Alerts RSS           │
              │  · OpenAI API (GPT)           │
              │  · Archive services            │
              │    (archive.ph, 1ft.io, etc.) │
              │  · Joomla CMS API             │
              └───────────────────────────────┘
```

### 8.2 Technology Choices & Justification

| Technology | Role | Why This Choice |
|------------|------|-----------------|
| **Next.js** | Application framework (frontend + backend) | Single codebase for UI and API; server-side rendering for fast page loads; widely adopted with strong community support; excellent integration with modern AI libraries |
| **SQLite** | Database | Zero-configuration, file-based database ideal for a single-server deployment; no separate database server to maintain; sufficient performance for the expected data volume |
| **Drizzle ORM** | Database access | TypeScript-native ORM with full type safety; clean migration support; lightweight and fast; reduces the risk of runtime errors through compile-time schema validation |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid, consistent UI development; responsive out of the box; minimal CSS overhead |
| **Google Fonts** | Typography | Archivo Black (display/headings), Space Mono (titles), IBM Plex Mono (body/UI) — chosen to reinforce the brutalist design direction |
| **React Hook Form** | Form management | Lightweight form handling with minimal re-renders; integrates seamlessly with Zod for validation; clean API for the management screens |
| **Zod** | Data validation | Runtime validation that mirrors TypeScript types; used on both frontend (form validation) and backend (API input validation); single source of truth for data shape |
| **Vitest** | Testing | Fast, modern test runner optimized for the Vite/Next.js ecosystem; compatible with Jest API; enables quick feedback loops during development |
| **OpenAI API** | LLM integration | Industry-leading language model for content generation; strong Dutch language capabilities; well-documented API; client already has ChatGPT Plus familiarity |

### 8.3 UI Design Direction

The application follows a **Brutalist / Industrial** visual design language, prioritizing clarity, information density, and bold visual hierarchy. This direction was chosen to reflect the utilitarian, no-nonsense nature of a news processing tool — where content is king and the interface stays out of the way.

**Design Reference:** `06-mockups/dashboard-mockup-2-brutalist.html`

| Aspect | Specification |
|--------|---------------|
| **Theme** | Dark background (#0a0a0a), high-contrast light text (#f5f5f0) |
| **Accent Color** | Electric yellow (#e8ff00) for primary actions, selection indicators, and key metrics |
| **Alert Colors** | Red (#ff2d2d) for paywall/blocked, yellow (#e8ff00) for archive-resolved, green (#00ff88) for accessible |
| **Display Font** | Archivo Black — used for headings, stats, and navigation labels |
| **Title Font** | Space Mono — used for cluster titles and emphasized content |
| **Body Font** | IBM Plex Mono — used for metadata, labels, filters, and general UI text |
| **Layout** | Dense grid-based layout with explicit borders, no rounded corners |
| **Spacing** | Tight, utilitarian spacing; information density prioritized over whitespace |
| **Interactions** | Sharp hover states with offset box-shadows (translate + shadow); no soft transitions |
| **Status Indicators** | Bordered text badges with color-coding: green for open, yellow for partial, red for blocked |
| **Navigation** | Tab-style nav with numbered prefixes (e.g., [01] Dashboard) and active state highlight |
| **Buttons** | Uppercase monospace labels, hard borders, brutalist hover effect (translate + shadow) |

This design system applies consistently across all 5 application screens: Editorial Dashboard, Article Review, RSS Feed Management, Category Management, and Prompt Management.

### 8.4 Key Data Entities

| Entity | Description |
|--------|-------------|
| `RssFeed` | Configured RSS feed URLs with search term label and active/inactive status |
| `NewsItem` | Individual extracted article with source, URL, date, content, paywall status, archive URL |
| `TopicCluster` | Group of news items covering the same story |
| `GeneratedArticle` | AI-produced article with title, intro, narrative, source list HTML, classification, category, Joomla push status |
| `Category` | Configurable article category (Government, Politics, Science, etc.) |
| `SystemPrompt` | Versioned prompt template for article generation |
| `AuditLog` | Record of system actions for traceability |

### 8.4 External Integrations

| Integration | Protocol | Purpose |
|-------------|----------|---------|
| Google Alerts | RSS/Atom over HTTPS | Ingest news items |
| OpenAI API | REST API (HTTPS) | Article generation, classification, categorization |
| Archive services | HTTPS | Paywall bypass fallback |
| Joomla CMS | REST API (HTTPS) | Push article drafts |

---

## 9. AI in the Product — Intelligent Content Features

AI is embedded in the product as a core feature across three functional areas:

### 9.1 Article Generation

The LLM generates complete article drafts following the client's established standard pattern. This is the most impactful automation in the system.

**Input to the LLM:**
- Full text of selected source articles (or accessible portions)
- Related articles found from the past month
- The configurable system prompt defining output format and tone

**Output from the LLM:**
- **Title** (≤36 characters) — concise topic summary
- **Introduction** (≤175 characters) — brief lead-in text
- **Narrative summary** — detailed, fluent HTML summary weaving together all sources
- **Source list** — structured HTML with clickable links, sorted by date

**Quality controls:**
- Character limits are enforced programmatically (title ≤36, intro ≤175)
- Source list format is validated against the HTML template requirements
- Links are verified for accessibility
- The editor reviews every generated article before it reaches Joomla

**Example reference:** The "Nee tegen Vapen" article (see [Appendix A](#appendix-a-example-output--nee-tegen-vapen)) demonstrates the quality and format the system will produce — a fluent Dutch narrative, structured chronologically, with a comprehensive source list.

### 9.2 Auto-Classification (Domestic / International)

The LLM analyzes each selected news item and classifies it as:
- **Binnenland** (Domestic) — primarily about Dutch events or policy
- **Buitenland** (International) — about international developments

This is a fixed binary classification. The editor can override the assignment.

### 9.3 Auto-Categorization

The LLM assigns one or more categories from the configured list:
- Overheid (Government)
- Politiek (Politics)
- Wetenschap (Science)
- Onderwijs (Education)
- Kort nieuws (Short News)
- Opinie (Opinion)
- Rookgordijn (Smoke Screen)
- Vereniging (Association)
- Persberichten (Press Releases)

Categories are managed via the maintenance screen, so the client can add or modify categories as their editorial taxonomy evolves. The editor can always adjust the AI-suggested category.

### 9.4 Prompt Management

The system prompt that drives article generation is **not hardcoded**. A dedicated management screen allows the client's editorial team to:
- View the current prompt
- Edit and save new prompt versions
- Keep a history of prompt changes

This design ensures the client can iteratively refine the AI's output quality — adjusting tone, structure, or emphasis — without requiring developer involvement. This is critical because prompt engineering is an iterative process, and the people best positioned to judge output quality are the editors themselves.

---

## 10. AI in Development — Accelerated Delivery

Beyond AI features in the product, we use AI as a **development accelerator** — fundamentally changing how we build the system and enabling a more favorable cost structure.

### 10.1 AI-Assisted Development Practices

| Development Activity | AI Tool | Productivity Impact |
|---|---|---|
| **Code generation** | GitHub Copilot, Claude | Rapid scaffolding of Next.js pages, API routes, and server actions; boilerplate elimination; idiomatic TypeScript generation |
| **Database schema design** | AI-assisted Drizzle ORM schema generation | Type-safe schema definitions generated from natural-language entity descriptions; migration scripts produced automatically |
| **UI development** | AI + Tailwind CSS | Rapid prototyping of dashboard layouts, management screens, and review interfaces from design descriptions |
| **Test generation** | AI + Vitest | Automated generation of unit and integration tests from implementation code; edge case identification |
| **API integration** | AI-assisted code | Joomla API client, RSS parser, and archive service integrators generated with AI guidance; error handling patterns applied consistently |
| **Code review & refactoring** | AI-assisted analysis | Automated identification of code quality issues, security concerns, and performance optimizations |

### 10.2 The Productivity Multiplier

Traditional development of a content pipeline with this feature set would require approximately **200–250 developer hours**. With AI-augmented development, we estimate a **40–50% productivity gain**, reducing effective effort to approximately **120–150 developer hours**.

This productivity gain manifests across the development lifecycle:

- **Design phase:** AI assists in translating requirements into technical specifications, database schemas, and API contracts faster
- **Implementation phase:** Code generation reduces time spent on boilerplate, standard patterns, and integration code
- **Testing phase:** AI-generated tests provide broader coverage in less time
- **Refinement phase:** Faster iteration cycles for prompt engineering and UI polish

### 10.3 Why This Matters for This Proposal

The AI productivity multiplier is a key enabler of the **fixed-price model** we offer. By reducing development effort significantly, we can:

1. Offer a competitive fixed price appropriate for a nonprofit client
2. Absorb the inherent uncertainty of prompt engineering and iterative refinement
3. Invest in quality without timeline pressure
4. Deliver production-grade software in a compressed timeline

This is not about cutting corners — it's about applying the same AI intelligence that powers the product to the process of building it.

---

## 11. Timeline & Milestones

The project is organized into five phases over approximately **8 weeks**:

### Phase 1: Foundation (Weeks 1–2)

| Milestone | Deliverable |
|-----------|-------------|
| M1.1 | Project setup: Next.js application scaffolding, SQLite + Drizzle ORM schema, CI pipeline |
| M1.2 | RSS feed ingestion: scheduled fetching, parsing, and storage of Google Alerts RSS feeds |
| M1.3 | RSS feed management screen: CRUD interface for feed configuration |
| M1.4 | Basic article extraction and metadata storage |

**Client involvement:** Provide RSS feed URLs (converted from email digest); validate feed parsing accuracy.

### Phase 2: Intelligence (Weeks 3–4)

| Milestone | Deliverable |
|-----------|-------------|
| M2.1 | Article deduplication and topic clustering |
| M2.2 | Paywall detection and archive service fallback |
| M2.3 | LLM integration: article generation following the standard pattern |
| M2.4 | LLM integration: auto-classification (Domestic/International) and auto-categorization |
| M2.5 | Prompt management screen |

**Client involvement:** Review AI-generated article quality; provide feedback for prompt refinement; validate classification accuracy.

### Phase 3: Editorial Workflow (Weeks 5–6)

| Milestone | Deliverable |
|-----------|-------------|
| M3.1 | Editorial dashboard: news item aggregation, filtering, and topic-based presentation |
| M3.2 | Item selection workflow with bulk operations |
| M3.3 | Article review screen with preview and regeneration |
| M3.4 | Category management screen |

**Client involvement:** Validate workflow matches editorial needs; test selection and review process.

### Phase 4: Integration & Polish (Week 7)

| Milestone | Deliverable |
|-----------|-------------|
| M4.1 | Joomla CMS API integration: push article drafts with category and classification |
| M4.2 | End-to-end workflow testing |
| M4.3 | UI refinement and responsive design validation |
| M4.4 | Dutch language quality review of AI-generated content |

**Client involvement:** Provide Joomla API credentials and test environment; verify draft articles appear correctly in Joomla.

### Phase 5: Delivery (Week 8)

| Milestone | Deliverable |
|-----------|-------------|
| M5.1 | Deployment to client hosting environment |
| M5.2 | User documentation and editorial guide |
| M5.3 | Knowledge transfer session with editorial team |
| M5.4 | Acceptance testing and sign-off |

**Client involvement:** Provide production hosting environment; participate in acceptance testing; sign-off.

### Timeline Visualization

```
Week  1    2    3    4    5    6    7    8
      ├────┤────┤────┤────┤────┤────┤────┤
      │ Phase 1: Foundation    │
      │ ███████████████████    │
      │         │ Phase 2: Intelligence    │
      │         │ ███████████████████████  │
      │              │         │ Phase 3: Workflow  │
      │              │         │ ████████████████   │
      │              │         │         │ Phase 4  │
      │              │         │         │ ████████ │
      │              │         │         │    Phase5│
      │              │         │         │    ██████│
      │              │         │         │         │
     ▲              ▲                    ▲         ▲
   Kickoff     AI Review           Integration  Sign-off
              (with client)        Demo
```

*Note: Phases overlap intentionally. AI-augmented development enables parallel workstreams.*

---

## 12. Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| D1 | **Working application** | Production-deployed Next.js application with all in-scope features |
| D2 | **Source code** | Complete, documented source code in a Git repository |
| D3 | **Database schema** | SQLite database with Drizzle ORM schema and migrations |
| D4 | **Test suite** | Vitest-based unit and integration tests |
| D5 | **User documentation** | Editorial guide covering daily workflow, management screens, and prompt editing |
| D6 | **Deployment guide** | Instructions for deploying the application to the client's hosting environment |
| D7 | **Knowledge transfer** | Training session (1–2 hours) with the editorial team |
| D8 | **Refined prompts** | Iteratively tuned system prompt for article generation, classification, and categorization |

---

## 13. Acceptance Criteria

The system is considered accepted when all of the following criteria are met:

### Functional Acceptance

| # | Criterion | Verification |
|---|-----------|-------------|
| AC1 | RSS feeds from all 16 Google Alerts search terms are successfully ingested and parsed | Demonstrate ingestion of all configured feeds; verify item count and metadata extraction |
| AC2 | Duplicate articles (same story, different outlets) are correctly grouped | Present three example topics where multiple sources are grouped correctly |
| AC3 | Paywall detection correctly identifies paywalled content and retrieves accessible versions when available | Test with at least 5 known paywalled articles |
| AC4 | The editorial dashboard displays all incoming items, organized by topic | Walk through the dashboard with one day's worth of actual Google Alerts |
| AC5 | Selected items are classified as Domestic/International with ≥80% accuracy | Validate against a set of 20 manually classified items |
| AC6 | Selected items are categorized with ≥75% accuracy | Validate against a set of 20 manually categorized items |
| AC7 | Generated articles follow the standard pattern: title ≤36 chars, intro ≤175 chars, narrative in HTML, source list in HTML with correct formatting | Review 10 generated articles against the standard pattern |
| AC8 | Generated articles are placed as drafts in Joomla with correct category tagging | Verify 5 articles appear correctly in Joomla draft state |
| AC9 | RSS feed management screen allows adding, editing, and removing feeds | Demonstrate CRUD operations |
| AC10 | Category management screen allows adding, editing, and removing categories | Demonstrate CRUD operations |
| AC11 | Prompt management screen allows viewing, editing, and saving prompt versions | Demonstrate prompt editing and verify it affects article generation |

### Non-Functional Acceptance

| # | Criterion | Verification |
|---|-----------|-------------|
| NF1 | The application loads and responds within 3 seconds for standard operations | Spot-check response times during acceptance testing |
| NF2 | The application operates correctly in Dutch (UI labels, AI-generated content) | Visual inspection of all screens and generated content |
| NF3 | The application runs in the client's hosting environment | Demonstrate on production infrastructure |

---

## 14. Assumptions

The following assumptions underpin this proposal. If any assumption proves incorrect, scope, timeline, or cost may need to be revisited.

| # | Assumption |
|---|------------|
| A1 | The client will convert Google Alerts from email digest to RSS feed format in Google Alerts settings before the project starts |
| A2 | The client provides a hosting environment capable of running a Node.js application with SQLite (e.g., a VPS, cloud instance, or container host) |
| A3 | The client provides Joomla CMS API credentials and a test/staging environment for integration testing |
| A4 | The client has or will obtain an OpenAI API key for production use (separate from the existing ChatGPT Plus subscription) |
| A5 | The client makes editorial staff available for feedback during Phases 2, 3, and 5 (estimated 2–4 hours per week) |
| A6 | The existing Joomla CMS has a usable REST API for creating article drafts with category assignment |
| A7 | The 16 Google Alerts search terms are stable throughout the project; new terms can be added post-launch via the management screen |
| A8 | Article generation quality will require iterative prompt refinement — the initial version will not be perfect, but will be systematically improved during Phase 2 |
| A9 | The system will use the OpenAI API (GPT-4 class model) for LLM functionality; the client bears the ongoing API usage costs |

---

## 15. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **Paywall bypass unreliability** — Archive services (archive.ph, 1ft.io, 12ft.io, web.archive.org) may fail or be unavailable for certain sources | High | Medium | Implement a cascading fallback strategy (try each service in order); gracefully degrade by flagging inaccessible articles rather than failing; include both paywalled and non-paywalled URLs when available |
| R2 | **Paywall bypass legal gray area** — Using archive services to bypass paywalls may raise legal questions | Medium | Medium | The system uses publicly available archive services the same way a human editor would; the client already uses this approach manually; document this practice transparently |
| R3 | **AI article quality** — LLM-generated Dutch content may not immediately match editorial standards | High | Medium | Budget explicit prompt refinement time in Phase 2; design the prompt management screen for client self-service iteration; every article passes through human review before publication |
| R4 | **Google Alerts RSS format changes** — Google may change the RSS feed format without notice | Low | High | Implement resilient RSS parsing with format validation; alert the editorial team if parsing failures are detected; the RSS standard is mature and unlikely to change fundamentally |
| R5 | **Joomla CMS API compatibility** — The Joomla API may have limitations or authentication complexity that impacts integration | Medium | High | Investigate the Joomla API early in Phase 1; allocate integration time in Phase 4; if the API is insufficient, fall back to creating articles as structured HTML files for manual import |
| R6 | **Dutch language quality** — GPT models may produce unnatural Dutch phrasing or miss nuances | Medium | Medium | Use Dutch-specific prompt instructions; leverage the client's editorial expertise for feedback; iteratively refine prompts based on real output |
| R7 | **Deduplication accuracy** — Grouping articles about the same topic from different sources is inherently imprecise | Medium | Low | Use a combination of URL similarity, headline comparison, and LLM-assisted topic matching; allow editors to manually merge or split topic groups |
| R8 | **OpenAI API dependency** — Service outages or API changes could disrupt the system | Low | High | Implement retry logic with exponential backoff; design the LLM client as an abstraction layer that could be switched to an alternative provider; articles can be processed later when the API recovers |

---

## 16. Commercial Terms

### 16.1 Pricing Model

This is a **fixed-price engagement**. The price covers the complete design, development, testing, deployment, and knowledge transfer as described in this proposal.

### 16.2 Nonprofit Consideration

We have explicitly accounted for Rookvrije Generatie NL's **nonprofit status** in our pricing. We recognize the societal value of the organization's mission and have made a substantive investment of our own in developing AI agent capabilities. This mutual investment is reflected in the fixed price.

### 16.3 Reference Agreement

In return for the cost reduction, Rookvrije Generatie NL agrees to cooperate in providing a **client reference** that Info Support can use in its marketing and business development activities. This may include:
- A brief written testimonial
- Permission to mention the project in case studies or presentations
- Willingness to participate in a brief reference call if requested by a prospective Info Support client

### 16.4 Ongoing Costs (Client Responsibility)

The following ongoing costs are borne by the client after delivery:
- **Hosting:** Server/cloud infrastructure for the Next.js application and SQLite database
- **OpenAI API usage:** Token consumption for article generation, classification, and categorization (estimated at modest volumes given 4–5 articles/week)
- **Domain and SSL:** If applicable to the pipeline's deployment

### 16.5 Maintenance & Future Development

This proposal covers the initial system development. **Maintenance, bug fixes, feature enhancements, and operational support** after acceptance are not included and will be addressed in a separate proposal upon request.

---

## Appendix A: Example Output — "Nee tegen Vapen"

The following is an example of the article format the system will produce, based on the client's existing standard pattern. This specific article was provided by the client as a reference for desired output quality.

---

**Nee tegen Vapen**

*Maandag 12 mei 2025*


Op 12 mei lanceerde de Nederlandse overheid een campagne en actieplan om het vapegebruik onder jongeren terug te dringen, met strengere regelgeving en voorlichting.

Op 12 maart 2025 presenteerde staatssecretaris Vincent Karremans het "Actieplan tegen vapen" aan de Tweede Kamer. Het plan richt zich op drie speerpunten: versterking van de handhaving tegen illegale vapes, het voorkomen dat jongeren gaan vapen en het stimuleren van stoppen. De Nederlandse Voedsel- en Warenautoriteit (NVWA) krijgt extra middelen en bevoegdheden om de illegale handel aan te pakken. Daarnaast wordt de verhoging van de leeftijdsgrens voor nicotineproducten naar 21 jaar overwogen.

Op 21 maart 2025 pleitte Karremans in Europa voor strengere wetgeving voor vapes, waaronder een smaakjesverbod en plain packaging. Hij kreeg steun van 12 EU-lidstaten voor deze voorstellen.

De campagne *Nee tegen Vapen* start op 12 mei 2025, gericht op ouders van middelbare scholieren, om hen bewust te maken van de gevaren van vapen en te ondersteunen bij gesprekken met hun kinderen.

**Bronnen**
- KNMG — KNMG steunt actieplan tegen vapen
- Rijksoverheid — Karremans pleit in Europa voor veel strengere vapewetgeving
- Longfonds — Actieplan tegen vapen
- Stichting OPEN — Een daadkrachtige aanpak tegen de vapecrisis: tijd voor actie!
- Rijksoverheid — Harder optreden tegen vapes
- Rijksoverheid — Actieplan tegen vapen
- Rijksoverheid — Kamerbrief over actieplan tegen vapen
- NRC — Kabinet wil vapen aanpakken: 'Heeft ten onrechte lang een onschuldig imago gehad'

---

*This example demonstrates the system's target output: a concise title (≤36 chars), a brief introduction (≤175 chars), a fluent Dutch narrative drawing from multiple sources chronologically, and a structured source list with clickable links sorted by date.*

---

## Appendix B: System Architecture Diagram

```
    ┌─────────────────────────────────────────────────────────────┐
    │                     EXTERNAL SERVICES                       │
    │                                                             │
    │  ┌────────────────┐  ┌──────────┐  ┌─────────────────────┐ │
    │  │ Google Alerts   │  │ OpenAI   │  │ Archive Services    │ │
    │  │ (16 RSS Feeds)  │  │ API      │  │ archive.ph          │ │
    │  │                 │  │ (GPT-4)  │  │ 1ft.io / 12ft.io   │ │
    │  │                 │  │          │  │ web.archive.org     │ │
    │  └───────┬─────────┘  └────┬─────┘  └──────────┬──────────┘ │
    └──────────┼─────────────────┼────────────────────┼───────────┘
               │                 │                    │
               ▼                 ▼                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    NEXT.JS APPLICATION                       │
    │                                                             │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │                  FRONTEND (React)                     │   │
    │  │                                                       │   │
    │  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐ │   │
    │  │  │Dashboard │ │RSS Feed  │ │Category│ │  Prompt   │ │   │
    │  │  │& Review  │ │Manage    │ │Manage  │ │  Manage   │ │   │
    │  │  └──────────┘ └──────────┘ └────────┘ └───────────┘ │   │
    │  │                                                       │   │
    │  │  Tailwind CSS · React Hook Form · Zod Validation      │   │
    │  └───────────────────────┬───────────────────────────────┘   │
    │                          │                                   │
    │  ┌───────────────────────▼───────────────────────────────┐   │
    │  │                BACKEND (API + Services)                │   │
    │  │                                                        │   │
    │  │  RSS Ingestion ──► Extraction ──► Deduplication         │   │
    │  │        │                              │                 │   │
    │  │        ▼                              ▼                 │   │
    │  │  Paywall Resolver           Topic Clustering            │   │
    │  │        │                              │                 │   │
    │  │        └──────────┬───────────────────┘                 │   │
    │  │                   ▼                                     │   │
    │  │           LLM Service Layer                             │   │
    │  │     (Generation · Classification · Categorization)      │   │
    │  │                   │                                     │   │
    │  │                   ▼                                     │   │
    │  │          Joomla API Client                              │   │
    │  └───────────────────┬────────────────────────────────────┘   │
    │                      │                                       │
    │  ┌───────────────────▼────────────────────────────────────┐   │
    │  │              DATA ACCESS (Drizzle ORM)                  │   │
    │  └───────────────────┬────────────────────────────────────┘   │
    │                      │                                       │
    └──────────────────────┼───────────────────────────────────────┘
                           │
                  ┌────────▼────────┐         ┌──────────────────┐
                  │  SQLite Database │         │    Joomla CMS    │
                  │                  │         │                  │
                  │ Feeds · Items    │  ─────► │  Draft Articles  │
                  │ Clusters · Arts  │   API   │  (manual edit    │
                  │ Categories       │         │   & publish)     │
                  │ Prompts · Logs   │         │                  │
                  └──────────────────┘         └──────────────────┘
```

---

*This proposal has been prepared by Info Support as a fixed-price offer for Rookvrije Generatie NL. We look forward to discussing this proposal and answering any questions you may have.*

*For questions or clarifications, please contact your Info Support representative.*
