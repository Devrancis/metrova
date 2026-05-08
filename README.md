<div align="center">

<br />

# METROVA

### Core Analytics Matrix

**A high-performance, real-time infrastructure and telemetry visualization engine.**

Metrova monitors global traffic, server loads, and system latency with sub-second accuracy — powered by a persistent WebSocket pipeline that streams live data directly to a dynamic frontend matrix.

<br />

![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20Next.js-blue?style=flat-square)
![Protocol](https://img.shields.io/badge/protocol-WebSocket-orange?style=flat-square)

</div>

---

## Overview

Metrova is built around one core principle: **data should reach the screen the moment it exists.** By replacing traditional REST polling with a persistent, bi-directional WebSocket tunnel, Metrova eliminates the latency gap between infrastructure events and operator awareness.

The platform ships with a built-in telemetry simulation engine, making it immediately runnable without external data sources — while being fully architected for production-grade ingestion pipelines.

---

## Architecture

Metrova is built on a decoupled, high-speed architecture optimized for real-time data ingestion and rendering.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│         Next.js (App Router) · Recharts · D3.js             │
│              useMetrovaStream (WebSocket Hook)               │
└────────────────────────────┬────────────────────────────────┘
                             │  WebSocket (ws://)
                             │  Persistent Tunnel
┌────────────────────────────▼────────────────────────────────┐
│                        ENGINE LAYER                         │
│            FastAPI · Uvicorn (ASGI) · asyncio               │
│              Non-blocking broadcast pipeline                │
└────────────────────────────┬────────────────────────────────┘
                             │  (Phase 3)
┌────────────────────────────▼────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│         PostgreSQL (Neon) · AWS ECS · Vercel/Amplify        │
└─────────────────────────────────────────────────────────────┘
```

### Frontend — The Receiver

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router) / React |
| Styling | Tailwind CSS |
| Data Visualization | Recharts (primary) + D3.js (advanced mapping) |
| Stream Connection | Native Browser WebSockets via `useMetrovaStream` hook |

### Backend — The Engine

| Concern | Technology |
|---|---|
| Framework | Python / FastAPI |
| Server | Uvicorn (ASGI) |
| Protocol | WebSockets — bi-directional persistent tunneling |
| Concurrency | `asyncio` — non-blocking data broadcasting |

### Database & Infrastructure — Phase 3 Integration

| Concern | Technology |
|---|---|
| Database | PostgreSQL via Neon (time-series optimized) |
| Backend Hosting | AWS App Runner / Elastic Container Service (ECS) |
| Frontend Hosting | Vercel / AWS Amplify |

---

## Core Features

### Zero-Latency Streaming
Metrova bypasses traditional REST/HTTP polling in favor of a persistent WebSocket tunnel. Updates are pushed to the client the instant they occur — no intervals, no stale snapshots.

### Dynamic Rendering
Client-side hydration of complex D3 and Recharts components is handled without blocking the browser thread, ensuring smooth, responsive visuals even under high-frequency data loads.

### Telemetry Simulation Engine
A built-in data generation engine simulates realistic infrastructure signals out of the box — including active user counts, CPU load percentages, memory utilization, and network latency — enabling full local development without live backend dependencies.

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A virtual environment manager (recommended: `venv` or `conda`)

---

### 1. Start the Backend Engine

The FastAPI backend operates on port `8000`.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The WebSocket endpoint will be live at:
```
ws://localhost:8000/ws
```

---

### 2. Start the Frontend

The Next.js frontend operates on port `3000`.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## Project Structure

```
metrova/
├── backend/
│   ├── main.py                 # FastAPI app + WebSocket handler
│   ├── simulator.py            # Telemetry data generation engine
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Dashboard entry point
│   ├── components/
│   │   ├── charts/             # Recharts & D3 visualization components
│   │   └── widgets/            # Metric cards, status panels
│   ├── hooks/
│   │   └── useMetrovaStream.ts # Custom WebSocket stream hook
│   ├── public/
│   ├── tailwind.config.ts
│   └── package.json
│
└── README.md
```

---

## The `useMetrovaStream` Hook

The core of Metrova's frontend is a custom React hook that manages the WebSocket lifecycle — handling connection, reconnection, and live state updates with zero polling overhead.

```typescript
import { useMetrovaStream } from '@/hooks/useMetrovaStream';

const { data, status } = useMetrovaStream('ws://localhost:8000/ws');

// data  → latest telemetry payload
// status → 'connecting' | 'connected' | 'disconnected'
```

---

## Telemetry Payload Schema

Each WebSocket message delivers a structured JSON payload:

```json
{
  "timestamp": "2025-08-14T12:34:56.789Z",
  "active_users": 24871,
  "cpu_load": 67.3,
  "memory_utilization": 73.1,
  "network_latency_ms": 12,
  "nodes": [
    { "id": "us-east-1a", "status": "ok", "load": 54 },
    { "id": "eu-west-1a", "status": "degraded", "load": 88 }
  ]
}
```

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Core WebSocket pipeline, telemetry simulation, frontend matrix | ✅ Complete |
| Phase 2 | Custom `useMetrovaStream` hook, D3 advanced mapping, alert thresholds | 🔄 In Progress |
| Phase 3 | PostgreSQL (Neon) time-series persistence, AWS ECS deployment, multi-tenant support | 🔲 Planned |

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request so the proposed change can be discussed first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---


<div align="center">
  <sub>Built with FastAPI · WebSocket · Next.js · Recharts · D3.js</sub>
</div>