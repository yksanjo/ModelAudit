import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

interface Comparison {
  comparisonId: string;
  modelAName: string;
  modelBName: string;
  differences: Array<{
    category: string;
    metric: string;
    modelAValue: number;
    modelBValue: number;
    difference: number;
    significance: string;
  }>;
  summary: {
    totalDifferences: number;
    significantDifferences: number;
    modelABetter: number;
    modelBBetter: number;
  };
}

export default function ComparisonView() {
  const { id } = useParams<{ id: string }>();
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadComparison(id);
    }
  }, [id]);

  const loadComparison = async (comparisonId: string) => {
    try {
      const response = await api.get(`/comparisons/${comparisonId}`);
      setComparison(response.data);
    } catch (error) {
      console.error('Failed to load comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading comparison...</div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Comparison not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Model Comparison</h2>
          <p className="text-slate-500 mt-1">
            {comparison.modelAName} vs {comparison.modelBName}
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Total Differences</div>
          <div className="text-2xl font-bold text-slate-900">{comparison.summary.totalDifferences}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Significant</div>
          <div className="text-2xl font-bold text-yellow-600">{comparison.summary.significantDifferences}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">{comparison.modelAName} Better</div>
          <div className="text-2xl font-bold text-green-600">{comparison.summary.modelABetter}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">{comparison.modelBName} Better</div>
          <div className="text-2xl font-bold text-blue-600">{comparison.summary.modelBBetter}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Differences</h3>
        <div className="space-y-4">
          {comparison.differences.map((diff, idx) => (
            <div key={idx} className="border-b border-slate-200 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium capitalize">{diff.category}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-slate-600">{diff.metric.replace(/_/g, ' ')}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  diff.significance === 'high' ? 'bg-red-100 text-red-800' :
                  diff.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {diff.significance.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-xs text-slate-500">{comparison.modelAName}</div>
                  <div className="font-medium">{typeof diff.modelAValue === 'number' ? diff.modelAValue.toFixed(3) : String(diff.modelAValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">{comparison.modelBName}</div>
                  <div className="font-medium">{typeof diff.modelBValue === 'number' ? diff.modelBValue.toFixed(3) : String(diff.modelBValue)}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Difference: {typeof diff.difference === 'number' ? diff.difference.toFixed(3) : String(diff.difference)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


