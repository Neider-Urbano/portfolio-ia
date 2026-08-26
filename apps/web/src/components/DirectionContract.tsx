const CONTRACT = `
THESIS: A portfolio that reads as opening a modern AI assistant, not a resume - the hero is a breathing voice orb, and every section below lives in its own real card or grid, never trapped inside a chat bubble, so the conversational feel never costs scanability.
OWN-WORLD: Soft violet-tinted app ground, a single lilac accent for everything interactive/live, warm coral reserved for the orb's glow and small icon accents - never a second status color. Day = the assistant under daylight; night = the same assistant in a dim room, lilac and coral both brighter. Urbanist for titles/UI, Nunito Sans for prose. Corners are soft everywhere (one retargeted radius token), never sharp.
STORY: A visitor opens the page, the orb greets them with a breathing pulse and a waveform, then scrolls through real, fully-visible sections (projects, experience, services, skills, hobbies, gallery, comments, contact+map) before optionally opening /chat, which carries the exact same orb/voice language for a literal live conversation.
FIRST VIEWPORT: The orb centered and pulsing, the owner's name in Urbanist below it, a waveform, two pill actions ("Hablar con mi IA" / "Ver todo"), and a row of stat pills - then the page hands off into card-based sections, never a chat thread standing in for the whole page.
FORM: Modo Voz (voice-assistant world), chosen by the user directly after rejecting two prior rolled directions and stating the pinned brief: the whole product should read as an AI chat, minimalist, icon-driven, image-carrying, dynamic.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
`;

/**
 * Direction contract, recorded per the impeccable skill's new-work flow.
 * Kept as a real HTML comment in the emitted markup (not a JSX comment,
 * which Next strips) so it survives the production build and can be grepped
 * from the built output.
 */
export function DirectionContract() {
  return (
    <div
      aria-hidden
      style={{ display: "none" }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: `<!--${CONTRACT}-->` }}
    />
  );
}
