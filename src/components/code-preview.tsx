'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodePreviewProps {
  code: string;
  language?: string;
}

export function CodePreview({ code, language = 'json' }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for JSON
  const highlightJson = (json: string): string => {
    let highlighted = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Colors for VS Code-like syntax highlighting
    highlighted = highlighted.replace(
      /(".*?")/g,
      '<span style="color: #86efac;">$1</span>'
    ); // Strings - green-300
    highlighted = highlighted.replace(
      /(\b(true|false|null)\b)/g,
      '<span style="color: #67e8f9;">$1</span>'
    ); // Booleans/null - cyan-300
    highlighted = highlighted.replace(
      /(\b\d+\b)/g,
      '<span style="color: #fdba74;">$1</span>'
    ); // Numbers - orange-300
    highlighted = highlighted.replace(
      /("context"|"type"|"@type"|"@id"|"name"|"description"|"image"|"brand"|"url"|"price"|"availability"|"sku"|"ratingValue"|"reviewCount")/g,
      '<span style="color: #7dd3fc;">$1</span>'
    ); // Common keys - sky-300

    return highlighted;
  };

  return (
    <div className="relative group">
      {/* VS Code-like header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content - VS Code dark theme */}
      <div className="bg-slate-950 p-4 overflow-x-auto rounded-b-lg border border-slate-800">
        <pre className="text-sm font-mono leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: code ? highlightJson(code) : '<span style="color: #64748b;">// Generate schema to preview JSON-LD code</span>' }} />
        </pre>
      </div>
    </div>
  );
}
