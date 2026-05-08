import { ShieldAlert, Activity } from 'lucide-react';

export const LiveFeed = ({ history }: { history: any[] }) => (
  <div className="bg-metrova-surface border border-metrova-border rounded-xl p-4 h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4 border-b border-metrova-border pb-2">
      <Activity size={14} className="text-metrova-primary" />
      <h2 className="text-[10px] font-bold text-white uppercase tracking-widest">Live Activity Log</h2>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      {history.slice().reverse().map((event, i) => (
        <div key={i} className="flex items-center justify-between text-[10px] bg-black/40 p-2 rounded border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">[{event.time}]</span>
            <span className={event.threat_events > 0 ? "text-metrova-alert font-bold" : "text-emerald-500"}>
              {event.threat_events > 0 ? "SURGE_DETECTED" : "SYS_NORMAL"}
            </span>
          </div>
          <span className="text-slate-400">{event.cpu_load_percent}% LOAD</span>
        </div>
      ))}
    </div>
  </div>
);