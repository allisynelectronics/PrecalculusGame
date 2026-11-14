import katex from 'katex';
import { useMemo } from 'react';

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
            return katex.renderToString(part, { throwOnError: false, displayMode: false });
          } catch {
            return part;
          }
        }
        return part.replace(/</g, '&lt;');
      })
      .join('');
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function MathBlock({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: true });
    } catch {
      return tex;
    }
  }, [tex]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
