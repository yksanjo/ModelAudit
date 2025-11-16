import { Router } from 'express';
import { ComparisonEngine } from '../../storage/ComparisonEngine.js';

const router = Router();
const comparisonEngine = new ComparisonEngine();

/**
 * GET /api/comparisons
 * List all comparisons
 */
router.get('/', async (req, res) => {
  try {
    const { modelId } = req.query;
    
    if (modelId && typeof modelId === 'string') {
      const comparisons = await comparisonEngine.getModelComparisons(modelId);
      res.json(comparisons);
    } else {
      res.json({ message: 'List all comparisons - to be implemented' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch comparisons' });
  }
});

/**
 * GET /api/comparisons/:id
 * Get comparison by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const comparison = await comparisonEngine.getComparison(req.params.id);
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch comparison' });
  }
});

/**
 * POST /api/comparisons
 * Create a new comparison
 */
router.post('/', async (req, res) => {
  try {
    const { auditAId, auditBId } = req.body;

    if (!auditAId || !auditBId) {
      return res.status(400).json({ 
        error: 'Missing required fields: auditAId, auditBId' 
      });
    }

    const comparison = await comparisonEngine.compareAudits(auditAId, auditBId);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create comparison' });
  }
});

export { router as comparisonRoutes };


