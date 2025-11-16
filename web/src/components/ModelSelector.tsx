import { useEffect, useState } from 'react';
import api from '../api/client';

interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    version: '',
    apiKey: '',
    model: 'gpt-3.5-turbo',
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await api.get('/models');
      setModels(response.data);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config: Record<string, unknown> = {
        apiKey: formData.apiKey,
        model: formData.model,
      };

      if (formData.provider === 'ollama') {
        config.baseUrl = 'http://localhost:11434';
      }

      await api.post('/models', {
        name: formData.name,
        provider: formData.provider,
        version: formData.version,
        config,
      });

      await loadModels();
      setShowForm(false);
      setFormData({
        name: '',
        provider: 'openai',
        version: '',
        apiKey: '',
        model: 'gpt-3.5-turbo',
      });
    } catch (error) {
      console.error('Failed to create model:', error);
      alert('Failed to create model. Please check your configuration.');
    }
  };

  if (loading) {
    return <div>Loading models...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Model
        </label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">-- Select a model --</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider} - {model.version})
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="text-sm text-primary-600 hover:text-primary-700"
      >
        {showForm ? 'Cancel' : '+ Add New Model'}
      </button>

      {showForm && (
        <form onSubmit={handleCreateModel} className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Version
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., 1.0.0"
              required
            />
          </div>

          {formData.provider !== 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder={formData.provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet-20240229'}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Create Model
          </button>
        </form>
      )}
    </div>
  );
}


