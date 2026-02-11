"use client";

import { useState, useEffect, useCallback } from "react";

interface RssFeed {
  id: number;
  url: string;
  searchTermLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RssFeedsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const loadFeeds = useCallback(async () => {
    try {
      const res = await fetch("/api/feeds");
      if (res.ok) {
        const data = await res.json();
        setFeeds(data);
      }
    } catch {
      console.error("Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const resetForm = () => {
    setFormUrl("");
    setFormLabel("");
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingId !== null) {
        // Update existing
        const res = await fetch(`/api/feeds/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: formUrl,
            searchTermLabel: formLabel,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Failed to update feed");
          return;
        }
      } else {
        // Create new
        const res = await fetch("/api/feeds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: formUrl,
            searchTermLabel: formLabel,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Failed to create feed");
          return;
        }
      }

      resetForm();
      loadFeeds();
    } catch {
      setFormError("Network error");
    }
  };

  const handleEdit = (feed: RssFeed) => {
    setEditingId(feed.id);
    setFormUrl(feed.url);
    setFormLabel(feed.searchTermLabel);
    setFormError(null);
    setShowForm(true);
  };

  const handleDeactivate = async (feedId: number) => {
    if (!confirm("Weet je zeker dat je deze feed wilt deactiveren?")) return;

    try {
      const res = await fetch(`/api/feeds/${feedId}`, { method: "DELETE" });
      if (res.ok) {
        loadFeeds();
      }
    } catch {
      console.error("Failed to deactivate feed");
    }
  };

  const handleReactivate = async (feedId: number) => {
    try {
      const res = await fetch(`/api/feeds/${feedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        loadFeeds();
      }
    } catch {
      console.error("Failed to reactivate feed");
    }
  };

  const handleFetchAll = async () => {
    setIsFetching(true);
    setFetchStatus("Fetching feeds...");

    try {
      const res = await fetch("/api/feeds/fetch", { method: "POST" });
      const data = await res.json();

      if (res.ok || res.status === 207) {
        setFetchStatus(
          `Klaar: ${data.totalItemsFetched} items opgehaald, ` +
            `${data.totalItemsInserted} nieuw, ` +
            `${data.totalDuplicatesSkipped} duplicaten overgeslagen` +
            (data.errors?.length > 0
              ? ` (${data.errors.length} fouten)`
              : "")
        );
      } else {
        setFetchStatus(`Fout: ${data.error || "Onbekende fout"}`);
      }
    } catch {
      setFetchStatus("Netwerkfout bij ophalen feeds");
    } finally {
      setIsFetching(false);
    }
  };

  const activeFeeds = feeds.filter((f) => f.isActive);
  const inactiveFeeds = feeds.filter((f) => !f.isActive);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#444] bg-[#2a2a2a]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
            RSS Feed Management
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[#888] uppercase tracking-widest mt-1">
            {activeFeeds.length} actief — {inactiveFeeds.length} inactief —{" "}
            {feeds.length} totaal
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleFetchAll}
            disabled={isFetching}
            className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                       border-2 border-[#444] text-[#f5f5f0] bg-transparent
                       hover:border-[#f5f5f0] hover:translate-x-0.5 hover:-translate-y-0.5
                       hover:shadow-[4px_4px_0_#e8ff00] transition-all duration-100
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? "Bezig..." : "▶ Fetch alle feeds"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                       border-2 border-[#e8ff00] text-[#0a0a0a] bg-[#e8ff00]
                       hover:translate-x-0.5 hover:-translate-y-0.5
                       hover:shadow-[4px_4px_0_#f5f5f0] transition-all duration-100"
          >
            + Nieuwe feed
          </button>
        </div>
      </div>

      {/* Fetch Status */}
      {fetchStatus && (
        <div className="px-8 py-3 border-b border-[#444] bg-[#1a1a1a] font-[family-name:var(--font-body)] text-xs">
          <span className="text-[#e8ff00] uppercase tracking-wider font-semibold mr-3">
            Fetch resultaat:
          </span>
          <span className="text-[#888]">{fetchStatus}</span>
          <button
            onClick={() => setFetchStatus(null)}
            className="ml-4 text-[#888] hover:text-[#f5f5f0]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="px-8 py-5 border-b-2 border-[#e8ff00] bg-[#1a1a1a]">
          <h3 className="font-[family-name:var(--font-title)] text-sm font-bold uppercase tracking-wider mb-4">
            {editingId ? "Feed bewerken" : "Nieuwe feed toevoegen"}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_300px] gap-4">
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  RSS Feed URL
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://www.google.com/alerts/feeds/..."
                  required
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="block font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest mb-1.5">
                  Zoekterm label
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. roken, vapen, nicotine"
                  required
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border-2 border-[#444] text-[#f5f5f0]
                             font-[family-name:var(--font-body)] text-sm
                             focus:border-[#e8ff00] focus:outline-none placeholder:text-[#555]"
                />
              </div>
            </div>
            {formError && (
              <p className="text-[#ff2d2d] text-xs font-[family-name:var(--font-body)]">
                {formError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                           border-2 border-[#e8ff00] text-[#0a0a0a] bg-[#e8ff00]
                           hover:translate-x-0.5 hover:-translate-y-0.5
                           hover:shadow-[4px_4px_0_#f5f5f0] transition-all duration-100"
              >
                {editingId ? "Opslaan" : "Toevoegen"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                           border-2 border-[#444] text-[#888]
                           hover:border-[#f5f5f0] hover:text-[#f5f5f0] transition-all duration-100"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feeds Table */}
      <div className="px-8 py-5">
        {loading ? (
          <p className="text-[#888] text-sm font-[family-name:var(--font-body)]">
            Laden...
          </p>
        ) : feeds.length === 0 ? (
          <p className="text-[#888] text-sm font-[family-name:var(--font-body)]">
            Geen feeds geconfigureerd. Voeg een nieuwe feed toe om te beginnen.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#444]">
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Label
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  URL
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest font-semibold">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr
                  key={feed.id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-[family-name:var(--font-title)] text-sm font-bold">
                      {feed.searchTermLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#888] break-all">
                      {feed.url}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        inline-block px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider
                        border font-[family-name:var(--font-body)]
                        ${
                          feed.isActive
                            ? "border-[#00ff88] text-[#00ff88]"
                            : "border-[#ff2d2d] text-[#ff2d2d]"
                        }
                      `}
                    >
                      {feed.isActive ? "Actief" : "Inactief"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(feed)}
                        className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                   border border-[#444] text-[#888]
                                   hover:border-[#e8ff00] hover:text-[#e8ff00] transition-all duration-100"
                      >
                        Bewerken
                      </button>
                      {feed.isActive ? (
                        <button
                          onClick={() => handleDeactivate(feed.id)}
                          className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                     border border-[#444] text-[#888]
                                     hover:border-[#ff2d2d] hover:text-[#ff2d2d] transition-all duration-100"
                        >
                          Deactiveren
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(feed.id)}
                          className="px-3 py-1.5 font-[family-name:var(--font-body)] text-[0.65rem] font-semibold uppercase tracking-wider
                                     border border-[#444] text-[#888]
                                     hover:border-[#00ff88] hover:text-[#00ff88] transition-all duration-100"
                        >
                          Activeren
                        </button>
                      )}
                    </div>
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
