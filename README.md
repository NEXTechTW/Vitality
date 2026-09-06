<div align="center">

# Vitality

**Know the health of your open source.**

An open standard and toolkit for measuring open source project health — maintenance activity, community strength, security posture, and release stability — in a way that's transparent, deterministic, and reproducible.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol Version](https://img.shields.io/badge/protocol-v1.0-informational)](schemas/vitality.schema.json)
[![Build & Deploy](https://github.com/nextechtw/Vitality/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/nextechtw/Vitality/actions)
[![Vitality Health Score](https://img.shields.io/badge/Vitality_Health-52%2F100-f97316?style=flat-square[![Vitality Health Score](https://img.shields.io/badge/Vitality_Health-52%2F100-f97316?style=flat-square&logo=github)](https://nextechtw.github.io/Vitality/#/projects/NEXTechTW/Vitality)logo=github)](https://nextechtw.github.io/Vitality/#/projects/NEXTechTW/Vitality)

[Why Vitality](#why-vitality) · [How It Works](#how-it-works) · [Monorepo Architecture](#monorepo-architecture) · [CLI Usage](#cli-usage) · [README Badges](#readme-badges) · [CI/CD Gate](#cicd-quality-gate)

</div>

---

## 🌐 Live Web Dashboard

Explore repositories, inspect dimension breakdowns, track 90-day health trajectories, and browse ecosystem rankings live:

👉 **[https://nextechtw.github.io/Vitality/](https://nextechtw.github.io/Vitality/)**

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
- **100% Open Source:** Licensed under Apache 2.0.

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
                                          │                   │               (Live SPA)
                                          ▼                   ▼
                                    GitHub Actions       SVG Badges
```

The scoring engine is a pure function: it accepts normalized repository data and returns scores and breakdown items with zero side effects. Everything else in the system (CLI, API, Dashboard, CI Actions) consumes that deterministic core.

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
git clone https://github.com/nextechtw/Vitality.git
cd Vitality

# Install dependencies
pnpm install

# Build all monorepo packages
pnpm build

# Run all test suites (23 passing tests)
pnpm test

# Check architectural boundary rules
pnpm check:boundaries
```

---

## CLI Usage

Run analysis directly from your terminal:

```bash
# Analyze a repository using pnpm
pnpm --filter @vitality/cli dev analyze facebook/react

# Or run the built CLI binary
node packages/cli/dist/bin.js analyze vercel/next.js
```

### CLI Command Options
```
Usage: vitality analyze [options] <owner/repo>

Options:
  -t, --token <token>    GitHub Personal Access Token (or GITHUB_TOKEN env)
  -o, --output <path>    Output file path (default: "vitality.json")
  --min-score <score>    Exit with code 1 if score is below this threshold (CI gate)
  -h, --help             Display help for command
```

---

## README Badges

Add a live health badge to your repository `README.md`:

```markdown
[![Vitality Health](https://img.shields.io/badge/Vitality%20Health-92%2F100-22c55e?style=flat-square&logo=github)](https://nextechtw.github.io/Vitality/#/projects/facebook/react)
```

Clicking the badge takes visitors directly to your project's audit page on the live dashboard:
👉 `https://nextechtw.github.io/Vitality/#/projects/<owner>/<repo>`

---

## CI/CD Quality Gate

Add automated supply-chain policy checks to your GitHub Actions pipeline:

```yaml
# .github/workflows/vitality-check.yml
name: Dependency Health Check
on: [pull_request]

jobs:
  health-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 12
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter @vitality/cli build
      - name: Enforce minimum health score
        run: |
          node packages/cli/dist/bin.js analyze <owner/repo> --min-score 75
```

If a project's health falls below **75** (due to unpatched critical CVEs, abandoned releases, or severe contributor burnout), the workflow fails automatically.

---

## License

Vitality is licensed under the [Apache License, Version 2.0](LICENSE).
