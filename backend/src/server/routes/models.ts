import { Router } from 'express';
import { AdapterRegistry } from '../../adapters/AdapterRegistry.js';
import { ModelVersioning } from '../../storage/ModelVersioning.js';
import { AuditEngine } from '../../audit/AuditEngine.js';

const router = Router();
const modelVersioning = new ModelVersioning();
const auditEngine = new AuditEngine();

/**
 * GET /api/models
 * List all models
 */
router.get('/', async (req, res) => {
  try {
    const models = await modelVersioning.getAllModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch models' });
  }
});

/**
 * GET /api/models/:id
 * Get model by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const model = await modelVersioning.getModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch model' });
  }
});

/**
 * POST /api/models
 * Create or update a model
 */
router.post('/', async (req, res) => {
  try {
    const { name, provider, version, config } = req.body;

    if (!name || !provider || !version || !config) {
      return res.status(400).json({ error: 'Missing required fields: name, provider, version, config' });
    }

    // Validate provider
    if (!AdapterRegistry.hasProvider(provider)) {
      return res.status(400).json({ 
        error: `Unknown provider: ${provider}. Available: ${AdapterRegistry.getProviders().join(', ')}` 
      });
    }

    const model = await modelVersioning.createOrUpdateModel(name, provider, version, config);
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create model' });
  }
});

/**
 * GET /api/models/:id/versions
 * Get all versions of a model
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const model = await modelVersioning.getModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const versions = await modelVersioning.getModelVersions(model.name, model.provider);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch versions' });
  }
});

/**
 * GET /api/models/:id/audits
 * Get audit history for a model
 */
router.get('/:id/audits', async (req, res) => {
  try {
    const audits = await modelVersioning.getModelAuditHistory(req.params.id);
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch audits' });
  }
});

/**
 * POST /api/models/:id/test-connection
 * Test connection to a model
 */
router.post('/:id/test-connection', async (req, res) => {
  try {
    const model = await modelVersioning.getModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const adapter = AdapterRegistry.create(model.provider, model.config);
    const isValid = adapter.validateConfig();
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid model configuration' });
    }

    const isConnected = await adapter.testConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Connection test failed',
      connected: false 
    });
  }
});

export { router as modelRoutes };


