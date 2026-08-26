/**
 * El orbe — avatar del asistente, dispositivo de firma de "Modo Voz". Respira
 * todo el tiempo (no espera interacción) y es el único lugar del sistema
 * donde el acento lila y el coral secundario se mezclan en un gradiente; en
 * cualquier otro lugar cada color vive por separado. Server-renderable: la
 * animación es CSS puro (ver .orb / .orb::after en globals.css).
 */
export function Orb({ size = 84 }: { size?: number }) {
  return (
    <span className="orb inline-block shrink-0" style={{ width: size, height: size }} aria-hidden />
  );
}
