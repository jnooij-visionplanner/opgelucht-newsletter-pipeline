"use client";

import { useState, useEffect, useCallback } from "react";

interface Prompt {
  id: number;
  name: string;
  content: string;
  version: number;
  isActive: boolean;
  comment: string | null;
  createdAt: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("Artikel Generatie");
  const [formContent, setFormContent] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activating, setActivating] = useState<number | null>(null);

  const loadPrompts = useCallback(async () => {
    try {
      setPageError(null);
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      } else {
        setPageError("Prompts konden niet worden geladen.");
      }
    } catch {
      setPageError("Prompts konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const resetForm = () => {
    setFormName("Artikel Generatie");
    setFormContent("");
    setFormComment("");
    setFormError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formContent || formContent.length < 10) {
      setFormError("Prompt moet minimaal 10 tekens bevatten");
      return;
    }

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          content: formContent,
          comment: formComment || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Opslaan mislukt");
        return;
      }

      resetForm();
      loadPrompts();
    } catch {
      setFormError("Netwerkfout");
    }
  };

  const handleActivate = async (id: number) => {
    setActivating(id);
    try {
      const res = await fetch(`/api/prompts/${id}?action=activate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        loadPrompts();
      }
    } catch {
      setPageError("Prompt kon niet worden geactiveerd.");
    } finally {
      setActivating(null);
    }
  };

  const handlePreFill = (prompt: Prompt) => {
    setFormName(prompt.name);
    setFormContent(prompt.content);
    setFormComment("");
    setShowForm(true);
  };

  const activePrompt = prompts.find((p) => p.isActive);

  if (loading) {
    return (
      <div className="p-8 font-[family-name:var(--font-body)]">
        <div className="text-[#888] uppercase tracking-widest text-xs">
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-[family-name:var(--font-body)]">
      {/* Page Error */}
      {pageError && (
        <div className="mb-4 px-4 py-3 border-2 border-[#ff2d2d] bg-[#ff2d2d]/10">
          <p className="text-sm text-[#ff2d2d]">
            {pageError}
          </p>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#f5f5f0] uppercase">
            Prompt Beheer
          </h1>
          <p className="text-[#888] text-xs uppercase tracking-widest mt-1">
            Systeem prompts voor artikelgeneratie — {prompts.length} versie
            {prompts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#e8ff00] text-[#0a0a0a] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#d4eb00] transition-colors"
        >
          {showForm ? "✕ Sluiten" : "+ Nieuwe Versie"}
        </button>
      </div>

      {/* ── Active prompt banner ───────────────────────────── */}
      {activePrompt && (
        <div className="border-2 border-[#00ff88] bg-[#00ff88]/5 p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#00ff88] text-[#0a0a0a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Actief
            </span>
            <span className="text-[#f5f5f0] font-[family-name:var(--font-title)] text-sm">
              v{activePrompt.version} — {activePrompt.name}
            </span>
          </div>
          <pre className="text-[#888] text-xs font-[family-name:var(--font-body)] whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
            {activePrompt.content.length > 300
              ? activePrompt.content.substring(0, 300) + "..."
              : activePrompt.content}
          </pre>
        </div>
      )}

      {/* ── Form ───────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-[#444] bg-[#1a1a1a] p-6 mb-8"
        >
          <h2 className="font-[family-name:var(--font-title)] text-sm text-[#e8ff00] uppercase tracking-widest mb-4">
            Nieuwe Prompt Versie
          </h2>

          {formError && (
            <div className="bg-[#ff2d2d]/10 border border-[#ff2d2d] text-[#ff2d2d] text-xs p-3 mb-4">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[#888] text-xs uppercase tracking-widest mb-1">
                Naam
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#444] text-[#f5f5f0] px-3 py-2 text-sm focus:border-[#e8ff00] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[#888] text-xs uppercase tracking-widest mb-1">
                Prompt Tekst
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={16}
                className="w-full bg-[#0a0a0a] border border-[#444] text-[#f5f5f0] px-3 py-2 text-sm font-mono leading-relaxed focus:border-[#e8ff00] focus:outline-none resize-y"
                placeholder="Je bent een professionele Nederlandse journalist..."
                required
              />
              <div className="flex justify-between mt-1">
                <span className="text-[#555] text-[10px] uppercase">
                  Minimaal 10 tekens
                </span>
                <span className="text-[#555] text-[10px]">
                  {formContent.length} tekens
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[#888] text-xs uppercase tracking-widest mb-1">
                Opmerking (optioneel)
              </label>
              <input
                type="text"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#444] text-[#f5f5f0] px-3 py-2 text-sm focus:border-[#e8ff00] focus:outline-none"
                placeholder="Bijv. 'Toon informeler gemaakt'"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-[#e8ff00] text-[#0a0a0a] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#d4eb00] transition-colors"
            >
              Opslaan als v{(prompts[0]?.version ?? 0) + 1}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="border border-[#444] text-[#888] px-6 py-2 text-xs uppercase tracking-widest hover:text-[#f5f5f0] hover:border-[#888] transition-colors"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {/* ── Version history table ──────────────────────────── */}
      {prompts.length === 0 ? (
        <div className="border-2 border-dashed border-[#333] p-12 text-center">
          <p className="text-[#555] text-xs uppercase tracking-widest">
            Nog geen prompts aangemaakt
          </p>
          <p className="text-[#444] text-xs mt-2">
            Maak een eerste prompt aan om artikelgeneratie te starten
          </p>
        </div>
      ) : (
        <div className="border-2 border-[#444]">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#444] bg-[#1a1a1a]">
                <th className="text-left text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Versie
                </th>
                <th className="text-left text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Naam
                </th>
                <th className="text-left text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Opmerking
                </th>
                <th className="text-left text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Aangemaakt
                </th>
                <th className="text-left text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Status
                </th>
                <th className="text-right text-[#888] text-[10px] uppercase tracking-widest px-4 py-3">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr
                  key={prompt.id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-[family-name:var(--font-title)] text-sm text-[#f5f5f0]">
                      v{prompt.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#f5f5f0] text-sm">
                    {prompt.name}
                  </td>
                  <td className="px-4 py-3 text-[#888] text-xs">
                    {prompt.comment || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#888] text-xs font-mono">
                    {new Date(prompt.createdAt).toLocaleDateString("nl-NL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {prompt.isActive ? (
                      <span className="bg-[#00ff88] text-[#0a0a0a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Actief
                      </span>
                    ) : (
                      <span className="text-[#555] text-[10px] uppercase tracking-wider">
                        Inactief
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === prompt.id ? null : prompt.id
                          )
                        }
                        className="text-[#888] text-xs uppercase tracking-widest hover:text-[#e8ff00] transition-colors"
                      >
                        {expandedId === prompt.id ? "Verbergen" : "Bekijken"}
                      </button>
                      <button
                        onClick={() => handlePreFill(prompt)}
                        className="text-[#888] text-xs uppercase tracking-widest hover:text-[#e8ff00] transition-colors"
                      >
                        Kopiëren
                      </button>
                      {!prompt.isActive && (
                        <button
                          onClick={() => handleActivate(prompt.id)}
                          disabled={activating === prompt.id}
                          className="text-[#00ff88] text-xs uppercase tracking-widest hover:text-[#00cc6a] transition-colors disabled:opacity-50"
                        >
                          {activating === prompt.id
                            ? "Bezig..."
                            : "Activeren"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Expanded prompt content ──────────────────────── */}
          {expandedId && (
            <div className="border-t-2 border-[#e8ff00] bg-[#1a1a1a] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#e8ff00] text-xs uppercase tracking-widest font-bold">
                  Prompt v
                  {prompts.find((p) => p.id === expandedId)?.version}
                </span>
                <button
                  onClick={() => setExpandedId(null)}
                  className="text-[#555] text-xs hover:text-[#f5f5f0] transition-colors"
                >
                  ✕ Sluiten
                </button>
              </div>
              <pre className="text-[#f5f5f0] text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {prompts.find((p) => p.id === expandedId)?.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
