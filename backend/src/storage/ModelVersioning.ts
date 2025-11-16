import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ModelVersion {
  id: string;
  name: string;
  provider: string;
  version: string;
  config: Record<string, unknown>;
  createdAt: Date;
  auditCount: number;
}

export class ModelVersioning {
  /**
   * Create or update a model version
   */
  async createOrUpdateModel(
    name: string,
    provider: string,
    version: string,
    config: Record<string, unknown>
  ): Promise<ModelVersion> {
    // Check if model with same provider and version exists
    const existing = await prisma.model.findFirst({
      where: {
        provider,
        version,
        name,
      },
    });

    if (existing) {
      // Update existing model
      const updated = await prisma.model.update({
        where: { id: existing.id },
        data: {
          config: config as unknown as Record<string, unknown>,
        },
      });

      const auditCount = await prisma.audit.count({
        where: { modelId: updated.id },
      });

      return {
        id: updated.id,
        name: updated.name,
        provider: updated.provider,
        version: updated.version,
        config: updated.config as unknown as Record<string, unknown>,
        createdAt: updated.createdAt,
        auditCount,
      };
    }

    // Create new model
    const model = await prisma.model.create({
      data: {
        name,
        provider,
        version,
        config: config as unknown as Record<string, unknown>,
      },
    });

    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      config: model.config as unknown as Record<string, unknown>,
      createdAt: model.createdAt,
      auditCount: 0,
    };
  }

  /**
   * Get all versions of a model (by name and provider)
   */
  async getModelVersions(name: string, provider: string): Promise<ModelVersion[]> {
    const models = await prisma.model.findMany({
      where: {
        name,
        provider,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      models.map(async (model) => {
        const auditCount = await prisma.audit.count({
          where: { modelId: model.id },
        });

        return {
          id: model.id,
          name: model.name,
          provider: model.provider,
          version: model.version,
          config: model.config as unknown as Record<string, unknown>,
          createdAt: model.createdAt,
          auditCount,
        };
      })
    );
  }

  /**
   * Get all models
   */
  async getAllModels(): Promise<ModelVersion[]> {
    const models = await prisma.model.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      models.map(async (model) => {
        const auditCount = await prisma.audit.count({
          where: { modelId: model.id },
        });

        return {
          id: model.id,
          name: model.name,
          provider: model.provider,
          version: model.version,
          config: model.config as unknown as Record<string, unknown>,
          createdAt: model.createdAt,
          auditCount,
        };
      })
    );
  }

  /**
   * Get model by ID
   */
  async getModelById(modelId: string): Promise<ModelVersion | null> {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return null;
    }

    const auditCount = await prisma.audit.count({
      where: { modelId: model.id },
    });

    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      config: model.config as unknown as Record<string, unknown>,
      createdAt: model.createdAt,
      auditCount,
    };
  }

  /**
   * Get audit history for a model
   */
  async getModelAuditHistory(modelId: string) {
    return prisma.audit.findMany({
      where: { modelId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}


