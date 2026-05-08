from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from typing import List, Dict
import json
import os

app = FastAPI()
 
# SECURITY VAULT
VALID_API_KEYS = {
    "metrova_sk_live_98a7sd98f7asdf": "client_futa_001"
}

 
# CONNECTION MANAGER 
class ConnectionManager:
    def __init__(self):
        self.active_frontends: List[WebSocket] = []

    async def connect_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.active_frontends.append(websocket)
        print(f"[UI] Dashboard Connected. Total active: {len(self.active_frontends)}")

    def disconnect_frontend(self, websocket: WebSocket):
        self.active_frontends.remove(websocket)
        print(f"[UI] Dashboard Disconnected. Total active: {len(self.active_frontends)}")

    async def broadcast_to_dashboards(self, message: dict):
        # Sends the incoming agent data to all connected frontends
        for connection in self.active_frontends:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Failed to send to a dashboard: {e}")

manager = ConnectionManager()

 
# PIPELINE 1: FRONTEND BROADCAST 
@app.websocket("/ws/metrics")
async def frontend_endpoint(websocket: WebSocket):
    await manager.connect_frontend(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_frontend(websocket)

 
# PIPELINE 2: AGENT INGESTION 
async def verify_agent_token(websocket: WebSocket) -> str:
    # Look for the Authorization header
    auth_header = websocket.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketDisconnect()
    
    token = auth_header.split(" ")[1]
    if token not in VALID_API_KEYS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketDisconnect()
        
    return VALID_API_KEYS[token]


@app.websocket("/ingest")
async def agent_ingest_endpoint(websocket: WebSocket):
    try:
        # 1. Zero-Trust Verification
        client_id = await verify_agent_token(websocket)
        await websocket.accept()
        print(f"[AGENT] Secure connection established for: {client_id}")
        
        # 2. Continuous Data Ingestion
        while True:
            # Receive data from the server agent
            data = await websocket.receive_json()
            
            # 3. Instantly route it to the frontends
            await manager.broadcast_to_dashboards(data)
            
    except WebSocketDisconnect:
        print("[AGENT] Connection lost.")
    except Exception as e:
        print(f"[AGENT] Ingestion Error: {e}")