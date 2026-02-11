"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ArticleRow {
  id: number;
  title: string;
  introduction: string;
  classification: string | null;
  categoryId: number | null;
  joomlaPushStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadArticles = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? data);
        setTotal(data.total ?? (data.articles ?? data).length);
      } else {
        setError("Artikelen konden niet worden geladen.");
      }
    } catch {
      setError("Artikelen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-[family-name:var(--font-body)] text-[#888] text-sm uppercase tracking-widest animate-pulse">
          Artikelen laden...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 py-4 border-b-2 border-[#444] flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg uppercase">
          Gegenereerde artikelen
        </h2>
        <span className="font-[family-name:var(--font-body)] text-xs text-[#888] uppercase tracking-wider">
          {articles.length} van {total} artikelen
        </span>
      </div>

      {error && (
        <div className="mx-8 mt-4 px-4 py-3 border-2 border-[#ff2d2d] bg-[#ff2d2d]/10">
          <p className="font-[family-name:var(--font-body)] text-sm text-[#ff2d2d]">
            {error}
          </p>
        </div>
      )}

      {!error && articles.length === 0 ? (
        <div className="px-8 py-12">
          <p className="text-[#888] font-[family-name:var(--font-body)] text-sm">
            Nog geen artikelen gegenereerd. Selecteer clusters op het dashboard en genereer artikelen.
          </p>
        </div>
      ) : (
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_120px_120px_100px] px-8 py-2 border-b-2 border-[#444] bg-[#2a2a2a]">
            <span className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
              Titel
            </span>
            <span className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
              Classificatie
            </span>
            <span className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
              Push status
            </span>
            <span className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
              Aangemaakt
            </span>
            <span className="font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-widest">
              Actie
            </span>
          </div>

          {/* Rows */}
          {articles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-[1fr_120px_120px_120px_100px] px-8 py-3 border-b border-[#333] hover:bg-[#1a1a1a] transition-colors items-center"
            >
              <div>
                <p className="font-[family-name:var(--font-title)] text-sm font-bold leading-snug">
                  {article.title}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#888] mt-0.5 line-clamp-1">
                  {article.introduction}
                </p>
              </div>
              <div>
                {article.classification && (
                  <span
                    className={`inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider border
                      ${article.classification === "binnenland" ? "border-[#00ff88] text-[#00ff88]" : "border-[#e8ff00] text-[#e8ff00]"}`}
                  >
                    {article.classification}
                  </span>
                )}
              </div>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider border font-[family-name:var(--font-body)]
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
              </div>
              <div className="font-[family-name:var(--font-body)] text-xs text-[#888]">
                {new Date(article.createdAt).toLocaleDateString("nl-NL")}
              </div>
              <div>
                <Link
                  href={`/articles/${article.id}`}
                  className="px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider
                    border border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a] transition-all
                    font-[family-name:var(--font-body)]"
                >
                  Bekijk
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
