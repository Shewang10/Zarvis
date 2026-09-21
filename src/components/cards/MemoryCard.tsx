import React, { useState } from 'react';
import { Database, Trash2, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface MemoryItem {
  id: string;
  key: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoryCardProps {
  data: {
    stored?: boolean;
    memory?: MemoryItem;
    message?: string;
    found?: boolean;
    query?: string;
    memories?: MemoryItem[];
    summary?: string;
  };
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ data }) => {
  const initialMemories = data.memories || (data.memory ? [data.memory] : []);
  const [memoriesList, setMemoriesList] = useState<MemoryItem[]>(initialMemories);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemoriesList((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar">
      {/* Banner for storage action */}
      {data.stored && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-hud-green/10 border border-hud-green/30 text-hud-green text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{data.message || 'Synaptic memory committed to persistent database.'}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono text-hud-muted border-b border-hud-cyan/20 pb-2">
        <span className="flex items-center gap-1.5 text-hud-cyan">
          <Database className="w-3.5 h-3.5" />
          PERSISTENT MEMORY ARCHIVE
        </span>
        <span>{memoriesList.length} Active Records</span>
      </div>

      {memoriesList.length === 0 ? (
        <div className="text-center py-6 text-hud-muted font-mono text-xs">
          No matching synaptic memories currently in database.
        </div>
      ) : (
        <div className="space-y-3">
          {memoriesList.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-hud-bg/60 border border-hud-cyan/25 hover:border-hud-cyan/60 rounded-lg transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-hud font-bold text-hud-cyan uppercase tracking-wider">
                    {m.key}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-hud-cyan/10 text-hud-muted border border-hud-cyan/20 uppercase">
                    {m.category || 'general'}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-hud-muted hover:text-hud-red p-1 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-sm font-sans text-hud-text/90 leading-relaxed mb-2">
                {m.content}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-hud-muted border-t border-hud-cyan/10 pt-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {m.tags &&
                    m.tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-0.5 text-hud-cyan/70">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                </div>

                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(m.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
