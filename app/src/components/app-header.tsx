export function AppHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto] items-end px-8 pt-6 pb-4 border-b-4 border-[#e8ff00]">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight leading-none">
          OPGE<span className="text-[#e8ff00] inline-block -skew-x-6">LUCHT</span>
        </h1>
      </div>
      <div className="text-right font-[family-name:var(--font-body)] text-[0.65rem] text-[#888] uppercase tracking-[0.15em] leading-relaxed">
        <div>Content Pipeline v0.1</div>
        <div>Rookvrije Generatie NL</div>
        <div className="text-[#ff2d2d] animate-pulse">● LIVE</div>
      </div>
    </header>
  );
}
