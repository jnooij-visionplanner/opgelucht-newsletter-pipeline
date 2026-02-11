"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <div className="border-2 border-[#ff2d2d] p-8 max-w-lg w-full">
        <h2 className="font-[family-name:var(--font-display)] text-xl uppercase text-[#ff2d2d] mb-4">
          Er is iets misgegaan
        </h2>
        <p className="font-[family-name:var(--font-body)] text-sm text-[#888] mb-6">
          Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te
          laden.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 text-xs font-semibold uppercase tracking-widest
            border-2 border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a]
            transition-all font-[family-name:var(--font-body)]"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
