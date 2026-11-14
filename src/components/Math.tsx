import katex from 'katex';
import { useMemo } from 'react';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders a string containing a mix of plain text and $...$ KaTeX math segments.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const parts = text.split(/\$([^$]+)\$/g);
    return parts
      .map((part, i) => {
        if (i % 2 === 1) {
          try {
            return katex.renderToString(part, { throwOnError: false, displayMode: false, trust: false });
          } catch {
            // KaTeX failed to render this segment — fall back to the raw source, escaped,
            // since it's going into dangerouslySetInnerHTML just like the happy path.
            return escapeHtml(part);
          }
        }
        return escapeHtml(part);
      })
      .join('');
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function MathBlock({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: true, trust: false });
    } catch {
      return escapeHtml(tex);
    }
  }, [tex]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
