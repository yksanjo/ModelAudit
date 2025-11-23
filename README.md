# ModelAudit - LLM Behavior Transparency Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.javascript.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) [![GitHub stars](https://img.shields.io/github/stars/yksanjo/ModelAudit?style=social)](https://github.com/yksanjo/ModelAudit/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yksanjo/ModelAudit.svg)](https://github.com/yksanjo/ModelAudit/network/members) [![GitHub issues](https://img.shields.io/github/issues/yksanjo/ModelAudit.svg)](https://github.com/yksanjo/ModelAudit/issues) [![Last commit](https://img.shields.io/github/last-commit/yksanjo/ModelAudit.svg)](https://github.com/yksanjo/ModelAudit/commits/main)


A comprehensive toolkit and dashboard for auditing language model behavior, detecting censorship patterns, bias, side-channel leaks, and maintaining versioned model baselines.

## Features

- **Model Adapter System**: Plugin architecture supporting OpenAI, Anthropic, Ollama, and more
- **Audit Test Suites**: Censorship detection, bias analysis, edge case testing
- **Side-Channel Scanner**: Network metadata, timing analysis, embedding leakage detection
- **Versioning & Comparison**: Track model behavior changes over time
- **Dashboard**: Web UI for running audits and viewing results

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../web
npm install

# Set up database
cd ../backend
npx prisma migrate dev
npx prisma generate
```

### Configuration

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/modelaudit"
PORT=3000
```

### Running

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from web directory)
npm run dev
```

Visit http://localhost:3001 to access the dashboard.

## Project Structure

```
model-audit/
├── backend/          # TypeScript backend with Express API
├── web/              # React frontend dashboard
├── tests/            # Test prompt suites
└── README.md
```

## License

MIT


