import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../lib/api';

export default function ReportsList({ userId }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getReports(userId);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <h1 className="text-xl font-bold text-white">Reports</h1>
      </header>

      <div className="flex-1 px-4 py-4 pb-24">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-slate-400 mb-1">No reports yet</p>
            <p className="text-slate-600 text-sm">Generate a report from any job's detail page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => navigate(`/jobs/${report.job_id}/report`)}
                className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-white font-medium text-sm truncate flex-1">{report.job_title || 'Untitled Job'}</h4>
                  <span className="text-xs text-slate-500 shrink-0 ml-2">
                    {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{report.job_address}</p>
                {report.preview_text && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{report.preview_text}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
