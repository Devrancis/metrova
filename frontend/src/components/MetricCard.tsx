import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | undefined;
  icon: LucideIcon;
  color: string;
}

export const MetricCard = ({ title, value, icon: Icon, color }: MetricCardProps) => (
  <div className="bg-metrova-surface border border-metrova-border p-5 rounded-xl hover:border-metrova-primary/50 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</span>
      <Icon className={`${color} group-hover:scale-110 transition-transform`} size={18} />
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">
      {value ?? "---"}
    </div>
  </div>
);