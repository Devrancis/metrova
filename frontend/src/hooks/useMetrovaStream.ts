import { useState, useEffect, useRef } from 'react';

export interface MetrovaMetrics {
  timestamp: string;
  active_users: number;
  cpu_load_percent: number;
  memory_usage_gb: number;
  network_latency_ms: number;
  threat_events: number;
}

export function useMetrovaStream(url: string) {
  const [data, setData] = useState<MetrovaMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, [url]);

  return { data, isConnected };
}