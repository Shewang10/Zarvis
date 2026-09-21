import React from 'react';
import { ExternalLink, Newspaper, Calendar, Globe } from 'lucide-react';

interface NewsCardProps {
  data: {
    query?: string;
    totalResults?: number;
    sourceType?: string;
    articles: Array<{
      title: string;
      summary: string;
      source: string;
      url: string;
      publishedAt: string;
      imageUrl?: string;
      category?: string;
    }>;
  };
}

export const NewsCard: React.FC<NewsCardProps> = ({ data }) => {
  const articles = data.articles || [];

  if (articles.length === 0) {
    return (
      <div className="p-6 text-center text-hud-muted font-mono text-sm">
        No news articles retrieved for this topic.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-h-[480px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between text-xs font-mono text-hud-muted border-b border-hud-cyan/20 pb-2">
        <span className="flex items-center gap-1.5 text-hud-cyan">
          <Newspaper className="w-3.5 h-3.5" />
          {data.sourceType === 'live_feed' ? 'LIVE GLOBAL RSS STREAM' : 'VERIFIED INTELLIGENCE INDEX'}
        </span>
        <span>{articles.length} Reports Loaded</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {articles.map((article, idx) => (
          <article
            key={idx}
            className="group relative bg-hud-bg/60 border border-hud-cyan/20 hover:border-hud-cyan/60 rounded-lg p-3.5 transition-all duration-200 hover:shadow-glow-cyan flex flex-col sm:flex-row gap-3.5"
          >
            {/* Thumbnail */}
            {article.imageUrl && (
              <div className="sm:w-28 sm:h-24 w-full h-32 rounded-md overflow-hidden bg-black/40 border border-hud-cyan/10 shrink-0">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                  onError={(e) => {
                    // Fallback on image load failure
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-hud-blue/20 text-hud-cyan border border-hud-cyan/30">
                    {article.category || 'Tech & AI'}
                  </span>
                  <span className="text-[11px] font-mono text-hud-muted flex items-center gap-1">
                    <Globe className="w-3 h-3 text-hud-cyan/70" />
                    {article.source}
                  </span>
                  <span className="text-[11px] font-mono text-hud-muted flex items-center gap-1 ml-auto">
                    <Calendar className="w-3 h-3" />
                    {article.publishedAt}
                  </span>
                </div>

                <h4 className="text-sm font-hud font-semibold text-hud-text group-hover:text-hud-cyan transition-colors line-clamp-2">
                  {article.title}
                </h4>

                <p className="text-xs text-hud-text/80 font-sans mt-1.5 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {/* Action */}
              <div className="mt-2.5 pt-2 border-t border-hud-cyan/10 flex justify-end">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-hud-cyan hover:text-white transition-colors"
                >
                  Read Source Article
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

