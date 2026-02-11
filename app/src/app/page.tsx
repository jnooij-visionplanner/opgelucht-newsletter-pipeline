import { db } from "@/db";
import { rssFeeds } from "@/db/schema/rss-feeds";
import { newsItems } from "@/db/schema/news-items";
import { fetchLogs } from "@/db/schema/fetch-logs";
import { eq, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function Home() {
  // Fetch stats
  const totalFeeds = db.select({ count: count() }).from(rssFeeds).get()?.count ?? 0;
  const activeFeeds = db
    .select({ count: count() })
    .from(rssFeeds)
    .where(eq(rssFeeds.isActive, true))
    .get()?.count ?? 0;
  const totalItems = db.select({ count: count() }).from(newsItems).get()?.count ?? 0;
  const recentLogs = db
    .select()
    .from(fetchLogs)
    .orderBy(desc(fetchLogs.completedAt))
    .limit(5)
    .all();

  const stats = [
    { label: "Feeds totaal", value: totalFeeds, color: "#f5f5f0" },
    { label: "Feeds actief", value: activeFeeds, color: "#00ff88" },
    { label: "Nieuwsitems", value: totalItems, color: "#e8ff00" },
    { label: "Fetch logs", value: recentLogs.length, color: "#888" },
  ];

  return (
    <div className="min-h-screen">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 border-b-2 border-[#444]">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-8 py-6 border-r border-[#444] last:border-r-0"
          >
            <p className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p
              className="font-[family-name:var(--font-display)] text-4xl"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Fetch Activity */}
      <div className="px-8 py-6">
        <h3 className="font-[family-name:var(--font-title)] text-sm font-bold uppercase tracking-wider mb-4">
          Recente fetch activiteit
        </h3>
        {recentLogs.length === 0 ? (
          <p className="text-[#888] text-sm font-[family-name:var(--font-body)]">
            Nog geen fetch activiteit. Voeg feeds toe en start een fetch.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#444]">
                <th className="text-left py-2 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
                  Status
                </th>
                <th className="text-left py-2 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
                  Items
                </th>
                <th className="text-left py-2 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
                  Nieuw
                </th>
                <th className="text-left py-2 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
                  Duplicaten
                </th>
                <th className="text-left py-2 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
                  Tijdstip
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a]"
                >
                  <td className="py-2 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider border font-[family-name:var(--font-body)]
                        ${
                          log.status === "success"
                            ? "border-[#00ff88] text-[#00ff88]"
                            : log.status === "partial"
                              ? "border-[#e8ff00] text-[#e8ff00]"
                              : "border-[#ff2d2d] text-[#ff2d2d]"
                        }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 font-[family-name:var(--font-body)] text-sm">
                    {log.itemsFetched}
                  </td>
                  <td className="py-2 px-4 font-[family-name:var(--font-body)] text-sm text-[#00ff88]">
                    +{log.itemsInserted}
                  </td>
                  <td className="py-2 px-4 font-[family-name:var(--font-body)] text-sm text-[#888]">
                    {log.duplicatesSkipped}
                  </td>
                  <td className="py-2 px-4 font-[family-name:var(--font-body)] text-xs text-[#888]">
                    {log.completedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
