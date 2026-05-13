import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../lib/api';

export default function Calendar({ userId }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs(userId);
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Group by date
  const byDate = {};
  for (const job of jobs) {
    const dateKey = new Date(job.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(job);
  }

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
        <h1 className="text-xl font-bold text-white">Calendar</h1>
      </header>

      <div className="flex-1 px-4 py-4 pb-24">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <p className="text-slate-400">No jobs to show</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byDate).map(([date, dateJobs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-slate-500 mb-2">{date}</h3>
                <div className="space-y-2">
                  {dateJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm truncate">{job.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          job.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                          job.status === 'drying' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>{job.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{job.address}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
