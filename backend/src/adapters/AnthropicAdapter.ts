import axios, { AxiosInstance } from 'axios';
import { BaseAdapter, ModelRequest, ModelResponse, AdapterConfig } from './BaseAdapter.js';

export class AnthropicAdapter extends BaseAdapter {
  private client: AxiosInstance;
  private model: string;

  constructor(config: AdapterConfig) {
    super('anthropic', config);
    this.model = (config.model as string) || 'claude-3-sonnet-20240229';
    
    const apiKey = config.apiKey as string;
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = axios.create({
      baseURL: config.baseUrl as string || 'https://api.anthropic.com/v1',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: 'user', content: request.prompt },
      ];

      const body: Record<string, unknown> = {
        model: this.model,
        max_tokens: request.maxTokens || 1024,
        messages,
      };

      if (request.systemPrompt) {
        body.system = request.systemPrompt;
      }

      if (request.temperature !== undefined) {
        body.temperature = request.temperature;
      }

      if (request.stopSequences && request.stopSequences.length > 0) {
        body.stop_sequences = request.stopSequences;
      }

      const response = await this.client.post('/messages', body);

      const endTime = Date.now();
      const latency = endTime - startTime;

      const content = response.data.content[0];
      return {
        content: content.text,
        finishReason: response.data.stop_reason,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
        } : undefined,
        metadata: {
          latency,
          model: this.model,
          responseId: response.data.id,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }
}


