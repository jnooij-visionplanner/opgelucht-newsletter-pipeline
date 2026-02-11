"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────

interface DashboardStats {
  totalItems: number;
  clusters: number;
  paywalled: number;
  resolved: number;
  unresolved: number;
}

interface NewsItemSummary {
  id: number;
  title: string;
  originalUrl: string;
  sourceName: string | null;
  publishedDate: string;
  isPaywalled: boolean;
  archiveUrl: string | null;
  resolvedContent: boolean;
}

interface ClusterData {
  id: number;
  title: string;
  primaryDate: string | null;
  items: NewsItemSummary[];
}

interface DashboardData {
  stats: DashboardStats;
  clusters: ClusterData[];
  unclusteredItems: NewsItemSummary[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function getPaywallStatus(items: NewsItemSummary[]): "open" | "partial" | "blocked" {
  const paywalled = items.filter((i) => i.isPaywalled);
  if (paywalled.length === 0) return "open";
  const resolved = paywalled.filter((i) => i.archiveUrl || i.resolvedContent);
  if (resolved.length === paywalled.length) return "open";
  if (resolved.length > 0) return "partial";
  return "blocked";
}

function statusLabel(s: "open" | "partial" | "blocked"): string {
  return s === "open" ? "Open" : s === "partial" ? "Deels" : "Paywall";
}

function statusClass(s: "open" | "partial" | "blocked"): string {
  return s === "open"
    ? "border-[#00ff88] text-[#00ff88]"
    : s === "partial"
      ? "border-[#e8ff00] text-[#e8ff00]"
      : "border-[#ff2d2d] text-[#ff2d2d]";
}

function sourceTagClass(item: NewsItemSummary): string {
  if (item.isPaywalled && !(item.archiveUrl || item.resolvedContent)) {
    return "border-[#ff2d2d] text-[#ff2d2d]";
  }
  if (item.isPaywalled && (item.archiveUrl || item.resolvedContent)) {
    return "border-[#e8ff00] text-[#e8ff00]";
  }
  return "border-[#444] text-[#888]";
}

function sourceTagSuffix(item: NewsItemSummary): string {
  if (item.isPaywalled && (item.archiveUrl || item.resolvedContent)) return " ⟳";
  if (item.isPaywalled) return " ✕";
  return "";
}

// ── Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClusters, setSelectedClusters] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [merging, setMerging] = useState(false);
  const [splitting, setSplitting] = useState<number | null>(null);
  const [splitConfig, setSplitConfig] = useState<{ title: string; itemIds: number[] }[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setStatusMessage({ text: "Dashboard data kon niet worden geladen.", type: "error" });
      }
    } catch {
      setStatusMessage({ text: "Dashboard data kon niet worden geladen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Selection ────────────────────────────────────────────────────────

  const toggleCluster = (id: number) => {
    setSelectedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    if (selectedClusters.size === data.clusters.length) {
      setSelectedClusters(new Set());
    } else {
      setSelectedClusters(new Set(data.clusters.map((c) => c.id)));
    }
  };

  const totalSelectedSources = data
    ? data.clusters
        .filter((c) => selectedClusters.has(c.id))
        .reduce((sum, c) => sum + c.items.length, 0)
    : 0;

  // ── Actions ──────────────────────────────────────────────────────────

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleGenerate = async () => {
    if (selectedClusters.size === 0) return;
    setGenerating(true);
    let success = 0;
    let failed = 0;

    for (const clusterId of selectedClusters) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clusterId }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setGenerating(false);
    setSelectedClusters(new Set());

    if (failed === 0) {
      showStatus(`${success} artikel(en) gegenereerd`, "success");
    } else {
      showStatus(`${success} gegenereerd, ${failed} mislukt`, "error");
    }
    loadData();
  };

  const handleMerge = async () => {
    if (selectedClusters.size < 2) {
      showStatus("Selecteer minimaal 2 clusters om samen te voegen", "error");
      return;
    }
    setMerging(true);
    try {
      const res = await fetch("/api/clusters/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterIds: Array.from(selectedClusters) }),
      });
      if (res.ok) {
        showStatus("Clusters samengevoegd", "success");
        setSelectedClusters(new Set());
        loadData();
      } else {
        const err = await res.json();
        showStatus(err.error || "Samenvoegen mislukt", "error");
      }
    } catch {
      showStatus("Samenvoegen mislukt", "error");
    } finally {
      setMerging(false);
    }
  };

  const openSplit = (cluster: ClusterData) => {
    if (cluster.items.length < 2) {
      showStatus("Cluster heeft minimaal 2 items nodig om te splitsen", "error");
      return;
    }
    setSplitting(cluster.id);
    // Initialize with 2 empty groups
    setSplitConfig([
      { title: "", itemIds: [] },
      { title: "", itemIds: [] },
    ]);
  };

  const handleSplit = async () => {
    if (!splitting) return;
    const validGroups = splitConfig.filter((g) => g.title && g.itemIds.length > 0);
    if (validGroups.length < 2) {
      showStatus("Elk cluster moet een titel en items bevatten", "error");
      return;
    }

    try {
      const res = await fetch("/api/clusters/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterId: splitting,
          newClusters: validGroups,
        }),
      });
      if (res.ok) {
        showStatus("Cluster gesplitst", "success");
        setSplitting(null);
        setSplitConfig([]);
        setSelectedClusters(new Set());
        loadData();
      } else {
        const err = await res.json();
        showStatus(err.error || "Splitsen mislukt", "error");
      }
    } catch {
      showStatus("Splitsen mislukt", "error");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-[family-name:var(--font-body)] text-[#888] text-sm uppercase tracking-widest animate-pulse">
          Dashboard laden...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-12">
        <p className="text-[#ff2d2d] font-[family-name:var(--font-body)] text-sm">
          Dashboard data kon niet worden geladen.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Items opgehaald", value: data.stats.totalItems, color: "#f5f5f0" },
    { label: "Clusters", value: data.stats.clusters, color: "#e8ff00" },
    { label: "Paywalled", value: data.stats.paywalled, color: "#ff2d2d" },
    { label: "Archief opgelost", value: data.stats.resolved, color: "#00ff88" },
    { label: "Onopgelost", value: data.stats.unresolved, color: "#888" },
  ];

  return (
    <div className="min-h-screen">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 border-2 font-[family-name:var(--font-body)] text-xs uppercase tracking-wider
            ${statusMessage.type === "success" ? "border-[#00ff88] text-[#00ff88] bg-[#0a0a0a]" : "border-[#ff2d2d] text-[#ff2d2d] bg-[#0a0a0a]"}`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-5 border-b-2 border-[#444]">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-6 py-4 border-r border-[#444] last:border-r-0 uppercase"
          >
            <p
              className="font-[family-name:var(--font-display)] text-3xl leading-none"
              style={{ color: stat.color }}
            >
              {stat.value.toString().padStart(2, "0")}
            </p>
            <p className="font-[family-name:var(--font-body)] text-[0.65rem] tracking-[0.12em] text-[#888] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-[#444] bg-[#2a2a2a]">
        <div className="flex items-center gap-6">
          <input
            type="checkbox"
            checked={data.clusters.length > 0 && selectedClusters.size === data.clusters.length}
            onChange={selectAll}
            className="w-5 h-5 appearance-none border-2 border-[#e8ff00] bg-transparent cursor-pointer relative
              checked:bg-[#e8ff00] checked:after:content-['×'] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2
              checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-[#0a0a0a] checked:after:font-bold checked:after:text-base"
          />
          <span className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-[0.1em] text-[#888]">
            Selecteer alles
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMerge}
            disabled={selectedClusters.size < 2 || merging}
            className="px-5 py-2 font-[family-name:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-wider
              border-2 border-[#444] bg-transparent text-[#f5f5f0] cursor-pointer transition-all duration-100
              hover:border-[#f5f5f0] hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_#f5f5f0]
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:border-[#444]"
          >
            {merging ? "Samenvoegen..." : "Samenvoegen"}
          </button>
          <button
            onClick={() => {
              if (selectedClusters.size === 1) {
                const clusterId = Array.from(selectedClusters)[0];
                const cluster = data.clusters.find((c) => c.id === clusterId);
                if (cluster) openSplit(cluster);
              } else {
                showStatus("Selecteer 1 cluster om te splitsen", "error");
              }
            }}
            disabled={selectedClusters.size !== 1}
            className="px-5 py-2 font-[family-name:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-wider
              border-2 border-[#444] bg-transparent text-[#f5f5f0] cursor-pointer transition-all duration-100
              hover:border-[#f5f5f0] hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_#f5f5f0]
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:border-[#444]"
          >
            Splitsen
          </button>
          <button
            onClick={handleGenerate}
            disabled={selectedClusters.size === 0 || generating}
            className="px-5 py-2 font-[family-name:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-wider
              border-2 border-[#e8ff00] bg-transparent text-[#e8ff00] cursor-pointer transition-all duration-100
              hover:bg-[#e8ff00] hover:text-[#0a0a0a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#e8ff00]
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#e8ff00]
              disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {generating ? "Genereren..." : "→ Genereer"}
          </button>
        </div>
      </div>

      {/* Main Grid: Cluster list + Sidebar */}
      <div className="grid grid-cols-[1fr_300px]">
        {/* Cluster List */}
        <div>
          <div className="px-8 py-3 font-[family-name:var(--font-display)] text-[0.8rem] uppercase tracking-[0.15em] text-[#e8ff00] border-b border-[#444] bg-[rgba(232,255,0,0.03)]">
            // Nieuwsclusters — {data.clusters.length} totaal
          </div>

          {data.clusters.length === 0 ? (
            <div className="px-8 py-12">
              <p className="text-[#888] font-[family-name:var(--font-body)] text-sm">
                Geen clusters gevonden. Voer eerst clustering uit via het clusters endpoint.
              </p>
            </div>
          ) : (
            data.clusters.map((cluster) => {
              const selected = selectedClusters.has(cluster.id);
              const status = getPaywallStatus(cluster.items);

              return (
                <div
                  key={cluster.id}
                  className={`grid grid-cols-[40px_60px_1fr_120px] border-b border-[#444] transition-all duration-100 hover:bg-[#2a2a2a]
                    ${selected ? "bg-[rgba(232,255,0,0.05)] border-l-[3px] border-l-[#e8ff00]" : ""}`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center py-4 border-r border-[#444]">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCluster(cluster.id)}
                      className="w-5 h-5 appearance-none border-2 border-[#e8ff00] bg-transparent cursor-pointer relative
                        checked:bg-[#e8ff00] checked:after:content-['×'] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2
                        checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-[#0a0a0a] checked:after:font-bold checked:after:text-base"
                    />
                  </div>

                  {/* Item count */}
                  <div className="flex items-center justify-center py-4 border-r border-[#444] font-[family-name:var(--font-display)] text-xl text-[#e8ff00]">
                    {cluster.items.length}
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 border-r border-[#444]">
                    <p className="font-[family-name:var(--font-title)] text-sm font-bold leading-snug mb-1">
                      {cluster.title}
                    </p>
                    <div className="flex items-center gap-4 font-[family-name:var(--font-body)] text-[0.68rem] text-[#888] uppercase tracking-wider mb-2">
                      <span>{formatDate(cluster.primaryDate)}</span>
                      <span>{cluster.items.length} bronnen</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.items.map((item) => (
                        <span
                          key={item.id}
                          className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider border ${sourceTagClass(item)}`}
                          title={item.title}
                        >
                          {item.sourceName || "Onbekend"}
                          {sourceTagSuffix(item)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-center justify-center py-4 gap-1">
                    <span
                      className={`text-[0.65rem] uppercase tracking-[0.1em] px-2.5 py-0.5 font-semibold border ${statusClass(status)}`}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Unclustered Items */}
          {data.unclusteredItems.length > 0 && (
            <>
              <div className="px-8 py-3 font-[family-name:var(--font-display)] text-[0.8rem] uppercase tracking-[0.15em] text-[#888] border-b border-[#444] bg-[rgba(255,255,255,0.02)]">
                // Ongeclusterd — {data.unclusteredItems.length} items
              </div>
              {data.unclusteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[40px_60px_1fr_120px] border-b border-[#333] opacity-60"
                >
                  <div className="py-3 border-r border-[#333]" />
                  <div className="flex items-center justify-center py-3 border-r border-[#333] font-[family-name:var(--font-body)] text-xs text-[#888]">
                    —
                  </div>
                  <div className="px-6 py-3 border-r border-[#333]">
                    <p className="font-[family-name:var(--font-body)] text-xs leading-snug text-[#888]">
                      {item.title}
                    </p>
                    <p className="font-[family-name:var(--font-body)] text-[0.6rem] text-[#666] mt-1">
                      {item.sourceName || "Onbekend"} — {formatDate(item.publishedDate)}
                    </p>
                  </div>
                  <div className="py-3" />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="border-l-2 border-[#444] bg-[#2a2a2a]">
          {/* Selection */}
          <div className="p-5 border-b border-[#444]">
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Selectie
            </p>
            <p className="font-[family-name:var(--font-display)] text-5xl text-[#e8ff00] leading-none">
              {selectedClusters.size}
            </p>
            <p className="font-[family-name:var(--font-body)] text-[0.65rem] uppercase tracking-[0.1em] text-[#888] mt-1">
              Clusters geselecteerd
            </p>
            <p className="font-[family-name:var(--font-body)] text-[0.65rem] uppercase tracking-[0.1em] text-[#888] mt-0.5">
              {totalSelectedSources} bronnen totaal
            </p>
            <button
              onClick={handleGenerate}
              disabled={selectedClusters.size === 0 || generating}
              className="w-full mt-4 py-3 font-[family-name:var(--font-display)] text-[0.82rem] uppercase tracking-[0.1em]
                border-[3px] border-[#e8ff00] bg-transparent text-[#e8ff00] cursor-pointer transition-all duration-150
                hover:bg-[#e8ff00] hover:text-[#0a0a0a] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(232,255,0,0.3)]
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#e8ff00]
                disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {generating ? "Genereren..." : "→ Genereer artikelen"}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="p-5 border-b border-[#444]">
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Statistieken
            </p>
            {[
              { label: "Totaal items", val: data.stats.totalItems },
              { label: "Clusters", val: data.stats.clusters },
              { label: "Paywalled", val: data.stats.paywalled },
              { label: "Via archief", val: data.stats.resolved },
              { label: "Onopgelost", val: data.stats.unresolved },
            ].map((s) => (
              <div
                key={s.label}
                className="flex justify-between py-1.5 font-[family-name:var(--font-body)] text-[0.72rem] border-b border-[rgba(255,255,255,0.05)]"
              >
                <span className="text-[#888]">{s.label}</span>
                <span className="font-bold text-[#e8ff00]">{s.val}</span>
              </div>
            ))}
          </div>

          {/* Articles Link */}
          <div className="p-5">
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Artikelen
            </p>
            <a
              href="/articles"
              className="block w-full py-2.5 text-center font-[family-name:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-wider
                border-2 border-[#444] text-[#f5f5f0] transition-all duration-100
                hover:border-[#f5f5f0] hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_#f5f5f0]"
            >
              Bekijk gegenereerde artikelen →
            </a>
          </div>
        </aside>
      </div>

      {/* Split Modal */}
      {splitting && (
        <SplitModal
          cluster={data.clusters.find((c) => c.id === splitting)!}
          config={splitConfig}
          onConfigChange={setSplitConfig}
          onConfirm={handleSplit}
          onCancel={() => {
            setSplitting(null);
            setSplitConfig([]);
          }}
        />
      )}
    </div>
  );
}

// ── Split Modal Component ──────────────────────────────────────────────

function SplitModal({
  cluster,
  config,
  onConfigChange,
  onConfirm,
  onCancel,
}: {
  cluster: ClusterData;
  config: { title: string; itemIds: number[] }[];
  onConfigChange: (c: { title: string; itemIds: number[] }[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const assignItem = (itemId: number, groupIndex: number) => {
    const next = config.map((g, i) => ({
      ...g,
      itemIds:
        i === groupIndex
          ? [...g.itemIds, itemId]
          : g.itemIds.filter((id) => id !== itemId),
    }));
    onConfigChange(next);
  };

  const unassignedItems = cluster.items.filter(
    (item) => !config.some((g) => g.itemIds.includes(item.id))
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
      <div className="bg-[#1a1a1a] border-2 border-[#e8ff00] max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#444]">
          <h2 className="font-[family-name:var(--font-display)] text-lg uppercase">
            Cluster splitsen
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[#888] mt-1">
            Verdeel &ldquo;{cluster.title}&rdquo; in meerdere clusters
          </p>
        </div>

        {/* Unassigned items */}
        {unassignedItems.length > 0 && (
          <div className="px-6 py-4 border-b border-[#444]">
            <p className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-wider text-[#888] mb-2">
              Niet-toegewezen items ({unassignedItems.length})
            </p>
            {unassignedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-1.5">
                <span className="font-[family-name:var(--font-body)] text-xs flex-1 text-[#f5f5f0]">
                  {item.title}
                </span>
                <div className="flex gap-1">
                  {config.map((_, gi) => (
                    <button
                      key={gi}
                      onClick={() => assignItem(item.id, gi)}
                      className="px-2 py-0.5 text-[0.65rem] border border-[#444] text-[#888] hover:border-[#e8ff00] hover:text-[#e8ff00] transition-colors"
                    >
                      →{gi + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Groups */}
        {config.map((group, gi) => (
          <div key={gi} className="px-6 py-4 border-b border-[#444]">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-[family-name:var(--font-display)] text-sm text-[#e8ff00]">
                Cluster {gi + 1}
              </span>
              <input
                type="text"
                value={group.title}
                onChange={(e) => {
                  const next = [...config];
                  next[gi] = { ...next[gi], title: e.target.value };
                  onConfigChange(next);
                }}
                placeholder="Titel..."
                className="flex-1 px-3 py-1.5 bg-transparent border border-[#444] text-[#f5f5f0]
                  font-[family-name:var(--font-body)] text-xs focus:border-[#e8ff00] focus:outline-none"
              />
            </div>
            {group.itemIds.length === 0 ? (
              <p className="text-[#666] font-[family-name:var(--font-body)] text-xs">
                Geen items toegewezen
              </p>
            ) : (
              group.itemIds.map((itemId) => {
                const item = cluster.items.find((i) => i.id === itemId);
                return (
                  <div key={itemId} className="flex items-center gap-2 py-1">
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#f5f5f0] flex-1">
                      {item?.title || `Item #${itemId}`}
                    </span>
                    <button
                      onClick={() => {
                        const next = [...config];
                        next[gi] = {
                          ...next[gi],
                          itemIds: next[gi].itemIds.filter((id) => id !== itemId),
                        };
                        onConfigChange(next);
                      }}
                      className="text-[#ff2d2d] text-xs hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ))}

        {/* Add group button */}
        <div className="px-6 py-3 border-b border-[#444]">
          <button
            onClick={() => onConfigChange([...config, { title: "", itemIds: [] }])}
            className="font-[family-name:var(--font-body)] text-xs text-[#888] hover:text-[#e8ff00] transition-colors uppercase tracking-wider"
          >
            + Cluster toevoegen
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
              border-2 border-[#444] text-[#888] hover:border-[#f5f5f0] hover:text-[#f5f5f0] transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
              border-2 border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a] transition-all"
          >
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
}
