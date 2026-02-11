"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface ArticleDetail {
  id: number;
  topicClusterId: number | null;
  categoryId: number | null;
  classification: "binnenland" | "buitenland" | null;
  title: string;
  introduction: string;
  narrativeSummary: string;
  sourceListHtml: string;
  joomlaPushStatus: string;
  joomlaPushedAt: string | null;
  promptVersionId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
}

const TITLE_MAX = 36;
const INTRO_MAX = 175;

export default function ArticleReviewPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = Number(params.id);

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editIntro, setEditIntro] = useState("");
  const [editClassification, setEditClassification] = useState<"binnenland" | "buitenland">("binnenland");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const loadArticle = useCallback(async () => {
    try {
      const [artRes, catRes] = await Promise.all([
        fetch(`/api/articles/${articleId}`),
        fetch("/api/categories"),
      ]);
      if (artRes.ok) {
        const data: ArticleDetail = await artRes.json();
        setArticle(data);
        setEditTitle(data.title);
        setEditIntro(data.introduction);
        setEditClassification(data.classification || "binnenland");
        setEditCategoryId(data.categoryId);
      }
      if (catRes.ok) {
        setCategories(await catRes.json());
      }
    } catch {
      console.error("Artikel laden mislukt");
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          introduction: editIntro,
          classification: editClassification,
          categoryId: editCategoryId,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        showStatus("Wijzigingen opgeslagen", "success");
      } else {
        const err = await res.json();
        showStatus(err.error || "Opslaan mislukt", "error");
      }
    } catch {
      showStatus("Opslaan mislukt", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setShowRegenDialog(false);
    try {
      const res = await fetch(`/api/articles/${articleId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: regenInstructions }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        setEditTitle(updated.title);
        setEditIntro(updated.introduction);
        setEditClassification(updated.classification || "binnenland");
        setEditCategoryId(updated.categoryId);
        setRegenInstructions("");
        showStatus("Artikel geregenereerd", "success");
      } else {
        const err = await res.json();
        showStatus(err.error || "Regeneratie mislukt", "error");
      }
    } catch {
      showStatus("Regeneratie mislukt", "error");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePushToJoomla = async () => {
    setPushing(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/push-to-joomla`, {
        method: "POST",
      });
      if (res.ok) {
        showStatus("Artikel gepusht naar Joomla", "success");
        loadArticle();
      } else {
        const err = await res.json();
        showStatus(err.error || "Push mislukt", "error");
      }
    } catch {
      showStatus("Push naar Joomla mislukt", "error");
    } finally {
      setPushing(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-[family-name:var(--font-body)] text-[#888] text-sm uppercase tracking-widest animate-pulse">
          Artikel laden...
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="px-8 py-12">
        <p className="text-[#ff2d2d] font-[family-name:var(--font-body)] text-sm">
          Artikel niet gevonden.
        </p>
        <button
          onClick={() => router.push("/articles")}
          className="mt-4 px-4 py-2 border border-[#444] text-[#888] font-[family-name:var(--font-body)] text-xs uppercase tracking-wider hover:border-[#f5f5f0] hover:text-[#f5f5f0]"
        >
          ← Terug
        </button>
      </div>
    );
  }

  const titleLen = editTitle.length;
  const introLen = editIntro.length;
  const titleOk = titleLen <= TITLE_MAX;
  const introOk = introLen <= INTRO_MAX;

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

      {/* Header bar */}
      <div className="px-8 py-4 border-b-2 border-[#444] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/articles")}
            className="font-[family-name:var(--font-body)] text-xs text-[#888] hover:text-[#f5f5f0] uppercase tracking-wider"
          >
            ← Terug
          </button>
          <h2 className="font-[family-name:var(--font-display)] text-lg uppercase">
            Artikel #{article.id}
          </h2>
          {article.joomlaPushStatus && (
            <span
              className={`px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider border font-[family-name:var(--font-body)]
                ${
                  article.joomlaPushStatus === "pushed"
                    ? "border-[#00ff88] text-[#00ff88]"
                    : article.joomlaPushStatus === "failed"
                      ? "border-[#ff2d2d] text-[#ff2d2d]"
                      : "border-[#888] text-[#888]"
                }`}
            >
              {article.joomlaPushStatus}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRegenDialog(true)}
            disabled={regenerating}
            className="px-4 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
              border-2 border-[#444] text-[#f5f5f0] hover:border-[#f5f5f0] hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_#f5f5f0] transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {regenerating ? "Regenereren..." : "Regenereer"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
              border-2 border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a] transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            onClick={handlePushToJoomla}
            disabled={pushing || article.joomlaPushStatus === "pushed"}
            className="px-4 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
              border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#0a0a0a] transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pushing ? "Pushen..." : "→ Joomla"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[1fr_350px]">
        {/* Left: Edit fields + preview */}
        <div className="p-8 space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-wider text-[#888]">
                Titel
              </label>
              <span
                className={`font-[family-name:var(--font-body)] text-[0.65rem] font-bold px-2 py-0.5 border
                  ${titleOk ? "border-[#00ff88] text-[#00ff88]" : "border-[#ff2d2d] text-[#ff2d2d]"}`}
              >
                {titleLen}/{TITLE_MAX}
              </span>
            </div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={`w-full px-4 py-3 bg-transparent font-[family-name:var(--font-title)] text-lg font-bold
                border-2 focus:outline-none transition-colors
                ${titleOk ? "border-[#444] focus:border-[#e8ff00]" : "border-[#ff2d2d] focus:border-[#ff2d2d]"}`}
            />
          </div>

          {/* Introduction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-wider text-[#888]">
                Introductie
              </label>
              <span
                className={`font-[family-name:var(--font-body)] text-[0.65rem] font-bold px-2 py-0.5 border
                  ${introOk ? "border-[#00ff88] text-[#00ff88]" : "border-[#ff2d2d] text-[#ff2d2d]"}`}
              >
                {introLen}/{INTRO_MAX}
              </span>
            </div>
            <textarea
              value={editIntro}
              onChange={(e) => setEditIntro(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 bg-transparent font-[family-name:var(--font-body)] text-sm
                border-2 focus:outline-none resize-none transition-colors
                ${introOk ? "border-[#444] focus:border-[#e8ff00]" : "border-[#ff2d2d] focus:border-[#ff2d2d]"}`}
            />
          </div>

          {/* Narrative Preview */}
          <div>
            <label className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-wider text-[#888] block mb-2">
              Narratief (HTML preview)
            </label>
            <div
              className="p-6 border-2 border-[#444] bg-[#111] font-[family-name:var(--font-body)] text-sm leading-relaxed
                prose prose-invert max-w-none
                [&_p]:mb-3 [&_a]:text-[#e8ff00] [&_a]:underline [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2"
              dangerouslySetInnerHTML={{ __html: article.narrativeSummary }}
            />
          </div>

          {/* Source List Preview */}
          <div>
            <label className="font-[family-name:var(--font-body)] text-[0.7rem] uppercase tracking-wider text-[#888] block mb-2">
              Bronnenlijst
            </label>
            <div
              className="p-4 border border-[#333] bg-[#0a0a0a] font-[family-name:var(--font-body)] text-xs
                [&_ul]:list-none [&_ul]:p-0 [&_li]:py-1 [&_li]:border-b [&_li]:border-[#222]
                [&_a]:text-[#e8ff00] [&_a]:no-underline [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: article.sourceListHtml }}
            />
          </div>
        </div>

        {/* Right sidebar: metadata */}
        <aside className="border-l-2 border-[#444] bg-[#2a2a2a] p-5 space-y-6">
          {/* Classification */}
          <div>
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Classificatie
            </p>
            <div className="space-y-2">
              {(["binnenland", "buitenland"] as const).map((c) => (
                <label key={c} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="classification"
                    value={c}
                    checked={editClassification === c}
                    onChange={() => setEditClassification(c)}
                    className="accent-[#e8ff00]"
                  />
                  <span className="font-[family-name:var(--font-body)] text-sm capitalize">
                    {c}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Categorie
            </p>
            <select
              value={editCategoryId ?? ""}
              onChange={(e) =>
                setEditCategoryId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#444] text-[#f5f5f0]
                font-[family-name:var(--font-body)] text-sm focus:border-[#e8ff00] focus:outline-none"
            >
              <option value="">— Geen categorie —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          <div>
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Metadata
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Artikel ID", val: `#${article.id}` },
                { label: "Cluster ID", val: article.topicClusterId ? `#${article.topicClusterId}` : "—" },
                { label: "Prompt versie", val: article.promptVersionId ? `v${article.promptVersionId}` : "Standaard" },
                { label: "Aangemaakt", val: new Date(article.createdAt).toLocaleString("nl-NL") },
                { label: "Bijgewerkt", val: new Date(article.updatedAt).toLocaleString("nl-NL") },
              ].map((m) => (
                <div key={m.label} className="flex justify-between font-[family-name:var(--font-body)] text-xs">
                  <span className="text-[#888]">{m.label}</span>
                  <span className="text-[#f5f5f0]">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Push status */}
          <div>
            <p className="font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.15em] text-[#e8ff00] mb-3">
              // Joomla status
            </p>
            <div className="space-y-1.5 font-[family-name:var(--font-body)] text-xs">
              <div className="flex justify-between">
                <span className="text-[#888]">Status</span>
                <span
                  className={
                    article.joomlaPushStatus === "pushed"
                      ? "text-[#00ff88]"
                      : article.joomlaPushStatus === "failed"
                        ? "text-[#ff2d2d]"
                        : "text-[#888]"
                  }
                >
                  {article.joomlaPushStatus}
                </span>
              </div>
              {article.joomlaPushedAt && (
                <div className="flex justify-between">
                  <span className="text-[#888]">Gepusht op</span>
                  <span className="text-[#f5f5f0]">
                    {new Date(article.joomlaPushedAt).toLocaleString("nl-NL")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Regeneration Dialog */}
      {showRegenDialog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[#1a1a1a] border-2 border-[#e8ff00] max-w-lg w-full">
            <div className="px-6 py-4 border-b-2 border-[#444]">
              <h3 className="font-[family-name:var(--font-display)] text-base uppercase">
                Artikel regenereren
              </h3>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#888] mt-1">
                Optioneel: geef instructies mee voor de regeneratie
              </p>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={regenInstructions}
                onChange={(e) => setRegenInstructions(e.target.value)}
                rows={5}
                placeholder="Bijv. 'Focus meer op de gevolgen voor jongeren' of 'Gebruik een urgentere toon'..."
                className="w-full px-4 py-3 bg-transparent border-2 border-[#444] text-[#f5f5f0]
                  font-[family-name:var(--font-body)] text-sm focus:border-[#e8ff00] focus:outline-none resize-none
                  placeholder:text-[#666]"
              />
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#444]">
              <button
                onClick={() => {
                  setShowRegenDialog(false);
                  setRegenInstructions("");
                }}
                className="px-5 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                  border-2 border-[#444] text-[#888] hover:border-[#f5f5f0] hover:text-[#f5f5f0] transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={handleRegenerate}
                className="px-5 py-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider
                  border-2 border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a] transition-all"
              >
                Regenereer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
