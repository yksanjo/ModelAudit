import axios, { AxiosInstance } from 'axios';
import { BaseAdapter, ModelRequest, ModelResponse, AdapterConfig } from './BaseAdapter.js';

export class OpenAIAdapter extends BaseAdapter {
  private client: AxiosInstance;
  private model: string;

  constructor(config: AdapterConfig) {
    super('openai', config);
    this.model = (config.model as string) || 'gpt-3.5-turbo';
    
    const apiKey = config.apiKey as string;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = axios.create({
      baseURL: config.baseUrl as string || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      const messages: Array<{ role: string; content: string }> = [];
      
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      
      messages.push({ role: 'user', content: request.prompt });

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stop: request.stopSequences,
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        finishReason: choice.finish_reason,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
        metadata: {
          latency,
          model: this.model,
          responseId: response.data.id,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }
}


