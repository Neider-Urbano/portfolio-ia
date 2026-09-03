/**
 * Los links de "compartir" de Google Drive (.../file/d/ID/view?usp=sharing)
 * abren el visor de Drive en el navegador — no descargan nada. Esta función
 * los reescribe al endpoint de descarga directa de Drive
 * (uc?export=download&id=ID), que sí devuelve el archivo con
 * Content-Disposition: attachment (verificado con curl contra un archivo
 * real). Cualquier URL que no matchee el patrón de Drive (Dropbox, un PDF
 * suelto, etc.) se devuelve intacta.
 */
export function toDriveDirectDownloadUrl(url: string): string {
  const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
