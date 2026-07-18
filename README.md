# VendorIQ - Agentic AI Procurement Decision Engine

> VendorIQ is an Agentic AI Procurement Decision Engine designed to help procurement teams make faster, smarter, and more transparent vendor selection decisions.

![Model Context Protocol](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue) ![Built with Nitrostack](https://img.shields.io/badge/Built%20with-Nitrostack-0A66FF) ![Status](https://img.shields.io/badge/status-live-brightgreen)

**VendorIQ - Agentic AI Procurement Decision Engine** is an [MCP (Model Context Protocol)](https://nitrostack.ai) server that extends AI assistants — like Claude, Cursor, and any MCP-compatible client — with new, real-world procurement capabilities. It is built and deployed on [Nitrostack](https://nitrostack.ai), the fastest way to build, deploy, and share MCP apps.

## Table of Contents

- [Overview](#overview)
- [What is MCP?](#what-is-mcp)
- [Features](#features)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Connect to an MCP Client](#connect-to-an-mcp-client)
- [MCP Primitives](#mcp-primitives)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Deploy Your Own MCP App](#deploy-your-own-mcp-app)
- [Explore More MCP Apps](#explore-more-mcp-apps)
- [FAQ](#faq)
- [Keywords](#keywords)
- [License](#license)

---

## Overview

VendorIQ is an Agentic AI Procurement Decision Engine designed to help procurement teams make faster, smarter, and more transparent vendor selection decisions.

Today, enterprise procurement is a manual and fragmented process. When a department requests an item (e.g., laptops, servers, networking equipment), procurement teams must gather information from multiple systems — vendor databases, historical contracts, supplier performance records, compliance documents, and market pricing — before selecting a vendor. This process is time-consuming, repetitive, and heavily dependent on the experience of procurement professionals.

VendorIQ transforms this workflow using a team of specialized AI agents. A user simply describes their procurement requirement in natural language, and the agents autonomously:

- **Understand the request** — parse free-text into structured intake (item, category, quantity, budget, specs, deadline)
- **Validate feasibility** — check budget against live market prices and flag impossible specs before proceeding
- **Rank vendors** — score suppliers using a weighted algorithm across cost, delivery, quality, compliance, and contract history with auto scenario detection (urgent / budget-conscious / medical)
- **Search the catalog** — find real product SKUs (RAM, CPU, SSD, warranty) matching requirements
- **Simulate negotiations** — run 3-round negotiation simulations using vendor contract history and market data
- **Generate Purchase Orders** — produce structured PO documents with pricing, delivery terms, and vendor details

Every recommendation is driven by explainable scoring, so procurement managers understand exactly why a vendor was selected. Unlike traditional procurement software that only stores or displays data, VendorIQ actively reasons across enterprise data to support decision-making.

The platform is intended for procurement teams, supply chain managers, and enterprise purchasing departments seeking to reduce procurement time, improve vendor selection quality, and make AI-assisted decisions with confidence.

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that lets AI assistants securely connect to external tools, data sources, and services. Instead of being limited to what it was trained on, an AI model can call **MCP servers** to fetch live data, run actions, and integrate with real systems.

This project is one such MCP server. Learn more about building and shipping MCP apps at [nitrostack.ai](https://nitrostack.ai).

---

## Features

- 🔌 **MCP-native** — works with any MCP-compatible client (Claude, Cursor, and more)
- 🛠️ **Tools, Resources & Prompts** — implements all three MCP primitives with full Zod validation
- ⚡ **Deployed on Nitrostack** — reliable, hosted, and instantly shareable
- 🔐 **Secure by design** — secrets stay in environment variables, never in code
- 🧩 **Composable** — combine with other MCP apps to build powerful AI workflows
- 📊 **Weighted vendor scoring** — explainable multi-factor ranking (cost, delivery, quality, compliance, history)
- 💰 **Negotiation simulation** — 3-round AI negotiation using real historical contract data
- 🏥 **Domain-aware** — auto-detects urgent, budget, and medical procurement scenarios

---

## Live Demo

🚀 **Live MCP endpoint:**
```
https://vendoriq-mc-team-bruteforce-amrita-university-amritapuri-campus.app.nitrocloud.ai
```

Point your MCP client at the endpoint above to try it instantly. Prefer a hosted setup? Deploy your own in minutes on [Nitrostack](https://nitrostack.ai).

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An MCP-compatible client (Claude Desktop, Cursor, etc.)

### Installation

```bash
git clone https://github.com/Vaibhav23135/VendorIQ.git
cd VendorIQ
npm install
```

### Configuration

Copy the example environment file and add your own values:

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/VendorIQ
PORT=3000
```

### Run

```bash
# Development (stdio mode, hot reload)
npm run dev

# Production
npm run build && npm start
```

---

## Connect to an MCP Client

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vendoriq-agentic-ai-procurement-decision-engine": {
      "url": "https://vendoriq-mc-team-bruteforce-amrita-university-amritapuri-campus.app.nitrocloud.ai"
    }
  }
}
```

### Self-hosted (stdio mode)

```json
{
  "mcpServers": {
    "vendoriq": {
      "command": "node",
      "args": ["<absolute-path-to-repo>/dist/index.js"],
      "env": {
        "MONGODB_URI": "your_mongodb_connection_string",
        "NODE_ENV": "production"
      }
    }
  }
}
```

> **Note:** Run `npm run build` first to generate the `dist/` folder.

Restart your client and the tools from this MCP server will be available to your AI assistant.

---

## MCP Primitives

VendorIQ implements all three MCP primitives:

### 🔧 Tools

| Tool | Description |
|---|---|
| `parse-request` | Parse a free-text procurement request into a structured intake (item, category, qty, budget, specs, deadline) |
| `validate-intake` | Validate the parsed intake against live market prices; flags budget/spec issues before proceeding |
| `rank-vendors` | Score and rank vendors using a weighted algorithm with auto scenario detection (urgent / budget / medical) |
| `search-products` | Search the product catalog for SKUs matching spec requirements |
| `contract-history` | Fetch historical contracts and past performance for a vendor to inform negotiations |
| `simulate-negotiation` | Run a 3-round negotiation simulation using market data and vendor history |
| `generate-po` | Generate a formatted Purchase Order document with pricing, delivery terms, and vendor details |

### 📄 Resources

| Resource URI | Description |
|---|---|
| `negotiation://market-rates` | Live market-average prices across IT Hardware, Medical, and Office Supplies |
| `negotiation://vendor-intelligence` | Full intelligence card for all vendors — scores, compliance, delivery, and contact info |

### 💬 Prompts

| Prompt | Description |
|---|---|
| `start-procurement` | Onboards the user into the full VendorIQ agentic workflow with step-by-step guidance |
| `negotiate-deal` | Kicks off a negotiation simulation for a selected vendor (requires `vendorId`, `item`, `quantity`) |

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ Yes | — | MongoDB connection string (Atlas or local) |
| `PORT` | No | `3000` | HTTP server port (`http`/`dual` mode only) |
| `HOST` | No | `localhost` | HTTP server host |
| `MCP_TRANSPORT_TYPE` | No | `stdio` (dev) / `dual` (prod) | Transport mode: `stdio`, `http`, or `dual` |
| `NITRO_LOG_LEVEL` | No | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |
| `NITROSTACK_APP_MODE` | No | `openai` | App mode for NitroStack |
| `ENABLE_CORS` | No | `true` | Enable CORS headers (HTTP mode only) |

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`. Use `.env.example` as a safe template.

---

## Project Structure

```
vendoriq-mcp/
├── src/
│   ├── app.module.ts                    # Root application module
│   ├── index.ts                         # Server entry point
│   ├── procurement/                     # Core procurement module
│   │   ├── procurement.module.ts
│   │   ├── procurement.tools.ts         # parse-request, validate-intake, rank-vendors, search-products
│   │   ├── intake-parser.util.ts        # Free-text NLP parser
│   │   └── vendor-scoring.util.ts       # Weighted vendor scoring algorithm
│   ├── modules/
│   │   └── negotiation/                 # Negotiation module
│   │       ├── negotiation.module.ts
│   │       ├── negotiation.tools.ts     # contract-history, simulate-negotiation, generate-po
│   │       ├── negotiation.resources.ts # market-rates, vendor-intelligence resources
│   │       └── negotiation.prompts.ts   # start-procurement, negotiate-deal prompts
│   ├── database/
│   │   ├── database.service.ts          # MongoDB connection service
│   │   ├── schemas/                     # Mongoose schemas (Vendor, Product, Contract, etc.)
│   │   └── seed.data.ts                 # Sample data for development
│   ├── health/
│   │   └── system.health.ts             # System health check provider
│   └── widgets/                         # NitroStack UI widgets
├── .env.example                         # ← Copy this to .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Deploy Your Own MCP App

Want to build and ship an MCP server like this one? **[Nitrostack](https://nitrostack.ai)** lets you create, deploy, and host MCP apps in minutes — no infrastructure to manage.

👉 **Start building:** [https://nitrostack.ai](https://nitrostack.ai)

---

## Explore More MCP Apps

- 🌙 Discover and share MCP projects with the community on [r/mcptothemoon](https://www.reddit.com/r/mcptothemoon/)
- 🧰 Browse a growing catalog of MCP apps on [Nitrostack](https://nitrostack.ai/apps)

---

## FAQ

### What is an MCP server?

An MCP server implements the Model Context Protocol to expose tools, resources, and prompts that AI assistants can call. It lets an AI model take real actions and access live data.

### What does VendorIQ do?

VendorIQ is an Agentic AI Procurement Decision Engine. It lets an AI assistant parse procurement requests in natural language, validate budgets against market prices, rank vendors with explainable scoring, simulate negotiations, and generate purchase orders — all through MCP tool calls.

### Which AI clients does this work with?

Any MCP-compatible client, including Claude Desktop and Cursor. New clients are adding MCP support regularly.

### How do I run it locally?

Clone the repo, run `npm install`, copy `.env.example` to `.env`, add your `MONGODB_URI`, then run `npm run dev`.

### How do I deploy my own MCP app?

Use [Nitrostack](https://nitrostack.ai) to build, deploy, and host MCP apps without managing infrastructure.

---

## Keywords

`Procurement AI` · `Vendor Selection` · `Agentic AI` · `VendorIQ` · `MCP` · `Model Context Protocol` · `MCP server` · `MCP app` · `AI tools` · `AI agents` · `LLM tools` · `Claude MCP` · `Nitrostack` · `NitroStack SDK` · `TypeScript` · `MongoDB` · `deploy MCP server` · `build MCP app`

---

## License

MIT © 2026

---

Built with ❤️ using the Model Context Protocol on [Nitrostack](https://nitrostack.ai). Share your MCP app on [r/mcptothemoon](https://www.reddit.com/r/mcptothemoon/).
