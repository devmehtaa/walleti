# Walleti

A production-style digital wallet and payments platform built with a modern TypeScript monorepo architecture.

Walleti simulates the core infrastructure of a real-world fintech platform including:

* Peer-to-peer transfers
* Wallet balance management
* Bank on-ramping
* Stripe payment processing
* Merchant integrations
* Async workers and webhook consumers
* Reconciliation systems
* Observability and metrics
* Notification infrastructure

The project is structured as a scalable monorepo using TurboRepo and demonstrates distributed systems, backend architecture, financial workflows, observability, and full-stack engineering concepts.

---

# Architecture Overview

## High-Level System Design

```text
                         ┌────────────────────┐
                         │    User App        │
                         │   Next.js Frontend │
                         └─────────┬──────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │      API Routes          │
                     │   Authentication Layer   │
                     └─────────┬────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
      ┌────────────┐   ┌──────────────┐   ┌──────────────┐
      │ PostgreSQL │   │ Redis Queue  │   │ Wallet Core  │
      │   Prisma   │   │  ioredis     │   │ Business Logic│
      └─────┬──────┘   └──────┬───────┘   └──────┬───────┘
            │                 │                  │
            ▼                 ▼                  ▼
   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │ Notification   │  │ Stripe Webhook│  │ Reconciliation │
   │ Worker         │  │ Consumer      │  │ Worker         │
   └────────────────┘  └────────────────┘  └────────────────┘

```

---

# Monorepo Structure

```text
walleti/
│
├── apps/
│   ├── user-app/                 # Main wallet application
│   ├── merchant-app/             # Merchant-facing app
│   ├── bank-webhook/             # Simulated banking webhook service
│   ├── notification-worker/      # Notification processing worker
│   ├── stripe-webhook-consumer/  # Stripe event consumer
│   └── reconciliation-worker/    # Financial reconciliation service
│
├── packages/
│   ├── db/                       # Prisma schema and DB client
│   ├── wallet-core/              # Core wallet business logic
│   ├── redis/                    # Redis abstraction layer
│   ├── metrics/                  # Prometheus metrics package
│   ├── store/                    # Shared frontend state management
│   ├── ui/                       # Shared UI components
│   ├── eslint-config/            # Shared lint configuration
│   └── typescript-config/        # Shared TypeScript configs
│
├── observability/
│   ├── grafana/                  # Grafana dashboards
│   └── prometheus.yml            # Prometheus configuration
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

# Tech Stack

## Frontend

* TypeScript
* React 18
* Next.js 14 (App Router)
* Tailwind CSS
* Recoil
* NextAuth.js

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* Redis
* Stripe API

## Workers & Async Systems

* Redis-based queues
* Event-driven workers
* Webhook consumers
* Reconciliation processors

## Observability

* Prometheus
* Grafana
* Custom metrics via prom-client

## Tooling

* TurboRepo
* ESLint
* TypeScript
* esbuild
* tsx
* Docker Compose

---

# Core Features

## Authentication System

* Credential-based authentication
* NextAuth integration
* Session management
* Password hashing with bcrypt
* Merchant and user auth flows

## Wallet Infrastructure

* User wallet balances
* Locked balance support
* Atomic transaction handling
* Balance reconciliation

## P2P Transfers

* User-to-user transfers
* Transfer history tracking
* Database-backed ledger entries

## Bank On-Ramp

* Simulated banking integrations
* Webhook-driven payment completion
* On-ramp transaction states:

  * Processing
  * Success
  * Failure

## Stripe Integration

* Stripe webhook consumer
* Payment event processing
* Checkout workflow integration

## Notification System

* Email notifications
* SMS support with Twilio
* Firebase integration
* Async notification processing

## Merchant System

* Merchant-facing application
* Merchant authentication
* Payment workflows

## Reconciliation Engine

* Transaction verification
* Ledger consistency checks
* Financial data reconciliation

## Observability

* Metrics endpoints
* Prometheus scraping
* Grafana dashboards
* Health check APIs

---

# Database Design

The project uses PostgreSQL with Prisma ORM.

## Main Models

### User

Stores platform users.

### Balance

Maintains wallet balances and locked amounts.

### p2pTransfer

Tracks peer-to-peer transactions.

### OnRampTransaction

Tracks bank deposits and payment onboarding.

### Merchant

Stores merchant account information.

---

# Prisma Schema Highlights

## User Relationships

* One-to-many with transfers
* One-to-one with balance
* One-to-many with on-ramp transactions

## Transaction Safety

The architecture is designed to support:

* Atomic operations
* Consistent balance updates
* Event-driven reconciliation
* Distributed transaction processing patterns

---

# Distributed Systems Concepts Used

This project demonstrates several real-world backend engineering concepts.

## Event-Driven Architecture

Workers consume asynchronous events from queues and webhooks.

## Queue-Based Processing

Redis is used for asynchronous workflows and decoupled systems.

## Financial Reconciliation

Background workers validate and reconcile financial records.

## Observability-First Design

Metrics and monitoring are built directly into the system.

## Shared Package Architecture

Reusable business logic is extracted into shared packages.

## Monorepo Development

TurboRepo enables scalable multi-application development.

---

# API & System Components

## User App

Main customer-facing wallet application.

### Includes:

* Dashboard
* P2P transfers
* Transaction history
* Wallet balance views
* Stripe checkout integration
* Notifications

## Merchant App

Merchant-focused frontend application.

## Bank Webhook Service

Simulates bank callbacks and payment confirmations.

## Notification Worker

Processes notification jobs asynchronously.

## Stripe Webhook Consumer

Consumes Stripe payment events.

## Reconciliation Worker

Ensures financial consistency across transactions.

---

# Redis Usage

Redis is used for:

* Async job queues
* Event processing
* Worker communication
* Rate limiting support
* Notification processing

---

# Observability Stack

## Prometheus

Used for metrics collection.

### Metrics include:

* Worker activity
* Request counts
* Queue processing
* Health metrics
* Financial processing metrics

## Grafana

Used for metrics visualization and dashboards.

---

# Local Development Setup

## Prerequisites

Install:

* Node.js 18+
* Docker
* npm

---

# Environment Variables

Create `.env` files where required.

Example variables:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
REDIS_URL=
STRIPE_SECRET_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

Some apps already include `.env.example` files.

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/devmehtaa/walleti.git
cd walleti
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:

* PostgreSQL
* Redis
* Mailhog
* Prometheus
* Grafana

---

# Database Setup

## Generate Prisma Client

```bash
cd packages/db
npx prisma generate
```

## Run Migrations

```bash
npx prisma migrate dev
```

---

# Running the Project

## Start All Apps

```bash
npm run dev
```

## Start Workers

```bash
npm run workers:dev
```

---

# Application Ports

| Service      | Port |
| ------------ | ---- |
| User App     | 3001 |
| Merchant App | 3000 |
| PostgreSQL   | 5432 |
| Redis        | 6379 |
| Prometheus   | 9090 |
| Grafana      | 3000 |
| Mailhog UI   | 8025 |
| Mailhog SMTP | 1025 |

---

# Reproducing the Project

## Full Reproduction Workflow

```bash
# Clone repo
git clone https://github.com/devmehtaa/walleti.git
cd walleti

# Install dependencies
npm install

# Start infrastructure
docker-compose up -d

# Configure env variables
cp apps/user-app/.env.example apps/user-app/.env
cp apps/notification-worker/.env.example apps/notification-worker/.env
cp packages/db/.env.example packages/db/.env

# Generate Prisma client
cd packages/db
npx prisma generate
npx prisma migrate dev
cd ../..

# Start development servers
npm run dev

# Start workers
npm run workers:dev
```

---

# Production Engineering Concepts Demonstrated

This project showcases:

* Monorepo architecture
* Shared package management
* Event-driven systems
* Background job processing
* Payment infrastructure
* Webhook systems
* Distributed worker architecture
* Financial transaction systems
* Queue-based workflows
* Metrics and monitoring
* Scalable TypeScript architecture
* Shared business logic layers

---

# Security Concepts

* Password hashing with bcrypt
* Session-based authentication
* Environment variable management
* Separated worker responsibilities
* Database transaction safety patterns

---

# Future Improvements

Potential extensions for the platform:

* Kubernetes deployment
* Kafka integration
* Distributed tracing
* Multi-currency support
* Ledger-based accounting engine
* Fraud detection systems
* Real banking integrations
* Role-based access control
* Rate limiting middleware
* Audit logging
* CI/CD pipelines
* End-to-end testing
* Mobile application

---

# Learning Outcomes

This repository is a strong reference project for learning:

* Full-stack fintech systems
* Backend architecture
* Distributed systems
* Worker-based processing
* Payment infrastructure
* Observability systems
* Monorepo engineering
* Financial transaction modeling
* Queue systems with Redis
* Production-grade TypeScript architecture

---

# Author

Built by Dev Mehta.

GitHub: [https://github.com/devmehtaa](https://github.com/devmehtaa)

---

# License

This project is for educational and portfolio purposes.
