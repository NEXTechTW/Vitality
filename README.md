<div align="center">

# Vitality

**Know the health of your open source.**

An open standard and toolkit for measuring open source project health — maintenance activity, community strength, security posture, and release stability — in a way that's transparent, deterministic, and reproducible.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol Version](https://img.shields.io/badge/protocol-v1.0-informational)](schemas/vitality.schema.json)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

[Why Vitality](#why-vitality) · [How It Works](#how-it-works) · [Monorepo Architecture](#monorepo-architecture) · [CLI Usage](#cli-usage) · [Scoring Engine](#scoring-engine) · [Web Dashboard](#web-dashboard)

</div>

---

## Why Vitality?

Stars and forks tell you how popular a project *was*. They don't tell you whether it's actually maintained *right now*.

A project with 20,000 stars might be abandoned. A project with 2,000 stars might have an active maintainer team, fast issue response, and a clean security record. Vitality answers the question your dependency graph actually cares about:

> **Is this project healthy, right now — and can I prove it?**

Vitality analyzes a repository across four dimensions — **Maintenance**, **Community**, **Security**, and **Releases** — and produces a single, explainable health score backed by a standardized, versioned data format: `vitality.json`.

```
Vitality Health Report: facebook/react
Overall Score: 92 / 100 [A]

Maintenance: [██████████████████░░]  91/100
Community:   [███████████████████░]  96/100
Security:    [███████████████████░]  95/100
Releases:    [█████████████████░░░]  87/100

✔ Provenance: sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
✔ Report saved to vitality.json
```

---

## Core Principles

- **Deterministic scoring:** Given the same input snapshot, the score is always byte-identical. No LLMs are ever inside the scoring path.
- **Fully explainable:** Every score provides an exact mathematical delta breakdown of factors that contributed points.
- **Reproducible:** Every report includes a SHA-256 computation hash. Anyone can re-run the engine on the same input data to verify the hash.
- **Zero-Trust Boundaries:** Enforced via `dependency-cruiser` in CI — the scoring engine is strictly forbidden from importing network clients, filesystem modules, or LLM SDKs.
- **100% Open Source:** Built with Apache 2.0.

---

## How It Works

```
GitHub GraphQL API / OSV Database
        │
        ▼
   Collectors  ──►  Normalizer  ──►  Scoring Engine  ──►  vitality.json
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          ▼                   ▼                   ▼
                                         CLI                 API              Dashboard
                                          │                   │               (React 19)
                                          ▼                   ▼
                                    GitHub Actions       SVG Badges
```

The scoring engine is a pure function: it accepts normalized repository data and returns scores and breakdown items — zero side effects. Everything else in the system (CLI, API, Dashboard, CI Actions) consumes that deterministic core.

---

## Monorepo Architecture

Vitality is organized as a pnpm monorepo managed with Turborepo:

| Package | Purpose |
|---|---|
| [`schemas/`](schemas/vitality.schema.json) | Standardized JSON Schema definition for `vitality.json` (Protocol v1.0). |
| [`@vitality/scoring-engine`](packages/scoring-engine) | Pure deterministic scoring library. 0 network/filesystem I/O. |
| [`@vitality/collectors`](packages/collectors) | GitHub GraphQL API & OSV vulnerability harvester + data normalizer. |
| [`@vitality/cli`](packages/cli) | Terminal tool with ASCII visualizers, schema validation, and exit code policies. |
| [`@vitality/api`](packages/api) | Fastify REST API, PostgreSQL audit snapshots, Redis caching, and SVG badge generator. |
| [`@vitality/dashboard`](packages/dashboard) | Dark-mode React 19 + Vite web dashboard with live animated gauges and Recharts trends. |

---

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation & Build
```bash
# Clone the repository
git clone https://github.com/<your-username>/vitality.git
cd vitality

# Install dependencies
pnpm install

# Build all monorepo packages
pnpm build

# Run all test suites
pnpm test

# Check architectural boundary rules
pnpm check:boundaries
```

---

## CLI Usage

Run analysis directly from your terminal:

```bash
# Analyze a repository
pnpm --filter @vitality/cli dev analyze facebook/react

# Or using the built binary
node packages/cli/dist/bin.js analyze vercel/next.js
```

Options:
```
Options:
  -t, --token <token>    GitHub Personal Access Token (or GITHUB_TOKEN env)
  -o, --output <path>    Output file path (default: "vitality.json")
  --min-score <score>    Exit with code 1 if score is below this threshold (CI gate)
  -h, --help             Display help
```

---

## Web Dashboard

The web dashboard provides an interactive overview of repository telemetry:

```bash
# Start the dashboard in development mode
pnpm --filter @vitality/dashboard dev
```

Visit `http://localhost:5173` to explore projects, inspect dimension breakdowns, view historical score trajectories, and copy live README SVG badges.

---

## License

Vitality is licensed under the [Apache License, Version 2.0](LICENSE).
