import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
  auditCount: number;
  createdAt: string;
}

export default function Dashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Models</h2>
        <Link
          to="/run"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Run New Audit
        </Link>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-slate-500 mb-4">No models found</p>
          <Link
            to="/run"
            className="text-primary-600 hover:text-primary-700"
          >
            Create your first model and run an audit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {model.name}
              </h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  <span className="font-medium">Provider:</span> {model.provider}
                </p>
                <p>
                  <span className="font-medium">Version:</span> {model.version}
                </p>
                <p>
                  <span className="font-medium">Audits:</span> {model.auditCount}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/run?modelId=${model.id}`}
                  className="flex-1 text-center px-3 py-2 bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition text-sm"
                >
                  Audit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


