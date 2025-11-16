import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AuditRunner from './components/AuditRunner';
import ResultsViewer from './components/ResultsViewer';
import ComparisonView from './components/ComparisonView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <nav className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-slate-900">ModelAudit</h1>
                <span className="ml-2 text-sm text-slate-500">LLM Behavior Transparency</span>
              </div>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/run" element={<AuditRunner />} />
          <Route path="/results/:id" element={<ResultsViewer />} />
          <Route path="/compare/:id" element={<ComparisonView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


