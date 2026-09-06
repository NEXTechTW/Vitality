<div align="center">

# Vitality

**Know the health of your open source.**

An open standard and toolkit for measuring open source project health — maintenance activity, community strength, security posture, and release stability — in a way that's transparent, deterministic, and reproducible.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Protocol Version](https://img.shields.io/badge/protocol-v1.0-informational)](docs/PROTOCOL.md)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

[Getting Started](#getting-started) · [How it Works](#how-it-works) · [CLI](#cli-usage) · [GitHub Action](#github-action) · [API](#api) · [Contributing](#contributing)

</div>

---

## Why Vitality?

Stars and forks tell you how popular a project *was*. They don't tell you whether it's actually maintained *right now*.

A project with 20,000 stars might be abandoned. A project with 2,000 stars might have an active maintainer team, fast issue response, and a clean security record. Vitality exists to answer the question your dependency graph actually cares about:

> **Is this project healthy, right now — and can I prove it?**

Vitality analyzes a repository across four dimensions — **Maintenance**, **Community**, **Security**, and **Releases** — and produces a single, explainable health score backed by a standardized, versioned data format: `vitality.json`.

```
Vitality Health

████████████████████░░ 91/100

Maintenance     96
Security        89
Community       92
Releases        94
```

---

## Core Principles

- **Deterministic scoring.** Given the same input data, the score is always the same. No LLM is ever in the scoring path.
- **Fully explainable.** Every score comes with a breakdown of exactly what added or subtracted points — never a black-box number.
- **Reproducible.** Every report includes a computation hash. Anyone can re-run the engine against the same raw data and get an identical result.
- **AI explains, it doesn't score.** AI is used only to translate an already-computed report into plain-language insight and recommendations — never to decide the score itself.
- **100% open source.** The protocol, the scoring engine, and the API specification are all open. Fork it, self-host it, build on top of it.

---

## How It Works

```
GitHub API / OSV Database
        │
        ▼
  Collectors  ──►  Normalizer  ──►  Scoring Engine  ──►  vitality.json
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          ▼                   ▼                   ▼
                                        CLI                  API              AI Insight
                                          │                   │                (reports)
                                          ▼                   ▼
                                   GitHub Action          Dashboard / Badge
```

The scoring engine is a pure function: it takes normalized repository data in, and returns a score and breakdown out — no network calls, no side effects. Everything else in the system (CLI, API, Dashboard, GitHub Action, AI reports) is a consumer of that one deterministic core.

See [`docs/PROTOCOL.md`](docs/PROTOCOL.md) for the full specification and [`docs/SCORING.md`](docs/SCORING.md) for the scoring methodology and weight rationale.

---

## Getting Started

### Install the CLI

```bash
npm install -g @vitality/cli
```

### Analyze a repository

```bash
vitality analyze owner/repository
```

```
Vitality Health: 87/100

Maintenance   ██████████████░░░░  87
Security      ████████████████░░  91
Community     ███████████████░░░  82
Releases      █████████████████░  88

Written to vitality.json
```

### Get a plain-language report

```bash
vitality report owner/repository --ai
```

---

## GitHub Action

Add automatic health analysis to your CI pipeline:

```yaml
name: Vitality
on:
  push:
  pull_request:
  schedule:
    - cron: '0 6 * * 1'   # weekly scan

jobs:
  vitality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vitality/health-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## README Badge

Show your project's health score:

```markdown
![Vitality Health](https://vitality.dev/v1/badge/owner/repository.svg)
```

```
Project
⭐ 12.4k

Vitality Health: 91
Security: A
Maintenance: A
Community: B+
```

---

## `vitality.json`

Every analysis produces a standardized, versioned report:

```json
{
  "protocol_version": "1.0",
  "project": "owner/repository",
  "generated_at": "2026-09-06T08:00:00Z",
  "score": 91,
  "maintenance": { "score": 94, "release_frequency": 94, "issue_response": 91 },
  "community": { "score": 92, "active_contributors": 42 },
  "security": { "score": 89, "known_vulnerabilities": 0, "dependency_risk": "low" },
  "releases": { "score": 94, "frequency": "healthy", "stability": "high" },
  "provenance": {
    "data_sources": ["github_api", "dependency_graph", "osv_database"],
    "computation_hash": "sha256:2f1a...",
    "reproducible": true
  }
}
```

Full schema: [`schemas/vitality.schema.json`](schemas/vitality.schema.json).

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/projects/:owner/:repo` | Latest health report |
| `POST` | `/v1/projects/:owner/:repo/analyze` | Trigger a fresh analysis |
| `GET` | `/v1/projects/:owner/:repo/history` | Historical score time series |
| `GET` | `/v1/leaderboard` | Top-ranked healthy projects |
| `GET` | `/v1/badge/:owner/:repo.svg` | Badge image |

---

## Repository Structure

```
vitality/
├── packages/
│   ├── scoring-engine/   # deterministic scoring logic (pure functions only)
│   ├── collectors/       # GitHub API + OSV data collection
│   ├── cli/              # `vitality` command-line tool
│   ├── api/               # REST API + persistence
│   ├── ai-layer/          # plain-language report generation
│   └── dashboard/         # web UI
├── action/                # GitHub Action wrapper
├── schemas/               # vitality.json JSON Schema
└── docs/                  # protocol & scoring documentation
```

---

## Roadmap

- [x] Scoring engine + `vitality.json` v1.0
- [x] CLI
- [ ] GitHub Action + README badge
- [ ] Public API + historical dashboard
- [ ] AI insight layer (reports, issue triage, release notes)
- [ ] Plugin ecosystem (third-party dashboards, CI integrations, IDE extensions)

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for details.

---

## Contributing

Contributions are welcome — especially around scoring methodology, collector reliability, and dashboard UX.

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a PR.
- If you're an AI coding agent (Claude, Codex, etc.), read [`AGENTS.md`](AGENTS.md) first — it defines hard architectural boundaries (e.g., the scoring engine must never call an LLM or the network) that CI enforces automatically.
- Good first issues are labeled [`good-first-issue`](../../labels/good-first-issue).

Any change to scoring weights or thresholds must be documented in `docs/SCORING_CHANGELOG.md` with before/after impact on the benchmark repository set.

---

## License

Licensed under the [Apache License 2.0](LICENSE).

The Vitality name and logo are trademarks reserved for official builds and services; see [`TRADEMARK.md`](TRADEMARK.md) for guidelines on forks and derivative projects.

---

<div align="center">

**Vitality** — An open standard for Open Source health.

</div>
