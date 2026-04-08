# Strata Platform

A unified AI operating system for business (Flare) and personal life (Lyvo), built on a shared intelligence core.

## Core Principle

**Own the data layer. Deliver proactive intelligence. Build compounding memory.**

## Architecture Overview

```
Strata Platform
├── Flare (Business Copilot)
├── Lyvo (Personal AI)
└── Shared Core
    ├── Connector Framework
    ├── AI Inference Layer
    ├── Entity Memory Graph
    ├── Decision Engine
    ├── Anomaly + Prediction Engine
    ├── Task Orchestrator
    ├── Context Engine
    ├── Notification Router
    └── Auth & RBAC
```

## Monorepo Structure

```
/workspace
├── apps/
│   ├── flare/              # Business web application (Next.js)
│   └── lyvo/               # Personal mobile app (React Native)
├── services/
│   ├── api/                # Main API gateway (NestJS, Port 3001)
│   ├── pipeline/           # Data processing pipeline (Port 3002)
│   ├── ai/                 # AI inference layer (Port 3003)
│   ├── transcription/      # Meeting transcription (Port 3004)
│   ├── capture-agent/      # Desktop capture agent (Electron)
│   ├── visual-processor/   # Screenshot analysis (Port 3005)
│   ├── decision-engine/    # Decision support system
│   ├── orchestrator/       # Task execution engine
│   ├── context-engine/     # Relevance filtering
│   └── notifications/      # Notification routing
├── packages/
│   ├── @strata/shared/     # Shared types and utilities
│   └── @strata/connectors/ # Data source connectors
└── infrastructure/
    └── database/           # Database schemas and migrations
```

## Services

### API Service (`services/api`)
- **Port**: 3001
- **Tech**: NestJS, PostgreSQL, pgvector
- **Purpose**: Main API gateway, authentication, data access layer

### Pipeline Service (`services/pipeline`)
- **Port**: 3002
- **Tech**: Node.js, BullMQ, Redis
- **Purpose**: Data ingestion, normalization, enrichment

### AI Service (`services/ai`)
- **Port**: 3003
- **Tech**: NestJS, LangChain, OpenAI
- **Purpose**: LLM inference, narrative generation, intent detection

#### Modules:
- **Narrative Module**: Generate business/personal insights from data
- **Intent Module**: Detect intents, extract commitments, classify communications
- **Decision Support Module**: Analyze decisions, simulate scenarios, compare options

### Transcription Service (`services/transcription`)
- **Port**: 3004
- **Tech**: NestJS, Whisper, speaker diarization
- **Purpose**: Meeting audio transcription, speaker identification

#### Features:
- Self-hosted Whisper integration
- Speaker diarization
- Real-time streaming transcription
- Audio optimization

### Capture Agent (`services/capture-agent`)
- **Type**: Electron desktop application
- **Purpose**: Local window-scoped meeting capture

#### Features:
- Window-specific recording (no full desktop)
- Meeting auto-detection (Zoom, Meet, Teams, etc.)
- One-click start/stop
- Privacy-first design

### Visual Processor (`services/visual-processor`)
- **Port**: 3005
- **Tech**: NestJS, Sharp, vision models
- **Purpose**: Screenshot analysis and relevance scoring

#### Features:
- Automated visual snippet capture
- Visual element detection (charts, slides, tables)
- OCR text extraction
- Relevance scoring based on transcript correlation
- Change detection between frames

## Entity Memory Graph

The core intelligence layer that stores and learns from:

- **Entities**: People, businesses, accounts
- **Events**: Messages, meetings, transactions
- **Relationships**: Structural connections between entities
- **Temporal Patterns**: Time-based behaviors and trends
- **Decisions & Outcomes**: Historical choices and results

### Stack
- PostgreSQL + pgvector for vector embeddings
- Logical graph layer for relationship mapping
- Redis cache for fast retrieval

## Key Capabilities

### Decision Engine
- Generates recommendations with trade-offs
- Supports simulation and what-if analysis
- Executes user-approved actions

### Task Orchestrator
- Executes actions across connected systems
- Fully logged and reversible operations
- Trigger-based workflow automation

### Prediction Engine
- Forecasting (revenue, expenses, trends)
- Risk detection and anomaly alerts
- Pattern learning from historical data

### Context Engine
- Filters noise and prioritizes relevance
- Cross-domain intelligence (business ↔ personal)
- Availability-aware notification routing

### Meeting Intelligence
- Bot-free local capture option
- Window-scoped recording (privacy-first)
- Automated visual snippet capture
- Conversation intelligence (tone, topics, unresolved items)
- Knowledge extraction to memory graph

## Data Flow Pipeline

```
Source → Connector → Raw Storage → Normalize → Enrich →
Detect → Predict → Decide → Act → Deliver
```

## Security & Privacy

- **Full ownership** of sensitive data
- **No third-party** raw data storage
- **AES-256** encryption at rest
- **TLS 1.3** encryption in transit
- **Tenant isolation** for multi-tenant deployments
- **User-controlled** data boundaries and retention
- **Window-scoped** capture prevents accidental exposure
- **Ephemeral by default** - unapproved captures auto-delete

## Technical Stack

### Frontend
- **Flare**: Next.js 14, React, TypeScript, TailwindCSS
- **Lyvo**: React Native, Expo

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Language**: TypeScript

### Data
- **Primary DB**: PostgreSQL 15+ with pgvector
- **Analytics**: ClickHouse
- **Cache**: Redis
- **Queue**: BullMQ

### AI/ML
- **LLM**: OpenAI GPT-4, LangChain
- **Transcription**: Whisper (self-hosted)
- **Vision**: GPT-4 Vision / custom models
- **Embeddings**: pgvector

### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes (optional)
- **Cloud**: AWS

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- Docker (for containerized deployment)

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start databases (Docker)
docker-compose up -d postgres redis

# Run migrations
npm run migrate

# Start all services
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/strata
REDIS_HOST=localhost
REDIS_PORT=6379

# AI
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4-turbo

# Services
API_PORT=3001
AI_SERVICE_URL=http://localhost:3003
TRANSCRIPTION_SERVICE_URL=http://localhost:3004
VISUAL_PROCESSOR_URL=http://localhost:3005
```

## API Endpoints

### Core API (Port 3001)
- `POST /api/auth/*` - Authentication
- `GET /api/entities/*` - Entity management
- `GET /api/insights/*` - AI-generated insights
- `POST /api/decisions/*` - Decision analysis
- `GET /api/meetings/*` - Meeting data

### AI Service (Port 3003)
- `POST /ai/narrative/generate` - Generate narratives
- `POST /ai/intent/detect` - Intent detection
- `POST /ai/decision/analyze` - Decision analysis
- `POST /ai/scenario/simulate` - Scenario simulation

### Transcription Service (Port 3004)
- `POST /transcribe/audio` - Transcribe audio file
- `POST /transcribe/stream` - Real-time transcription
- `GET /transcribe/status/:id` - Job status

### Visual Processor (Port 3005)
- `POST /visual/process` - Process screenshot
- `POST /visual/analyze-relevance` - Relevance scoring
- `POST /visual/compare` - Compare images

## Differentiation

1. **Decision-First System**: Not just insights - actionable recommendations with execution
2. **Memory Graph**: Compounding intelligence that learns from every interaction
3. **Cross-Domain Intelligence**: Connects business and personal contexts
4. **Execution Layer**: Actually performs tasks, not just suggests them
5. **Privacy-First Capture**: Local, window-scoped, user-controlled
6. **Visual-Aware Meetings**: Captures slides, demos, and visual context

## Roadmap

### Phase 1: Foundation (Current)
- [x] Core service architecture
- [x] Entity Memory Graph schema
- [x] AI service with narrative/intent/decision modules
- [x] Transcription service
- [x] Capture agent (Electron)
- [x] Visual processor

### Phase 2: Integration
- [ ] Connector framework implementation
- [ ] Frontend applications (Flare, Lyvo)
- [ ] Cross-domain intelligence features
- [ ] Advanced prediction models

### Phase 3: Intelligence
- [ ] Compounding memory learning
- [ ] Autonomous task execution
- [ ] Advanced scenario simulation
- [ ] Multi-entity business support

## Contributing

See CONTRIBUTING.md for development guidelines.

## License

Proprietary - All rights reserved.
