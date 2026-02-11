"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body className="bg-[#0a0a0a] text-[#f5f5f0]">
        <div className="flex flex-col items-center justify-center min-h-screen px-8">
          <div className="border-2 border-[#ff2d2d] p-8 max-w-lg w-full">
            <h2 className="text-xl uppercase text-[#ff2d2d] mb-4 font-bold">
              Kritieke fout
            </h2>
            <p className="text-sm text-[#888] mb-6 font-mono">
              De applicatie is gecrasht. Probeer de pagina opnieuw te laden.
            </p>
            <button
              onClick={reset}
              className="px-6 py-2 text-xs font-semibold uppercase tracking-widest
                border-2 border-[#e8ff00] text-[#e8ff00] hover:bg-[#e8ff00] hover:text-[#0a0a0a]
                transition-all font-mono"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
