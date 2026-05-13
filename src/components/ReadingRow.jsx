export default function ReadingRow({ reading, onDelete, onEdit }) {
  const goalMet = reading.is_goal_met;

  return (
    <div
      onClick={() => onEdit?.(reading)}
      className={`flex items-center gap-2 py-2 border-b border-slate-800/50 last:border-0 ${onEdit ? 'cursor-pointer hover:bg-slate-700/20 rounded transition-colors' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white truncate block">{reading.location_label}</span>
      </div>
      <span className="text-xs text-slate-500 w-16 text-center capitalize">{reading.material}</span>
      <span className={`text-sm font-mono w-14 text-right ${
        goalMet ? 'text-emerald-400' : 'text-amber-400'
      }`}>
        {reading.reading_value}
        {reading.reading_type === 'moisture' && '%'}
        {reading.reading_type === 'humidity' && '%'}
        {reading.reading_type === 'temp' && '°F'}
      </span>
      <div className="w-6 flex justify-center">
        {goalMet ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-500" />
        )}
      </div>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(reading.id); }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
