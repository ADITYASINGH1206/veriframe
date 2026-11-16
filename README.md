# VeriFrame: Calibrated, Auditable Video Deepfake Screening

> Formerly **SENTINEL-V** (see `docs/DECISIONS.md`, ADR 007). Internal package names (`sv_*`), `SV_` settings and the `sv-receipt/1` format are unchanged.

VeriFrame is a video deepfake screening platform and reviewer console built on the S-MSDT detector family. It provides prevalence-calibrated probabilities, explainable patch-evidence heat-maps, and cryptographically signed detection receipts anchored on EVM blockchains.

```
       ┌────────────────┐
       │ Video Upload   │
       └───────┬────────┘
               │
               ▼
   ┌───────────────────────┐
   │ Ingest & Preprocess   │ ── Detect & Track Faces (Buffalo_L)
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ Cost-Aware Cascade    │ ── S-MSDT-S (T=1) ── Exit Early if Authentic
   └───────────┬───────────┘          │ Escalated
               ▼                      ▼
   ┌───────────────────────┐   S-MSDT-ST (T=8)
   │ Evidence & Fusion     │ ── Warped Patch Maps + C2PA + Generative Signals
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ Signed Receipt        │ ── RFC 8785 Canonical JSON + Ed25519
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ EVM Merkle Anchor     │ ── Immutable Audit Trail
   └───────────────────────┘
```

---

## Key Features

1. **Prevalence-Calibrated Screening:** Probability estimation calibrated against real-world base rates ($\pi$) rather than arbitrary binary thresholds.
2. **Two-Stage Cost Cascade:** Fast screening via S-MSDT-S ($T=1$), escalating uncertain or suspicious clips to S-MSDT-ST ($T=8$); the compute saving is measured in experiment E3 rather than assumed.
3. **Forensic Evidence Maps:** Spatiotemporal patch heat-maps warped back to source video coordinates for frame-by-frame inspection in the Reviewer Console.
4. **Verifiable Detection Receipts:** Cryptographic audit trail linking media SHA-256, model weights hash, calibration hash, and decision policy, anchored to an EVM testnet.
5. **Non-Invasive SENTINEL Integration:** Additive compatibility layer for the SENTINEL Web3 content-verification platform.

---

## Monorepo Layout

```
├── AGENTS.md                  # Autonomous agent instructions & rules
├── docs/                      # Specification, ADRs, blockers, architecture, and developer guide
│   ├── SPEC.md                # Authoritative Build Specification v1.0
│   ├── SENTINEL-V_Build_Spec.md # Verbatim build specification reference
│   ├── ARCHITECTURE.md        # Deep subsystem architecture & data flows
│   ├── CONTRIBUTING.md        # Contributor workflow & parallel stream rules
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   └── QUESTIONS.md           # Blocker tracking log (B1–B8)
├── skills/                    # Specialized agent & developer skills
│   ├── parity-verification/   # S-MSDT numerical equivalence checks (§6.9)
│   ├── model-bundle-builder/  # Immutable bundle builder & safetensors converter
│   ├── paper-b-evaluation/    # Paper B evaluation harness & experiment runners
│   ├── receipts-and-anchoring/# RFC 8785 JCS, Ed25519 signing & EVM anchoring
│   ├── sentinel-integration/  # Additive SENTINEL integration & webhook signing
│   └── reviewer-console-engineering/ # React console, canvas overlay & keyboard UX
├── packages/
│   ├── sv_core/               # Shared settings, schemas, errors, canonical JSON
│   ├── sv_engine/             # Preprocessing, S-MSDT adapters, calibration, evidence
│   ├── sv_fusion/             # C2PA provenance and generative image signals
│   └── sv_receipts/           # Receipt generation, Ed25519 signing, Merkle trees
├── services/
│   ├── api/                   # FastAPI gateway (analyses, receipts, review queue)
│   ├── workers/               # Celery workers (ingest, preprocess, gpu, finalize, anchor)
│   └── monitor/               # Drift detection (PSI), rolling ECE, retention
├── web/                       # Reviewer Console SPA (React, TypeScript, Vite, Tailwind)
├── contracts/                 # Foundry project with ReceiptAnchor.sol
├── integrations/sentinel/     # Additive adapter for SENTINEL platform
├── models/                    # Model bundle definitions and model cards
├── eval/                      # Paper B experimental evaluation harness
├── tools/                     # Calibration fitting, cascade tuning, parity checks
└── infra/                     # Dockerfiles, docker compose, Prometheus, Grafana
```

---

## Quick Start

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- *(Optional)* NVIDIA GPU with CUDA 12.x (real inference runs smoothly on both CPU and CUDA)

---

### 2. Install Dependencies

In your terminal or PowerShell from the repository root:

```bash
# 1. Install Python dependencies
python -m pip install -r requirements.txt

# 2. Install Frontend dependencies
cd web
npm install
cd ..
```

---

### 3. Start the Application

Start the backend and frontend in **two separate terminal windows**:

#### Terminal 1 — Backend API
```powershell
python run_api.py
```
- **Runs on:** [http://127.0.0.1:8080](http://127.0.0.1:8080) (`ENGINE_MODE: real` by default).
- **Interactive Swagger Docs:** [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)
- Automatically sets `PYTHONPATH`, registers the bundled Windows OpenH264 codec library, initializes the database, and prepares InsightFace detection and S-MSDT inference.

#### Terminal 2 — Frontend Console
```powershell
npm --prefix web run dev
```
- **Runs on:** [http://localhost:5173](http://localhost:5173)
- Connects automatically to the live backend API on port 8080.

---

### 4. How to Test (Step-by-Step)

1. Open your browser to **[http://localhost:5173](http://localhost:5173)**.
2. Click **Analyze** in the left sidebar (or navigate to `/app/analyze`).
3. Drag & drop any video (`.mp4`, `.mov`, `.webm`, `.mkv`) or image (`.jpg`, `.png`, `.webp`).
4. **Options:**
   - **Deep explain (Grad-CAM):** Checked by default. Generates a dynamic $16 \times 16$ patch-level attention heatmap tracking the face across frames.
   - **Skip the duplicate-file cache:** Check this if you want to re-run fresh inference on a file you have already analyzed before (bypasses the 30-day SHA-256 deduplication cache).
5. Click **Analyze**.
6. The analysis progress will advance: `Upload` $\to$ `Queued` $\to$ `Faces` $\to$ `Model` $\to$ `Receipt`.
7. Once finished, the Case Detail page will display:
   - The calibrated deepfake score and decision band (`Likely Authentic`, `Needs Review`, or `Likely Manipulated`).
   - The **Evidence Player** with face detection bounding boxes and Grad-CAM attention heatmaps moving in sync with the speaker's face.
   - Cryptographic detection receipt with Ed25519 signature.

---

### 5. Troubleshooting & FAQs

| Issue | Cause | Solution |
|---|---|---|
| **Port 8080 already in use** (`[Errno 10048]`) | A previous Python API process is still running in the background. | In PowerShell run: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force` |
| **Console shows "DEMO" badge** | The backend API server is stopped or unreachable. | Make sure `python run_api.py` is running in Terminal 1. Once port 8080 is live, refreshing the page automatically removes the demo badge. |
| **Re-running the same video loads cached results** | The built-in 30-day deduplication cache detected the same file hash. | On the Analyze page under **Options**, check **"Skip the duplicate-file cache"** to force fresh inference. |
| **OpenH264 codec warning on Windows** | Browser-compatible MP4 transcoding needs Cisco OpenH264. | `openh264-2.5.0-win64.dll` is already included in the repository root and loaded automatically when starting with `python run_api.py`. |
| **Running without model weights (Mock Mode)** | Quick testing or CI without downloading full model weights. | Run with `$env:SV_ENGINE_MODE="mock"; python run_api.py` in PowerShell or `SV_ENGINE_MODE=mock python run_api.py` in bash. |

---

### Docker Compose (Containerized Mode)

To run the full stack containerized with Redis, MinIO, PostgreSQL, API, and Celery workers:

```bash
# Initialize development environment
make dev
```

Visit the containerized services:
- **Reviewer Console:** [http://localhost:5173](http://localhost:5173)
- **API Gateway & Swagger Docs:** [http://localhost:8080/docs](http://localhost:8080/docs)
- **MinIO Storage Console:** [http://localhost:9001](http://localhost:9001)

---

### Frontend Standalone Demo Mode (No Backend)

If you only want to test the React frontend without running a local backend:

```bash
cd web
npm install
npm run dev                          # Falls back to labelled DEMO DATA when API is unreachable
VITE_DATA_MODE=demo npm run dev     # Forces generated demo data everywhere
```

The console marks every generated item with a **DEMO DATA** badge.

---

### Running Tests

```bash
# Run unit & pipeline integration tests
pytest services/api/tests/test_analyses_pipeline.py -v

# Run real weights verification test
pytest packages/sv_engine/tests/test_real_weights.py -v

# Run entire test suite (mock mode)
make test

# Code quality and styling checks
make lint
```

---

## Parallel Development Streams

VeriFrame is built concurrently across two parallel workstreams:

- **Stream A — ML & Data Forensics:** Lead by [@sharadpolackalsunil](https://github.com/sharadpolackalsunil)
  - Video preprocessing, face tracking, and clip formation (M1)
  - S-MSDT adapters, checkpoint verification, and calibration tooling (M2)
  - Patch evidence generation and video heat-map overlays (M4)
  - Cascade exit tuning and policy math (M6)
  - Drift monitoring (PSI) and rolling ECE (M9)
  - Evaluation harness and Paper B experiments (M10)

- **Stream B — Systems, Full-Stack & Web3:** Lead by [@AdityaRaj1304](https://github.com/AdityaRaj1304)
  - Monorepo tooling, Docker Compose, and CI/CD pipelines (M0)
  - FastAPI gateway, Celery task pipelines, and Redis pub/sub (M3)
  - Reviewer Console web application and keyboard workspace (M5)
  - Detection receipts, Ed25519 signing, and EVM contract anchoring (M7)
  - SENTINEL platform integration adapter (M8)
  - Security hardening, SSRF sandboxing, and load testing (M11)

See [GitHub Issues](https://github.com/ADITYASINGH1206/veriframe/issues) for detailed task specifications and acceptance criteria.

---

## Agent & Developer Skills

The repository includes curated, executable skill modules under `skills/` designed to provide deep procedural knowledge for both coding agents and human engineers:

| Skill | Path | Description & Scope |
|---|---|---|
| **Parity Verification** | [`skills/parity-verification/`](skills/parity-verification/SKILL.md) | Step-by-step verification protocol for GPU inference parity ($|\Delta u| \le 0.05$, SSIM $\ge 0.98$). |
| **Model Bundle Builder** | [`skills/model-bundle-builder/`](skills/model-bundle-builder/SKILL.md) | Safetensors conversion, offline CLIP backbone export, Platt calibration fitting, and checksum generation. |
| **Paper B Evaluation** | [`skills/paper-b-evaluation/`](skills/paper-b-evaluation/SKILL.md) | Reproducible execution of experiments E1–E12, dataset manifests, and publication figure plotting. |
| **Receipts & EVM Anchoring** | [`skills/receipts-and-anchoring/`](skills/receipts-and-anchoring/SKILL.md) | RFC 8785 canonical JSON, Ed25519 signatures, Merkle trees, and Foundry `ReceiptAnchor.sol` anchoring. |
| **SENTINEL Integration** | [`skills/sentinel-integration/`](skills/sentinel-integration/SKILL.md) | Purely additive integration adapter, webhook HMAC validation, and locked-file preservation. |
| **Reviewer Console Engineering** | [`skills/reviewer-console-engineering/`](skills/reviewer-console-engineering/SKILL.md) | Canvas heat-map synchronization via `requestVideoFrameCallback`, keyboard shortcuts, and WCAG 2.2 AA. |
