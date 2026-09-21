import React, { useState } from 'react';
import { Calculator, Copy, Check, Terminal } from 'lucide-react';

interface CalculationCardProps {
  data: {
    expression: string;
    normalizedExpression?: string;
    result: number | string;
    formattedResult: string;
    steps?: string[];
  };
}

export const CalculationCard: React.FC<CalculationCardProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(data.result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      {/* High-Tech Calculator Screen */}
      <div className="bg-black/60 border border-hud-cyan/40 rounded-xl p-4 shadow-glow-cyan">
        <div className="flex items-center justify-between text-xs font-mono text-hud-muted mb-2">
          <span className="flex items-center gap-1.5 text-hud-cyan">
            <Calculator className="w-3.5 h-3.5" />
            SYNTHESIS ENGINE
          </span>
          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-hud-cyan/10 text-hud-cyan border border-hud-cyan/30">
            64-BIT PRECISION
          </span>
        </div>

        {/* Expression */}
        <div className="text-right text-hud-muted font-mono text-sm tracking-wider mb-1 truncate">
          {data.expression} =
        </div>

        {/* Big Glowing Result */}
        <div className="flex items-baseline justify-between gap-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-mono text-hud-cyan/80 hover:text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 px-2.5 py-1 rounded border border-hud-cyan/30 transition-all"
            title="Copy result"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-hud-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <div className="text-right text-3xl md:text-4xl font-hud font-extrabold text-hud-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">
            {data.formattedResult || data.result}
          </div>
        </div>
      </div>

      {/* Evaluation Trace Steps */}
      {data.steps && data.steps.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-hud-muted uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-hud-cyan" />
            Execution Trace
          </div>
          <div className="bg-hud-bg/70 border border-hud-cyan/20 rounded-lg p-3 font-mono text-xs text-hud-text/80 space-y-1.5">
            {data.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-hud-cyan select-none">›</span>
                <span className="break-all">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

