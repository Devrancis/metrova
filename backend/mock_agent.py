import asyncio
import websockets
import json
import time
import random

METROVA_ENDPOINT = "ws://localhost:8000/ingest"

API_KEY = "metrova_sk_live_98a7sd98f7asdf"
NODE_ID = "local-dev-node"

async def generate_mock_telemetry():
    """Simulates a server experiencing varying loads."""
    return {
        "node_id": NODE_ID,
        "cpu_load_percent": round(random.uniform(10.0, 95.0), 1),
        "memory_usage_gb": round(random.uniform(4.0, 60.0), 1),
        "active_users": random.randint(1000, 50000),
        "network_latency_ms": random.randint(5, 120),
        "threat_events": random.choices([0, 1, 5], weights=[0.9, 0.08, 0.02])[0],
        "timestamp": time.time()
    }

async def run_mock_agent():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    print(f"[*] Starting Mock Agent...")
    print(f"[*] Attempting secure handshake with {METROVA_ENDPOINT}")

    try:
        async with websockets.connect(METROVA_ENDPOINT, extra_headers=headers) as websocket:
            print("[+] Handshake accepted. Tunnel secured.")
            print("[+] Streaming live telemetry... (Press Ctrl+C to stop)")
            
            while True:
                # 1. Generate fake server vitals
                payload = await generate_mock_telemetry()
                
                # 2. Fire it through the WebSocket
                await websocket.send(json.dumps(payload))
                
                # Print to terminal
                print(f"    -> Sent: CPU {payload['cpu_load_percent']}% | Memory {payload['memory_usage_gb']}GB")
                
                # 3. Wait 1 second (our engine tick rate)
                await asyncio.sleep(1)
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"[-] Authentication Failed! Server rejected the connection: {e}")
    except ConnectionRefusedError:
        print("[-] Connection Refused. Is the FastAPI server running on port 8000?")

if __name__ == "__main__":
    try:
        asyncio.run(run_mock_agent())
    except KeyboardInterrupt:
        print("\n[*] Mock Agent shut down by operator.")