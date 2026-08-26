import { Fragment } from "react";

/**
 * Renderizador markdown-lite sin dependencias externas: cubre lo que
 * realmente produce el LLM en respuestas conversacionales (negritas,
 * cursivas, código inline, enlaces y listas). No es un parser CommonMark
 * completo — es intencionalmente pequeño y controlado.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Orden de prioridad: enlaces, código, negrita, cursiva.
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}-t${i++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }

    const [, linkText, linkUrl, code, bold, italic] = match;
    if (linkUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-a${i++}`}
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="text-signal underline-offset-2 hover:underline"
        >
          {linkText}
        </a>
      );
    } else if (code) {
      nodes.push(
        <code key={`${keyPrefix}-c${i++}`} className="rounded-sm bg-console px-1 py-0.5 font-mono text-[0.85em]">
          {code}
        </code>
      );
    } else if (bold) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-ink">
          {bold}
        </strong>
      );
    } else if (italic) {
      nodes.push(<em key={`${keyPrefix}-i${i++}`}>{italic}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${i++}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1 list-disc space-y-1 pl-5">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `${key}-li${idx}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, idx) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }
    flushList(`list-${idx}`);

    if (line.trim() === "") {
      blocks.push(<br key={`br-${idx}`} />);
      return;
    }

    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });

  flushList("list-end");

  return <div className="space-y-1">{blocks}</div>;
}
