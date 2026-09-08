'use client';

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function KaTeXRenderer({ text }: { text: string }) {
  const html = useMemo(() => {
    const parts = text.split(/(\$\$[^$]+\$\$)/g);
    return parts
      .map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const latex = part.slice(2, -2);
          try {
            return katex.renderToString(latex, { throwOnError: false, displayMode: false });
          } catch {
            return part;
          }
        }
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      })
      .join('');
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
