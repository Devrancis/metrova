from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import json
from datetime import datetime

app = FastAPI(title="Metrova Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Metrova Engine Online. Awaiting WebSocket connections."}

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[*] Dashboard UI Connected to Metrova Stream.")
    try:
        while True:
            # Generate simulated real-time infrastructure data
            payload = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "active_users": random.randint(10000, 15000),
                "cpu_load_percent": round(random.uniform(30.0, 85.0), 1),
                "memory_usage_gb": round(random.uniform(16.0, 64.0), 2),
                "network_latency_ms": random.randint(12, 105),
                "threat_events": random.randint(0, 3) # Random spikes for visual interest
            }
            
            # Broadcast the data and wait 1 second
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        print("[!] Dashboard UI Disconnected.")