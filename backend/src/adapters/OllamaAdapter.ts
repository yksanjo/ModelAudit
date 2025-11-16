import axios, { AxiosInstance } from 'axios';
import { BaseAdapter, ModelRequest, ModelResponse, AdapterConfig } from './BaseAdapter.js';

export class OllamaAdapter extends BaseAdapter {
  private client: AxiosInstance;
  private model: string;

  constructor(config: AdapterConfig) {
    super('ollama', config);
    this.model = (config.model as string) || 'llama2';
    
    const baseUrl = (config.baseUrl as string) || 'http://localhost:11434';
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes for local models
    });
  }

  validateConfig(): boolean {
    return !!(this.config.model);
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      // Combine system prompt and user prompt for Ollama
      let fullPrompt = request.prompt;
      if (request.systemPrompt) {
        fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
      }

      const body: Record<string, unknown> = {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
      };

      if (request.temperature !== undefined) {
        body.options = {
          temperature: request.temperature,
        };
      }

      if (request.maxTokens) {
        body.options = {
          ...(body.options as Record<string, unknown> || {}),
          num_predict: request.maxTokens,
        };
      }

      if (request.stopSequences && request.stopSequences.length > 0) {
        body.options = {
          ...(body.options as Record<string, unknown> || {}),
          stop: request.stopSequences,
        };
      }

      const response = await this.client.post('/api/generate', body);

      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        content: response.data.response,
        finishReason: response.data.done ? 'stop' : 'length',
        usage: response.data.eval_count ? {
          promptTokens: response.data.prompt_eval_count,
          completionTokens: response.data.eval_count,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        } : undefined,
        metadata: {
          latency,
          model: this.model,
          totalDuration: response.data.total_duration,
          loadDuration: response.data.load_duration,
          evalDuration: response.data.eval_duration,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}


