import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import ReportPreview from '../components/ReportPreview';

const CHECKLIST = [
  { key: 'job', label: 'Job info (address, loss type, dates, claim info)', default: true },
  { key: 'rooms', label: 'Room list with square footage', default: true },
  { key: 'photos', label: 'Photo count per room', default: true },
  { key: 'moisture', label: 'Moisture readings (all dates, drying trend)', default: true },
  { key: 'equipment', label: 'Equipment log (placed + removed dates)', default: true },
  { key: 'floorplan', label: 'Floor plan (if exists)', default: true },
];

export default function GenerateReport() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [included, setIncluded] = useState(
    Object.fromEntries(CHECKLIST.map((c) => [c.key, c.default]))
  );
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [context, setContext] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  function toggleItem(key) {
    setIncluded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    setError('');
    setGenerating(true);

    try {
      const result = await apiFetch('/api/report/generate', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });

      setReport(result.report);
      setContext(result.context);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/report/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'PDF export failed' }));
        throw new Error(err.error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${context.job.address.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  // ── Report generated → show preview ───────────────────────────
  if (report && context) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => { setReport(null); setContext(null); }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Report Preview</h1>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </header>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <ReportPreview report={report} context={context} />
        </div>
      </div>
    );
  }

  // ── Checklist + generate button ───────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Generate Report</h1>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* Intro */}
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h2 className="text-white font-semibold mb-1">AI-Powered Report</h2>
          <p className="text-sm text-slate-400">
            Generate a professional, carrier-ready damage assessment report from your job data.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Include in report:</h3>
          {CHECKLIST.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleItem(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors text-left"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                included[item.key]
                  ? 'bg-blue-500'
                  : 'border-2 border-slate-600'
              }`}>
                {included[item.key] && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-300">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating report...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              Generate with AI
            </>
          )}
        </button>

        {generating && (
          <p className="text-xs text-slate-500 text-center">
            This may take 15-30 seconds depending on the amount of data.
          </p>
        )}
      </div>
    </div>
  );
}
