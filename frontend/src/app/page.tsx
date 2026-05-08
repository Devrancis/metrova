"use client";
import React from 'react';
import { useMetrovaStream } from "@/hooks/useMetrovaStream";
import { LineChart, Line, ResponsiveContainer, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, Users, Cpu, HardDrive, ShieldAlert } from 'lucide-react';

export default function MetrovaDashboard() {
  const { data, isConnected } = useMetrovaStream("ws://localhost:8000/ws/metrics");

  // Keep a small buffer for the chart (last 20 points)
  const [history, setHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (data) {
      setHistory(prev => [...prev.slice(-19), { ...data, time: new Date().toLocaleTimeString() }]);
    }
  }, [data]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-[#0A1219] border border-[#1A2C38] p-5 rounded-lg shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <Icon className={color} size={20} />
      </div>
      <div className="text-2xl font-black text-white">{value || "---"}</div>
    </div>
  );

  return (
    <main className="min-h-screen p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#1A2C38] pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">METROVA<span className="text-emerald-500">.ENGINE</span></h1>
          <p className="text-slate-500 text-xs mt-1 font-bold">REAL-TIME INFRASTRUCTURE TELEMETRY</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0A1219] px-4 py-2 rounded-full border border-[#1A2C38]">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-slate-400">
            {isConnected ? "WEBSOCKET: ACTIVE" : "ENGINE: OFFLINE"}
          </span>
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Streams" value={data?.active_users.toLocaleString()} icon={Users} color="text-blue-400" />
        <StatCard title="CPU Utilization" value={`${data?.cpu_load_percent}%`} icon={Cpu} color="text-emerald-400" />
        <StatCard title="Memory Allocation" value={`${data?.memory_usage_gb} GB`} icon={HardDrive} color="text-purple-400" />
        <StatCard title="Security Events" value={data?.threat_events} icon={ShieldAlert} color="text-red-500" />
      </div>

      {/* Main Chart Section */}
      <div className="bg-[#0A1219] border border-[#1A2C38] p-6 rounded-lg h-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={16} className="text-emerald-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live System Load (CPU %)</h2>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2C38" vertical={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#050A0E', border: '1px solid #1A2C38', borderRadius: '8px' }}
              itemStyle={{ color: '#10B981' }}
            />
            <Line 
              type="monotone" 
              dataKey="cpu_load_percent" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}