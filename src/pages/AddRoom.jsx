import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRoom } from '../lib/api';

const QUICK_PICKS = [
  'Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom',
  'Basement', 'Garage', 'Hallway', 'Other',
];

const FLOORS = ['basement', 'main', 'upper'];

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function AddRoom() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [floorLevel, setFloorLevel] = useState('main');
  const [sqft, setSqft] = useState('');
  const [affected, setAffected] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSaving(true);

    try {
      await createRoom({
        job_id: jobId,
        name: name.trim(),
        floor_level: floorLevel,
        sqft: sqft ? Number(sqft) : null,
        affected,
      });
      navigate(`/jobs/${jobId}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold text-white">Add Room</h1>
        <button
          type="submit"
          form="add-room-form"
          disabled={saving || !name.trim()}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <form id="add-room-form" onSubmit={handleSubmit} className="flex-1 p-4 space-y-5 pb-12">
        {/* Room name */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Room name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
            placeholder="e.g. Master Bedroom"
          />
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => setName(pick)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                name === pick
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {pick}
            </button>
          ))}
        </div>

        {/* Floor level */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Floor level</label>
          <div className="flex gap-2">
            {FLOORS.map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() => setFloorLevel(floor)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${
                  floorLevel === floor
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Square footage */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Square footage</label>
          <input
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            className={inputClass}
            placeholder="Optional"
            min="0"
          />
        </div>

        {/* Affected toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Affected by loss</span>
          <button
            type="button"
            onClick={() => setAffected(!affected)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              affected ? 'bg-blue-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                affected ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
