CREATE TABLE telemetry_logs (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL,
    cpu_load_percent NUMERIC(5, 2) NOT NULL,
    memory_usage_gb NUMERIC(6, 2) NOT NULL,
    active_users INTEGER NOT NULL,
    network_latency_ms INTEGER NOT NULL,
    threat_events INTEGER DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_recorded_at ON telemetry_logs(recorded_at DESC);
CREATE INDEX idx_telemetry_node ON telemetry_logs(node_id);