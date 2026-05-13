import { useNavigate } from 'react-router-dom';

const LOSS_COLORS = {
  water: { bg: 'bg-blue-500/15', text: 'text-blue-400', bar: 'bg-blue-500' },
  fire:  { bg: 'bg-orange-500/15', text: 'text-orange-400', bar: 'bg-orange-500' },
  mold:  { bg: 'bg-green-500/15', text: 'text-green-400', bar: 'bg-green-500' },
  other: { bg: 'bg-slate-500/15', text: 'text-slate-400', bar: 'bg-slate-500' },
};

const STATUS_STYLES = {
  active:   'bg-emerald-500/15 text-emerald-400',
  drying:   'bg-amber-500/15 text-amber-400',
  complete: 'bg-slate-500/15 text-slate-400',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JobCard({ job }) {
  const navigate = useNavigate();
  const loss = LOSS_COLORS[job.loss_type] || LOSS_COLORS.other;
  const statusClass = STATUS_STYLES[job.status] || STATUS_STYLES.active;

  return (
    <button
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="w-full text-left flex rounded-lg bg-slate-800/60 border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors"
    >
      {/* Colored left bar */}
      <div className={`w-1 shrink-0 ${loss.bar}`} />

      <div className="flex-1 p-4 min-w-0">
        {/* Title + badges row */}
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-white font-medium truncate flex-1">{job.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${loss.bg} ${loss.text}`}>
            {job.loss_type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 capitalize ${statusClass}`}>
            {job.status}
          </span>
        </div>

        {/* Address */}
        <p className="text-sm text-slate-400 truncate mb-2">{job.address}</p>

        {/* Bottom row: date + stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{formatDate(job.created_at)}</span>
          <span>{job.room_count} {job.room_count === 1 ? 'room' : 'rooms'}</span>
          <span>{job.media_count} {job.media_count === 1 ? 'photo' : 'photos'}</span>
        </div>
      </div>
    </button>
  );
}
