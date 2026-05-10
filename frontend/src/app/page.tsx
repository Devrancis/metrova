"use client";
import React, { useState, useEffect } from 'react';
import { useMetrovaStream } from "@/hooks/useMetrovaStream";
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { Users, Cpu, Server, Activity } from 'lucide-react';

const INITIAL_NODES = [
  'us-east-1a','us-east-1b','us-west-2a','eu-west-1a',
  'eu-central-1','ap-se-1','ap-ne-1','sa-east-1',
  'ca-central-1','af-south-1','me-south-1','ap-south-1'
].map(id => ({ id, status: 'ok', load: 30 + Math.round(Math.random() * 50) }));

export default function MetrovaDashboard() {
  const { data, isConnected } = useMetrovaStream(process.env.NEXT_PUBLIC_METROVA_WS_URL!);
  
  const [history, setHistory] = useState<any[]>([]);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [time, setTime] = useState("--:--:--");

  // INITIAL HYDRATION
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_METROVA_WS_URL!);
        if (!res.ok) throw new Error("Failed to fetch history");
        const pastData = await res.json();
        
        // Inject the vault data straight into the chart state
        if (pastData.length > 0) {
          setHistory(pastData);
        }
      } catch (error) {
        console.error("Hydration failed. Waiting for live WebSocket stream...", error);
      }
    };
    
    fetchHistory();
  }, []);

  // Live Clock & Node Health Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
      
      // Randomly shift node health to simulate network fluctuations
      setNodes(prev => prev.map(n => {
        let status = n.status;
        const rand = Math.random();
        if (rand > 0.96) status = Math.random() > 0.6 ? 'warn' : 'ok';
        else if (status === 'crit') status = 'warn';
        else if (status === 'warn' && Math.random() > 0.55) status = 'ok';
        
        return { 
          ...n, 
          status, 
          load: Math.round(Math.max(10, Math.min(99, n.load + (Math.random() - 0.48) * 8))) 
        };
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Ingest WebSocket Data
  useEffect(() => {
    if (data) {
      const t = new Date().toLocaleTimeString('en-US', { hour12: false });
      setHistory(prev => {
        const newHistory = [...prev, { ...data, time: t }];
        return newHistory.length > 35 ? newHistory.slice(-35) : newHistory;
      });
    }
  }, [data]);

  // Derived Values for KPIs
  const current = history[history.length - 1] || { active_users: 0, cpu_load_percent: 0, memory_usage_gb: 0, network_latency_ms: 0 };
  const previous = history[history.length - 2] || current;
  const userDiff = current.active_users - previous.active_users;
  
  const okNodes = nodes.filter(n => n.status === 'ok').length;
  const warnNodes = nodes.filter(n => n.status === 'warn').length;
  const critNodes = nodes.filter(n => n.status === 'crit').length;

  return (
    <main className="min-h-screen bg-[#050A0E] text-slate-300 font-mono p-4">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-[#1A2C38]">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[17px] font-medium tracking-wide text-white">Metrova</h1>
            <span className="text-[11px] text-slate-500">// core analytics matrix</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#1D9E75] animate-pulse' : 'bg-[#E24B4A]'}`} />
              <span>ws connected</span>
            </div>
            <span>nodes {nodes.length}/12</span>
            <span className="text-[13px] font-medium text-white">{time}</span>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#0A1219] border border-[#1A2C38] rounded p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
              <Users size={14} /> Active users
            </div>
            <div className="text-2xl font-medium text-[#378ADD] mb-1">{current.active_users.toLocaleString()}</div>
            <div className={`text-[11px] ${userDiff >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
              {userDiff >= 0 ? '▲' : '▼'} {Math.abs(userDiff).toLocaleString()}/tick
            </div>
          </div>

          <div className="bg-[#0A1219] border border-[#1A2C38] rounded p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
              <Cpu size={14} /> CPU load
            </div>
            <div className={`text-2xl font-medium mb-1 ${current.cpu_load_percent > 80 ? 'text-[#E24B4A]' : current.cpu_load_percent > 60 ? 'text-[#BA7517]' : 'text-[#1D9E75]'}`}>
              {current.cpu_load_percent}%
            </div>
            <div className="text-[11px] text-slate-500">
              {current.cpu_load_percent > 80 ? '⚠ high load' : current.cpu_load_percent > 60 ? 'elevated' : '● nominal'}
            </div>
          </div>

          <div className="bg-[#0A1219] border border-[#1A2C38] rounded p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
              <Server size={14} /> Memory util
            </div>
            <div className="text-2xl font-medium text-[#7F77DD] mb-1">
              {Math.round((current.memory_usage_gb / 64) * 100) || 0}%
            </div>
            <div className="text-[11px] text-slate-500">{current.memory_usage_gb} / 64.0 GB</div>
          </div>

          <div className="bg-[#0A1219] border border-[#1A2C38] rounded p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
              <Activity size={14} /> Net latency
            </div>
            <div className={`text-2xl font-medium mb-1 ${current.network_latency_ms < 50 ? 'text-[#1D9E75]' : 'text-[#BA7517]'}`}>
              {current.network_latency_ms}ms
            </div>
            <div className="text-[11px] text-slate-500">
              {current.network_latency_ms < 50 ? '● optimal' : '⚠ elevated'}
            </div>
          </div>
        </div>

        {/* CHART ROW 1 */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 bg-[#0A1219] border border-[#1A2C38] rounded p-3 h-[180px] flex flex-col">
            <div className="text-[11px] text-slate-500 mb-2">Traffic stream — active users</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Area type="monotone" dataKey="active_users" stroke="#378ADD" fillOpacity={1} fill="url(#colorUsers)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 bg-[#0A1219] border border-[#1A2C38] rounded p-3 h-[180px] flex flex-col">
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-2">
              <span>CPU & memory load</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#BA7517] rounded-sm" /> CPU</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#7F77DD] rounded-sm" /> Mem</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <YAxis domain={[0, 100]} hide />
                <Line type="monotone" dataKey="cpu_load_percent" stroke="#BA7517" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey={(d) => (d.memory_usage_gb / 64) * 100} stroke="#7F77DD" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART ROW 2 */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2 bg-[#0A1219] border border-[#1A2C38] rounded p-3 h-[180px] flex flex-col">
            <div className="text-[11px] text-slate-500 mb-2">Network latency (ms)</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="network_latency_ms" stroke="#1D9E75" fillOpacity={1} fill="url(#colorLat)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-3 bg-[#0A1219] border border-[#1A2C38] rounded p-3 h-[180px] overflow-hidden">
            <div className="flex justify-between text-[11px] text-slate-500 mb-2">
              <span>Server node status</span>
              <span>{okNodes} ok {warnNodes > 0 && `· ${warnNodes} warn`} {critNodes > 0 && `· ${critNodes} crit`}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {nodes.map(n => (
                <div key={n.id} className={`border rounded p-2 bg-[#050A0E] ${n.status === 'ok' ? 'border-[#1D9E75]/30' : n.status === 'warn' ? 'border-[#BA7517]/50' : 'border-[#E24B4A]/50'}`}>
                  <div className="text-[9px] text-slate-500 mb-1 truncate">{n.id}</div>
                  <div className={`text-[13px] font-medium leading-none ${n.status === 'ok' ? 'text-[#1D9E75]' : n.status === 'warn' ? 'text-[#BA7517]' : 'text-[#E24B4A]'}`}>
                    {n.load}%
                  </div>
                  <div className={`text-[9px] mt-1 ${n.status === 'ok' ? 'text-[#1D9E75]' : n.status === 'warn' ? 'text-[#BA7517]' : 'text-[#E24B4A]'}`}>
                    {n.status === 'ok' ? 'online' : n.status === 'warn' ? 'degraded' : 'critical'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between pt-3 border-t border-[#1A2C38] text-[10px] text-slate-500">
          <span>Metrova engine // telemetry stream // 1.0s tick rate</span>
          <span>FastAPI · WebSocket · Next.js · Recharts</span>
        </div>

      </div>
    </main>
  );
}