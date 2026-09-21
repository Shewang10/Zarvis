import React from 'react';
import { ExternalLink, Search, Globe } from 'lucide-react';

interface SearchResultsCardProps {
  data: {
    query: string;
    totalResults: number;
    results: Array<{
      title: string;
      snippet: string;
      url: string;
      domain: string;
    }>;
    source?: string;
  };
}

export const SearchResultsCard: React.FC<SearchResultsCardProps> = ({ data }) => {
  const results = data.results || [];

  return (
    <div className="space-y-3 p-4 max-h-[460px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between text-xs font-mono text-hud-muted border-b border-hud-cyan/20 pb-2">
        <span className="flex items-center gap-1.5 text-hud-cyan">
          <Search className="w-3.5 h-3.5" />
          TARGET: "{data.query}"
        </span>
        <span>{results.length} Verified Sources</span>
      </div>

      <div className="space-y-2.5">
        {results.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-hud-bg/60 border border-hud-cyan/20 hover:border-hud-cyan/50 rounded-lg transition-all duration-150 hover:shadow-glow-cyan"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-hud-cyan flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {item.domain}
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hud-muted hover:text-hud-cyan transition-colors"
                title="Open reference"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-hud font-semibold text-hud-text hover:text-hud-cyan transition-colors block mb-1"
            >
              {item.title}
            </a>

            <p className="text-xs text-hud-text/75 font-sans leading-relaxed">
              {item.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

