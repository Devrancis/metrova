import asyncio
import json
import os
import asyncpg
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_DATABASE_URL")
METROVA_ENDPOINT = os.getenv("METROVA_INGEST_URL", "ws://localhost:8000/ingest")
VALID_API_KEYS = {"metrova_sk_live_98a7sd98f7asdf": "client_futa_001"}

# DATABASE CONNECTION POOL

db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    print("[SYSTEM] Booting Metrova Engine...")
    print("[DB] Initializing secure connection to Neon PostgreSQL...")
    try:
        # Create a connection pool to handle thousands of rapid inserts
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        print("[DB] SUCCESS: Neon Vault is online and connected.")
    except Exception as e:
        print(f"[DB] CRITICAL ERROR: Could not connect to Neon Vault. Check your .env file. Error: {e}")
    
    yield
    
    if db_pool:
        print("[DB] Closing Neon connection pool...")
        await db_pool.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"], 
    allow_headers=["*"],
)

# CONNECTION MANAGER 

class ConnectionManager:
    def __init__(self):
        self.active_frontends: List[WebSocket] = []

    async def connect_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.active_frontends.append(websocket)
        print(f"[UI] Dashboard Connected. Total active: {len(self.active_frontends)}")

    def disconnect_frontend(self, websocket: WebSocket):
        if websocket in self.active_frontends:
            self.active_frontends.remove(websocket)
            print(f"[UI] Dashboard Disconnected. Total active: {len(self.active_frontends)}")

    async def broadcast(self, message: dict):
        for connection in self.active_frontends:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[UI] Broadcast error: {e}")

manager = ConnectionManager()


# DATABASE INGESTION TASK (Fire and Forget)

async def log_telemetry_to_db(data: dict):
    """Silently writes telemetry to Neon in the background."""
    if not db_pool:
        return
        
    query = """
        INSERT INTO telemetry_logs 
        (node_id, cpu_load_percent, memory_usage_gb, active_users, network_latency_ms, threat_events)
        VALUES ($1, $2, $3, $4, $5, $6)
    """
    try:
        async with db_pool.acquire() as connection:
            await connection.execute(
                query,
                data.get("node_id", "unknown"),
                data.get("cpu_load_percent", 0),
                data.get("memory_usage_gb", 0),
                data.get("active_users", 0),
                data.get("network_latency_ms", 0),
                data.get("threat_events", 0)
            )
            # print(f"[DB] Logged ping from {data.get('node_id')} to Neon.") # Uncomment to see DB writes in terminal
    except Exception as e:
        print(f"[DB ERROR] Failed to insert log: {e}")


# PIPELINE 1: FRONTEND BROADCAST (Next.js listens here)

@app.websocket("/ws/metrics")
async def frontend_endpoint(websocket: WebSocket):
    await manager.connect_frontend(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_frontend(websocket)


# PIPELINE 2: AGENT INGESTION (Servers push here)

async def verify_agent_token(websocket: WebSocket) -> str:
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
        client_id = await verify_agent_token(websocket)
        await websocket.accept()
        print(f"[AGENT] Secure connection established for: {client_id}")
        
        while True:
            data = await websocket.receive_json()
            
            # 1. Instantly route it to the frontends (Zero Latency)
            await manager.broadcast(data)
            
            # 2. Hand it off to Neon in the background (Non-Blocking)
            asyncio.create_task(log_telemetry_to_db(data))
            
    except WebSocketDisconnect:
        print("[AGENT] Connection lost.")
    except Exception as e:
        print(f"[AGENT] Ingestion Error: {e}")


# PIPELINE 3: STATE HYDRATION (REST API)

@app.get("/api/history")
async def get_telemetry_history():
    """Fetches the last 35 pings from the Neon Vault to hydrate the UI."""
    if not db_pool:
        return []
        
    query = """
        SELECT node_id, cpu_load_percent, memory_usage_gb, active_users, network_latency_ms, threat_events, recorded_at
        FROM telemetry_logs
        ORDER BY recorded_at DESC
        LIMIT 35
    """
    try:
        async with db_pool.acquire() as connection:
            records = await connection.fetch(query)
            
            # Convert DB records to dictionaries
            history = [dict(record) for record in records]
            
            # Reverse the list so chronological order is correct for the charts (oldest -> newest)
            history.reverse()

            # Format the PostgreSQL timestamp into the exact string the React charts expect
            for item in history:
                item['time'] = item['recorded_at'].strftime("%H:%M:%S")

            return history
    except Exception as e:
        print(f"[DB ERROR] Failed to fetch history: {e}")
        return []