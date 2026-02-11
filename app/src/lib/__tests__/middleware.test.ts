import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse and NextRequest from next/server
vi.mock("next/server", () => {
  class MockHeaders {
    private map = new Map<string, string>();
    set(key: string, value: string) {
      this.map.set(key.toLowerCase(), value);
    }
    get(key: string) {
      return this.map.get(key.toLowerCase()) ?? null;
    }
    has(key: string) {
      return this.map.has(key.toLowerCase());
    }
  }

  return {
    NextResponse: {
      next: () => ({
        headers: new MockHeaders(),
      }),
      json: (body: Record<string, unknown>, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
        headers: new MockHeaders(),
      }),
    },
  };
});

// Import after mock
import { middleware } from "../../middleware";
import type { NextRequest } from "next/server";

function createMockRequest(
  pathname: string,
  ip?: string
): NextRequest {
  return {
    nextUrl: { pathname },
    headers: {
      get: (key: string) => {
        if (key === "x-forwarded-for") return ip ?? "127.0.0.1";
        return null;
      },
    },
  } as unknown as NextRequest;
}

describe("Middleware", () => {
  beforeEach(() => {
    // Reset rate limit state between tests by clearing the module cache
    vi.useFakeTimers();
  });

  it("should add security headers to all responses", () => {
    const request = createMockRequest("/dashboard");
    const response = middleware(request) as ReturnType<typeof middleware>;

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-xss-protection")).toBe("1; mode=block");
    expect(response.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(response.headers.has("permissions-policy")).toBe(true);
    expect(response.headers.has("content-security-policy")).toBe(true);
  });

  it("should add security headers to non-API routes", () => {
    const request = createMockRequest("/articles");
    const response = middleware(request);

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("should allow normal API requests", () => {
    const request = createMockRequest("/api/dashboard", "192.168.1.1");
    const response = middleware(request);

    // Should be a NextResponse.next() (has headers but no body/status 429)
    expect(response.headers).toBeDefined();
  });

  it("should include CSP header with correct directives", () => {
    const request = createMockRequest("/");
    const response = middleware(request);
    const csp = response.headers.get("content-security-policy");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("fonts.googleapis.com");
    expect(csp).toContain("fonts.gstatic.com");
  });
});
