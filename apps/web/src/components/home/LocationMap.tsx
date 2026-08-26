/**
 * Embed de mapa sin API key (Google Maps "output=embed" acepta una consulta
 * de texto libre). En modo oscuro se aplica un filtro CSS (invert + hue-rotate)
 * para que el mapa no rompa la consola nocturna con blanco puro — un truco
 * estándar para "oscurecer" un iframe que no soporta theming nativo.
 */
export function LocationMap({ location }: { location: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

  return (
    <div className="overflow-hidden rounded-sm border border-line">
      <iframe
        title={`Mapa de ${location}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="map-frame h-64 w-full grayscale-[15%] contrast-[1.05]"
      />
      <div className="flex items-center gap-2 border-t border-line bg-panel px-3 py-2 font-mono text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
        {location}
      </div>
    </div>
  );
}
