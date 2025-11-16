import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { modelRoutes } from './routes/models.js';
import { auditRoutes } from './routes/audits.js';
import { comparisonRoutes } from './routes/comparisons.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/models', modelRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/comparisons', comparisonRoutes);

app.listen(PORT, () => {
  console.log(`🚀 ModelAudit API server running on port ${PORT}`);
});


