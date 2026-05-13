import { useNavigate } from 'react-router-dom';

const FLOOR_LABELS = {
  basement: 'Basement',
  main: 'Main',
  upper: 'Upper',
};

export default function RoomCard({ room, jobId }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/jobs/${jobId}/rooms/${room.id}`)}
      className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-white font-medium truncate">{room.name}</h3>
        {room.affected && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 shrink-0">
            Affected
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{FLOOR_LABELS[room.floor_level] || room.floor_level} floor</span>
        {room.sqft && <span>{room.sqft} sqft</span>}
        {room.moisture_count > 0 && (
          <span>{room.moisture_count} reading{room.moisture_count !== 1 ? 's' : ''}</span>
        )}
      </div>
    </button>
  );
}
