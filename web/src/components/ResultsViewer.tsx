import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

interface AuditResult {
  auditId: string;
  modelId: string;
  testSuite: string;
  status: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    errors: number;
    averageLatency: number;
  };
  results: {
    censorship?: Array<{
      promptId: string;
      prompt: string;
      wasRefused: boolean;
      latency: number;
    }>;
    bias?: Array<{
      promptId: string;
      prompt: string;
      neutralityScore: number;
      latency: number;
    }>;
    sidechannel?: Array<{
      testName: string;
      riskLevel: string;
      anomalies: string[];
    }>;
  };
}

export default function ResultsViewer() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAudit(id);
      
      // Poll for updates if audit is still running
      const interval = setInterval(() => {
        loadAudit(id).then(audit => {
          if (audit && audit.status === 'completed') {
            clearInterval(interval);
          }
        });
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [id]);

  const loadAudit = async (auditId: string) => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAudit(response.data);
    } catch (error) {
      console.error('Failed to load audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const response = await api.post(`/audits/${id}/export`, { format: 'json' }, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading results...</div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Audit not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Audit Results</h2>
          <p className="text-slate-500 mt-1">Status: {audit.status}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            Export JSON
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Total Tests</div>
          <div className="text-2xl font-bold text-slate-900">{audit.summary.totalTests}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Passed</div>
          <div className="text-2xl font-bold text-green-600">{audit.summary.passed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Failed</div>
          <div className="text-2xl font-bold text-red-600">{audit.summary.failed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Avg Latency</div>
          <div className="text-2xl font-bold text-slate-900">{Math.round(audit.summary.averageLatency)}ms</div>
        </div>
      </div>

      {audit.results.censorship && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Censorship Tests</h3>
          <div className="space-y-2">
            {audit.results.censorship.slice(0, 10).map((result) => (
              <div key={result.promptId} className="border-b border-slate-200 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{result.prompt}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Refused: {result.wasRefused ? 'Yes' : 'No'} | Latency: {result.latency}ms
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.wasRefused ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.wasRefused ? 'Refused' : 'Allowed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {audit.results.bias && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Bias Tests</h3>
          <div className="space-y-2">
            {audit.results.bias.slice(0, 10).map((result) => (
              <div key={result.promptId} className="border-b border-slate-200 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{result.prompt}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Neutrality Score: {(result.neutralityScore * 100).toFixed(1)}% | Latency: {result.latency}ms
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.neutralityScore >= 0.7 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(result.neutralityScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {audit.results.sidechannel && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Side-Channel Analysis</h3>
          <div className="space-y-4">
            {audit.results.sidechannel.map((result, idx) => (
              <div key={idx} className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{result.testName}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    result.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
                {result.anomalies.length > 0 && (
                  <ul className="text-sm text-slate-600 list-disc list-inside">
                    {result.anomalies.map((anomaly, aIdx) => (
                      <li key={aIdx}>{anomaly}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

