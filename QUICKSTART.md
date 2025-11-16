# ModelAudit Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use Docker Compose)
- npm or yarn package manager

## Setup

### 1. Start Database

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

Or use your own PostgreSQL instance and update the `DATABASE_URL` in `backend/.env`.

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../web
npm install
```

### 3. Configure Environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://modelaudit:modelaudit@localhost:5432/modelaudit"
PORT=3000
NODE_ENV=development
```

### 4. Initialize Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. Start Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd web
npm run dev
```

### 6. Access the Dashboard

Open http://localhost:3001 in your browser.

## Usage

### Adding a Model

1. Click "Run New Audit" on the dashboard
2. Click "+ Add New Model"
3. Fill in:
   - **Name**: e.g., "GPT-4"
   - **Provider**: OpenAI, Anthropic, or Ollama
   - **Version**: e.g., "1.0.0"
   - **API Key**: Your API key (not needed for Ollama)
   - **Model**: Model identifier (e.g., "gpt-4", "claude-3-sonnet-20240229")

### Running an Audit

1. Select a model from the dropdown
2. Choose test suites:
   - **Censorship**: Tests filtering and refusal patterns
   - **Bias**: Tests demographic and cultural bias
   - **Side-Channel**: Tests metadata leakage and timing patterns
   - **Edge-Cases**: Tests unusual inputs
3. Click "Run Audit"
4. Wait for completion (this may take several minutes)
5. View results in the dashboard

### Comparing Models

1. Run audits for two different models
2. Use the comparison API endpoint or UI (to be implemented)
3. View differences in behavior, performance, and safety

## API Endpoints

### Models
- `GET /api/models` - List all models
- `POST /api/models` - Create a new model
- `GET /api/models/:id` - Get model details
- `GET /api/models/:id/audits` - Get audit history

### Audits
- `GET /api/audits` - List all audits
- `POST /api/audits` - Run a new audit
- `GET /api/audits/:id` - Get audit results
- `POST /api/audits/:id/export` - Export audit as JSON

### Comparisons
- `GET /api/comparisons` - List comparisons
- `POST /api/comparisons` - Compare two audits
- `GET /api/comparisons/:id` - Get comparison details

## Troubleshooting

### Database Connection Issues

Make sure PostgreSQL is running:
```bash
docker-compose ps
```

Check your `DATABASE_URL` in `backend/.env`.

### API Key Issues

- OpenAI: Get your key from https://platform.openai.com/api-keys
- Anthropic: Get your key from https://console.anthropic.com/
- Ollama: No key needed, but make sure Ollama is running locally

### Port Conflicts

If port 3000 or 3001 is in use, update:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `web/vite.config.ts`

## Next Steps

- Review test results in the dashboard
- Export audit results for compliance reports
- Compare different model versions
- Add custom test prompts to the test suites


