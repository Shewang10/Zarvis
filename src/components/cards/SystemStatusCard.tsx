import { Cpu, ShieldCheck, HardDrive, Zap } from 'lucide-react';

interface SystemStatusCardProps {
  data: {
    status: string;
    platform: string;
    architecture: string;
    nodeVersion: string;
    uptimeFormatted: string;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
      systemTotalMB: number;
      systemFreeMB: number;
      memoryPressure: string;
    };
    cpu: {
      model: string;
      cores: number;
      loadAvg: number[];
    };
    database: {
      memoriesCount: number;
      conversationsCount: number;
      eventsCount: number;
      status: string;
    };
    services: {
      voiceEngine: string;
      searchProvider: string;
      aiProvider: string;
    };
  };
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ data }) => {
  return (
    <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar">
      {/* Primary Health Banner */}
      <div className="flex items-center justify-between p-3.5 bg-hud-bg/70 border border-hud-green/40 rounded-xl shadow-glow-green">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-hud-green/20 text-hud-green">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-hud font-bold text-hud-green tracking-wider uppercase">
              JARVIS CORE: {data.status || 'OPTIMAL'}
            </div>
            <div className="text-[11px] font-mono text-hud-muted">
              Uptime: {data.uptimeFormatted}
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-hud-cyan">
          {data.platform}
        </div>
      </div>

      {/* Hardware Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Memory Gauge */}
        <div className="p-3 bg-hud-bg/50 border border-hud-cyan/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-hud-muted">
            <span className="flex items-center gap-1.5 text-hud-cyan">
              <HardDrive className="w-3.5 h-3.5" />
              HEAP MEMORY
            </span>
            <span className="text-hud-text font-bold">
              {data.memory?.heapUsedMB} MB / {data.memory?.heapTotalMB} MB
            </span>
          </div>

          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-hud-cyan/20">
            <div
              className="bg-hud-cyan h-full rounded-full transition-all duration-500 shadow-glow-cyan"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((data.memory?.heapUsedMB || 1) / (data.memory?.heapTotalMB || 100)) * 100
                  )
                )}%`,
              }}
            />
          </div>

          <div className="text-[10px] font-mono text-hud-muted flex justify-between">
            <span>Pressure: {data.memory?.memoryPressure}</span>
            <span>RSS: {data.memory?.rssMB} MB</span>
          </div>
        </div>

        {/* CPU Telemetry */}
        <div className="p-3 bg-hud-bg/50 border border-hud-cyan/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-hud-muted">
            <span className="flex items-center gap-1.5 text-hud-cyan">
              <Cpu className="w-3.5 h-3.5" />
              PROCESSOR
            </span>
            <span className="text-hud-text font-bold">{data.cpu?.cores} Cores</span>
          </div>

          <div className="text-xs font-mono text-hud-text/80 truncate">
            {data.cpu?.model}
          </div>

          <div className="text-[10px] font-mono text-hud-muted flex justify-between">
            <span>Arch: {data.architecture}</span>
            <span>Load: {data.cpu?.loadAvg?.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Connected Services */}
      <div className="p-3 bg-hud-bg/50 border border-hud-cyan/20 rounded-lg space-y-2">
        <div className="text-xs font-mono text-hud-cyan flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          CONNECTED SERVICE SUBSYSTEMS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <div className="p-2 rounded bg-black/30 border border-hud-cyan/10">
            <div className="text-[10px] text-hud-muted">AI ENGINE</div>
            <div className="text-hud-text font-medium truncate">{data.services?.aiProvider}</div>
          </div>

          <div className="p-2 rounded bg-black/30 border border-hud-cyan/10">
            <div className="text-[10px] text-hud-muted">SEARCH ROUTER</div>
            <div className="text-hud-text font-medium truncate">{data.services?.searchProvider}</div>
          </div>

          <div className="p-2 rounded bg-black/30 border border-hud-cyan/10">
            <div className="text-[10px] text-hud-muted">PERSISTENCE</div>
            <div className="text-hud-text font-medium truncate">{data.database?.status?.split(' ')[0]}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
