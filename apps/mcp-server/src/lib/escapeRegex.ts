/**
 * Escapa caracteres especiales de regex en texto que viene del visitante
 * (vía argumentos de tool) antes de armar un `new RegExp(...)` para Mongo.
 * Sin esto, alguien podría mandar un patrón que cause backtracking
 * catastrófico (ReDoS) y cuelgue el proceso — este servidor no es
 * serverless, así que un cuelgue afecta a todos los requests, no solo al
 * de quien lo mandó.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
