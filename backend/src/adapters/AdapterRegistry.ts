import { BaseAdapter, AdapterConfig } from './BaseAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { AnthropicAdapter } from './AnthropicAdapter.js';
import { OllamaAdapter } from './OllamaAdapter.js';

/**
 * Registry for managing model adapters
 */
export class AdapterRegistry {
  private static adapters: Map<string, new (config: AdapterConfig) => BaseAdapter> = new Map();

  static {
    // Register built-in adapters
    this.register('openai', OpenAIAdapter);
    this.register('anthropic', AnthropicAdapter);
    this.register('ollama', OllamaAdapter);
  }

  /**
   * Register a new adapter type
   */
  static register(provider: string, adapterClass: new (config: AdapterConfig) => BaseAdapter): void {
    this.adapters.set(provider.toLowerCase(), adapterClass);
  }

  /**
   * Create an adapter instance
   */
  static create(provider: string, config: AdapterConfig): BaseAdapter {
    const providerLower = provider.toLowerCase();
    const AdapterClass = this.adapters.get(providerLower);
    
    if (!AdapterClass) {
      throw new Error(`Unknown adapter provider: ${provider}. Available: ${Array.from(this.adapters.keys()).join(', ')}`);
    }

    return new AdapterClass(config);
  }

  /**
   * Get list of available providers
   */
  static getProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a provider is registered
   */
  static hasProvider(provider: string): boolean {
    return this.adapters.has(provider.toLowerCase());
  }
}


