import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelSelector from './ModelSelector';
import api from '../api/client';

export default function AuditRunner() {
  const navigate = useNavigate();
  const [modelId, setModelId] = useState('');
  const [testSuites, setTestSuites] = useState<string[]>(['censorship']);
  const [running, setRunning] = useState(false);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelId) {
      alert('Please select a model');
      return;
    }

    if (testSuites.length === 0) {
      alert('Please select at least one test suite');
      return;
    }

    setRunning(true);

    try {
      const response = await api.post('/audits', {
        modelId,
        testSuites,
      });

      const auditId = response.data.auditId;
      if (!auditId) {
        throw new Error('No audit ID returned');
      }

      // Navigate to results page immediately
      navigate(`/results/${auditId}`);
    } catch (error) {
      console.error('Failed to run audit:', error);
      alert('Failed to start audit. Please try again.');
      setRunning(false);
    }
  };

  const toggleTestSuite = (suite: string) => {
    if (testSuites.includes(suite)) {
      setTestSuites(testSuites.filter(s => s !== suite));
    } else {
      setTestSuites([...testSuites, suite]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Run Audit</h2>

      <form onSubmit={handleRunAudit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <ModelSelector value={modelId} onChange={setModelId} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Test Suites
          </label>
          <div className="space-y-2">
            {['censorship', 'bias', 'sidechannel', 'edge-cases'].map((suite) => (
              <label key={suite} className="flex items-center">
                <input
                  type="checkbox"
                  checked={testSuites.includes(suite)}
                  onChange={() => toggleTestSuite(suite)}
                  className="mr-2"
                />
                <span className="capitalize">{suite.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={running || !modelId || testSuites.length === 0}
          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Running Audit...' : 'Run Audit'}
        </button>
      </form>
    </div>
  );
}

