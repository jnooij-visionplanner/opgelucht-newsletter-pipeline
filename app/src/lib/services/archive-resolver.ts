/**
 * Archive Service Fallback Chain
 *
 * Sequentially queries archive services to resolve paywalled URLs.
 * Stops at the first successful resolution.
 *
 * Chain order: archive.ph → 1ft.io → 12ft.io → web.archive.org
 */

export interface ArchiveResult {
  archiveUrl: string | null;
  service: string | null;
  attempted: string[];
  errors: string[];
}

interface ArchiveService {
  name: string;
  buildUrl: (originalUrl: string) => string;
  /** Check if the response indicates the archive exists */
  validate: (response: Response) => boolean;
}

const ARCHIVE_TIMEOUT_MS = 10_000;

const archiveServices: ArchiveService[] = [
  {
    name: "archive.ph",
    buildUrl: (url) => `https://archive.ph/newest/${encodeURIComponent(url)}`,
    validate: (res) => res.ok && !res.url.includes("/submit/"),
  },
  {
    name: "1ft.io",
    buildUrl: (url) => `https://1ft.io/${encodeURIComponent(url)}`,
    validate: (res) => res.ok,
  },
  {
    name: "12ft.io",
    buildUrl: (url) =>
      `https://12ft.io/proxy?q=${encodeURIComponent(url)}`,
    validate: (res) => res.ok,
  },
  {
    name: "web.archive.org",
    buildUrl: (url) => `https://web.archive.org/web/${url}`,
    validate: (res) => res.ok,
  },
];

/**
 * Attempt to resolve a paywalled URL through the archive fallback chain.
 * Returns on first successful resolution.
 */
export async function resolvePaywall(
  originalUrl: string
): Promise<ArchiveResult> {
  const result: ArchiveResult = {
    archiveUrl: null,
    service: null,
    attempted: [],
    errors: [],
  };

  for (const service of archiveServices) {
    result.attempted.push(service.name);
    const archiveCheckUrl = service.buildUrl(originalUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        ARCHIVE_TIMEOUT_MS
      );

      const response = await fetch(archiveCheckUrl, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Opgelucht-Pipeline/1.0 (+https://cleanairnederland.nl)",
        },
      });

      clearTimeout(timeout);

      if (service.validate(response)) {
        // For services that redirect, use the final URL
        const resolvedUrl =
          response.url !== archiveCheckUrl
            ? response.url
            : archiveCheckUrl;

        result.archiveUrl = resolvedUrl;
        result.service = service.name;

        console.log(
          `[Archive] Resolved via ${service.name}: ${originalUrl} → ${resolvedUrl}`
        );
        return result;
      }

      console.log(
        `[Archive] ${service.name}: not available for ${originalUrl}`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`${service.name}: ${message}`);

      console.log(
        `[Archive] ${service.name} error for ${originalUrl}: ${message}`
      );
    }
  }

  console.log(
    `[Archive] No archive found for ${originalUrl} after trying: ${result.attempted.join(", ")}`
  );
  return result;
}

/**
 * Simple heuristic paywall detection based on common paywall indicators.
 * Checks response headers and initial HTML for paywall signals.
 */
export async function detectPaywall(url: string): Promise<boolean> {
  // Known paywalled domains (Dutch news landscape)
  const paywalledDomains = [
    "fd.nl",
    "nrc.nl",
    "volkskrant.nl",
    "telegraaf.nl",
    "ad.nl",
    "parool.nl",
    "trouw.nl",
    "bndestem.nl",
    "bd.nl",
    "destentor.nl",
    "tubantia.nl",
    "gelderlander.nl",
    "pzc.nl",
    "lc.nl",
    "dvhn.nl",
    "ed.nl",
    "wsj.com",
    "ft.com",
    "nytimes.com",
    "washingtonpost.com",
    "bloomberg.com",
    "reuters.com",
    "economist.com",
    "thetimes.co.uk",
  ];

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    // Fast check: known paywalled domains
    if (paywalledDomains.some((domain) => hostname.endsWith(domain))) {
      return true;
    }

    // Slow check: fetch and inspect HTML for paywall indicators
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Opgelucht-Pipeline/1.0)",
      },
    });

    clearTimeout(timeout);

    // Check for 402 Payment Required or paywall redirect
    if (response.status === 402) return true;

    const html = await response.text();
    const lowerHtml = html.slice(0, 10_000).toLowerCase();

    // Check for common paywall patterns in the first 10KB
    const paywallSignals = [
      "paywall",
      "premium-content",
      "subscribe-wall",
      "registration-wall",
      "meter-count",
      "piano-inline-offer",
      "tp-modal",
      "offerpage",
      "c-gate",
      '"isAccessibleForFree":false',
      '"isAccessibleForFree": false',
    ];

    return paywallSignals.some((signal) => lowerHtml.includes(signal));
  } catch {
    // If we can't fetch, assume not paywalled (conservative)
    return false;
  }
}
