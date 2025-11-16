/**
 * Base adapter interface for all LLM providers
 */
export interface ModelResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ModelRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  [key: string]: unknown;
}

/**
 * Abstract base class for all model adapters
 */
export abstract class BaseAdapter {
  protected config: AdapterConfig;
  protected provider: string;

  constructor(provider: string, config: AdapterConfig) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Generate a response from the model
   */
  abstract generate(request: ModelRequest): Promise<ModelResponse>;

  /**
   * Get the provider name
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get the adapter configuration
   */
  getConfig(): AdapterConfig {
    return { ...this.config };
  }

  /**
   * Validate the adapter configuration
   */
  abstract validateConfig(): boolean;

  /**
   * Test the connection to the model
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generate({
        prompt: 'Test',
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${this.provider}:`, error);
      return false;
    }
  }
}


