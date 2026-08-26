const BAR_COUNT = 7;

/**
 * Onda decorativa que acompaña al orbe — cada barra respira a su propio
 * ritmo (delay distinto), como un ecualizador escuchando. Puramente
 * ambiental: no representa audio real (eso lo cubre VoiceLevelMeter en el
 * chat, que sí refleja el micrófono en vivo).
 */
export function Waveform({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-end justify-center gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-signal"
          style={{ height: "20px", transformOrigin: "bottom", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}
