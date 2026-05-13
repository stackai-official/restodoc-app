import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../lib/api';
import { getCachedJobs, setCachedJobs } from '../lib/offline';
import JobCard from '../components/JobCard';

const FILTERS = ['all', 'active', 'drying', 'complete'];

export default function Dashboard({ userId }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(() => getCachedJobs());
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Pull-to-refresh state
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const fetchJobs = useCallback(async () => {
    try {
      setError('');
      const data = await getJobs(userId);
      setJobs(data);
      setCachedJobs(data);
    } catch (err) {
      // If offline and we have cached data, don't show error
      if (jobs.length > 0) return;
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    // If we have cached data, show it immediately and fetch in background
    if (jobs.length > 0) {
      setLoading(false);
      fetchJobs();
    } else {
      fetchJobs().finally(() => setLoading(false));
    }
  }, [fetchJobs]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }

  function onTouchStart(e) {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (scrollRef.current?.scrollTop > 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, 80));
    }
  }

  function onTouchEnd() {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullDistance(0);
  }

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 flex flex-col overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">RestoDoc</h1>
        <button
          onClick={() => navigate('/jobs/new')}
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </header>

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
          style={{ height: refreshing ? 48 : pullDistance }}
        >
          <div className={`w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors min-h-[48px] ${
              filter === f
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Job list or empty state */}
      <div className="flex-1 px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-slate-400 mb-1">
              {filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
            </p>
            {filter === 'all' && (
              <>
                <p className="text-slate-600 text-sm mb-4">Create your first restoration job to get started</p>
                <button
                  onClick={() => navigate('/jobs/new')}
                  className="px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors min-h-[48px]"
                >
                  + New Job
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
