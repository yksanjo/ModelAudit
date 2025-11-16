import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdapterRegistry } from '../../adapters/AdapterRegistry.js';
import { ModelVersioning } from '../../storage/ModelVersioning.js';
import { AuditEngine } from '../../audit/AuditEngine.js';

const router = Router();
const prisma = new PrismaClient();
const modelVersioning = new ModelVersioning();
const auditEngine = new AuditEngine();

/**
 * GET /api/audits
 * List all audits
 */
router.get('/', async (req, res) => {
  try {
    const { modelId, status, limit = '50' } = req.query;
    
    const where: Record<string, unknown> = {};
    if (modelId) {
      where.modelId = modelId;
    }
    if (status) {
      where.status = status;
    }

    const audits = await prisma.audit.findMany({
      where,
      take: parseInt(limit as string, 10),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        model: true,
      },
    });

    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch audits' });
  }
});

/**
 * GET /api/audits/:id
 * Get audit by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const audit = await auditEngine.getAuditResult(req.params.id);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch audit' });
  }
});

/**
 * POST /api/audits
 * Run a new audit
 */
router.post('/', async (req, res) => {
  try {
    const { modelId, testSuites } = req.body;

    if (!modelId || !testSuites || !Array.isArray(testSuites)) {
      return res.status(400).json({ 
        error: 'Missing required fields: modelId, testSuites (array)' 
      });
    }

    // Validate test suites
    const validSuites = ['censorship', 'bias', 'sidechannel', 'edge-cases'];
    const invalidSuites = testSuites.filter((s: string) => !validSuites.includes(s));
    if (invalidSuites.length > 0) {
      return res.status(400).json({ 
        error: `Invalid test suites: ${invalidSuites.join(', ')}. Valid: ${validSuites.join(', ')}` 
      });
    }

    // Get model
    const model = await modelVersioning.getModelById(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Create adapter
    const adapter = AdapterRegistry.create(model.provider, model.config);
    if (!adapter.validateConfig()) {
      return res.status(400).json({ error: 'Invalid model configuration' });
    }

    // Create audit record first
    const audit = await prisma.audit.create({
      data: {
        modelId,
        testSuite: testSuites.join(','),
        status: 'running',
        results: {},
      },
    });

    // Return audit ID immediately
    res.json({ 
      auditId: audit.id,
      message: 'Audit started', 
      modelId, 
      testSuites,
      status: 'running'
    });

    // Run audit in background
    auditEngine.runAudit(modelId, testSuites, adapter, audit.id)
      .then(result => {
        console.log(`Audit ${result.auditId} completed`);
      })
      .catch(error => {
        console.error(`Audit ${audit.id} failed:`, error);
        // Update audit status to failed
        prisma.audit.update({
          where: { id: audit.id },
          data: {
            status: 'failed',
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            } as unknown as Record<string, unknown>,
            completedAt: new Date(),
          },
        }).catch(updateError => {
          console.error('Failed to update audit status:', updateError);
        });
      });

  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start audit' });
  }
});

/**
 * POST /api/audits/:id/export
 * Export audit results
 */
router.post('/:id/export', async (req, res) => {
  try {
    const { format = 'json' } = req.body;
    const audit = await auditEngine.getAuditResult(req.params.id);
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.auditId}.json"`);
      res.json(audit);
    } else {
      res.status(400).json({ error: `Unsupported format: ${format}. Supported: json` });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to export audit' });
  }
});

export { router as auditRoutes };

