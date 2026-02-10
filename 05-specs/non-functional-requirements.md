# Non-Functional Requirements Document (NFRD)

**Project:** Opgelucht Content Pipeline  
**Client:** Rookvrije Generatie NL  
**Version:** 1.0  
**Date:** February 10, 2026

---

## 1. Performance

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-001** | **Page Load Speed**<br>Key user interfaces (Dashboard, Review Screen) must render initial content quickly. | ≤ 3.0 seconds (Time to Interactive) | Must | Lighthouse / Chrome DevTools |
| **NFR-002** | **RSS Ingestion Time**<br>The system must complete the processing of all 16 RSS feeds (fetch, parse, deduplicate) within a reasonable window to ensure data freshness. | ≤ 10 minutes total processing time | Must | Server logs timestamp analysis |
| **NFR-003** | **Generation Response**<br>Single article generation (LLM call) should return a result or status update promptly. | ≤ 60 seconds (variable on OpenAI latency) | Should | System observation |
| **NFR-004** | **Concurrent Users**<br>The system must support the editorial team working simultaneously. | Up to 5 concurrent editors | Must | Load testing (simulated) |

## 2. Scalability

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-005** | **Feed Expansion**<br>The system must support adding new RSS feeds without code changes or significant performance degradation, up to a reasonable limit. | Support 50+ feeds (current: 16) | Must | Configuration test |
| **NFR-006** | **Data Volume**<br>The SQLite database must handle growing content history without drastic query slowdowns over the project's expected lifespan. | Support >100k items / 5 years history | Must | Database sizing analysis |

## 3. Reliability & Availability

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-007** | **Graceful Degradation (Paywalls)**<br>If archive services are unreachable, the system must not crash. It should continue processing the item with the original URL only and flag it. | 100% of failures handled gracefully | Must | Fault injection testing |
| **NFR-008** | **Graceful Degradation (OpenAI)**<br>If the OpenAI API is unavailable or returns 5xx errors, the system must retry with exponential backoff before failing the specific task. | 3 retries (e.g., 2s, 4s, 8s) | Must | Fault injection testing |
| **NFR-009** | **Uptime**<br>The application should be available during editorial working hours (08:00 - 18:00 CET). | 99.5% availability during business hours | Should | Uptime monitoring |
| **NFR-010** | **RSS Parsing Resilience**<br>Malformed items in a single RSS feed should not prevent the ingestion of valid items from that feed or other feeds. | Isolate failures to item integration | Must | Unit tests with malformed XML |

## 4. Security

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-011** | **Secret Management**<br>API keys (OpenAI, Joomla) must be stored securely (e.g., environment variables) and never exposed to the client-side browser or committed to version control. | No secrets in repo or client bundles | Must | Code review / Secret scanning |
| **NFR-012** | **Authentication**<br>Access to the editorial dashboard and management screens must be protected (e.g., Basic Auth or NextAuth.js configured for client). | Unauthorized users cannot access URLs | Must | Penetration testing |
| **NFR-013** | **Input Validation**<br>All external inputs (RSS feeds, form data) must be validated using Zod schemas to prevent XSS or injection attacks. | 100% of inputs validated | Must | Code review (Zod usage) |
| **NFR-014** | **Secure Transport**<br>All external API communications (OpenAI, Joomla, Feeds) must use HTTPS. | Force HTTPS | Must | Network traffic analysis |

## 5. Usability

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-015** | **Language**<br>All user interfaces, labels, error messages, and buttons must be in Dutch. | 100% Dutch text | Must | Visual inspection |
| **NFR-016** | **Ease of Use**<br>The editorial workflow (Select -> Review -> Push) should be intuitive enough to require minimal training. | < 2 hours transfer time | Must | User testing with editor |
| **NFR-017** | **Clarity of Status**<br>The system must clearly indicate the state of an item (New, Selected, Generated, Pushed, Failed). | Status visible on all items | Must | UI Review |
| **NFR-017a** | **Design System Consistency**<br>All screens must follow the Brutalist / Industrial design direction as defined in the project proposal (Section 8.3) and reference mockup `06-mockups/dashboard-mockup-2-brutalist.html`. | Consistent dark theme, yellow accent palette, monospace typography across all screens | Must | Visual design review |

## 6. Maintainability

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-018** | **Client Autonomy**<br>Editors must be able to change RSS feeds, Category lists, and System Prompts without developer intervention/code deployment. | Screens exist for these functions | Must | Functional testing |
| **NFR-019** | **Code Quality**<br>The codebase must use TypeScript with strict mode enabled and Drizzle ORM for type-safe database access. | No implicit `any`, 0 type errors | Must | TSC check, linting |
| **NFR-020** | **Modular Architecture**<br>Service layer logic (LLM, Parsing) must be decoupled from API routes for easier testing and future replacement. | Separation of concerns | Should | Architecture review |

## 7. Portability & Deployment

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-021** | **Hosting Environment**<br>The application must run as a standalone Node.js application (using Next.js) on client-provided infrastructure. | Running on node:18/20+ | Must | Deployment test |
| **NFR-022** | **Database Dependence**<br>The system must rely solely on SQLite (file-based) and not require an external database server (Postgres/MySQL). | Zero external DB dependency | Must | Architecture verification |
| **NFR-023** | **Single Artifact**<br>The system should be deployable as a cohesive unit (code + initial DB schema). | Single build/start command | Must | Build process review |

## 8. Compliance & Legal

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-024** | **Audit Logging**<br>Key actions (Generation, Push to Joomla, Prompt Edit) should be logged to the database for traceability. | Log entires exist for actions | Should | DB inspection |
| **NFR-025** | **Transparency**<br>The use of archive services should be transparent in the system logic (i.e., we are accessing public archives). | Code logic clear | Must | Code review |

## 9. Localization

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-026** | **Content Language**<br>AI-generated content must be in Dutch. | Dutch output | Must | Content review |
| **NFR-027** | **Date Formats**<br>Dates displayed in the UI and generated articles must follow Dutch conventions (e.g., "maandag 12 mei 2025"). | Dutch locale formatting | Must | UI review |

## 10. Testability

| ID | Requirement | Target | Priority | Verification |
|----|-------------|--------|----------|--------------|
| **NFR-028** | **Automated Testing**<br>The project must include a Vitest test suite covering core service logic (Parsing, Deduplication logic). | Pass all tests | Must | CI execution |
| **NFR-029** | **Seed Data**<br>The repository should include seed scripts or mock data to allow developers/testers to run the dashboard without live Google Alerts. | `npm run seed` works | Must | Developer workflow test |
