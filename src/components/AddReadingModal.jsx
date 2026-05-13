import { useState } from 'react';

const MATERIALS = ['drywall', 'wood', 'concrete', 'carpet', 'other'];
const READING_TYPES = [
  { key: 'moisture', label: 'Moisture %' },
  { key: 'humidity', label: 'Humidity' },
  { key: 'temp', label: 'Temp' },
];

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function AddReadingModal({ rooms, onSave, onClose, savedLocations = [], editReading = null }) {
  const [roomId, setRoomId] = useState(editReading?.room_id || rooms[0]?.id || '');
  const [locationLabel, setLocationLabel] = useState(editReading?.location_label || '');
  const [material, setMaterial] = useState(editReading?.material || 'drywall');
  const [readingValue, setReadingValue] = useState(editReading?.reading_value?.toString() || '');
  const [readingType, setReadingType] = useState(editReading?.reading_type || 'moisture');
  const [goalMet, setGoalMet] = useState(editReading?.is_goal_met || false);
  const [readingDate, setReadingDate] = useState(editReading?.reading_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  const isEditing = !!editReading;

  // Filter suggestions for the selected room
  const suggestions = [...new Set(
    savedLocations
      .filter((s) => s.room_id === roomId)
      .map((s) => s.location_label)
  )].slice(0, 6);

  async function handleSave(addAnother = false) {
    if (!roomId || !locationLabel.trim() || !readingValue) {
      setError('Room, location, and reading value are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...(editReading ? { id: editReading.id } : {}),
        room_id: roomId,
        location_label: locationLabel.trim(),
        material,
        reading_value: Number(readingValue),
        reading_type: readingType,
        is_goal_met: goalMet,
        reading_date: readingDate,
      }, addAnother);

      if (addAnother) {
        // Reset value fields but keep room, location, date
        setReadingValue('');
        setGoalMet(false);
        setSavedCount((c) => c + 1);
        setSaving(false);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition-colors min-h-[48px] px-2">
            Cancel
          </button>
          <h3 className="text-white font-medium">
            {isEditing ? 'Edit Reading' : 'Log Reading'}
            {savedCount > 0 && <span className="text-blue-400 text-xs ml-2">({savedCount} saved)</span>}
          </h3>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors min-h-[48px] px-2"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Room */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Room *</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Location label */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Location *</label>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className={inputClass}
              placeholder="e.g. East wall base, Floor center"
            />
            {suggestions.length > 0 && !locationLabel && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLocationLabel(s)}
                    className="px-2.5 py-1 rounded-md text-xs border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors min-h-[36px]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Material</label>
            <div className="flex gap-1.5 flex-wrap">
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMaterial(m)}
                  className={`px-3 py-2 rounded-lg text-sm capitalize border transition-colors min-h-[44px] ${
                    material === m
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reading type tabs */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Reading type</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              {READING_TYPES.map((rt) => (
                <button
                  key={rt.key}
                  type="button"
                  onClick={() => setReadingType(rt.key)}
                  className={`flex-1 py-2.5 text-sm transition-colors min-h-[44px] ${
                    readingType === rt.key
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading value — large input */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Value *</label>
            <input
              type="number"
              value={readingValue}
              onChange={(e) => setReadingValue(e.target.value)}
              className="w-full px-4 py-4 rounded-lg bg-slate-800 border border-slate-700 text-white text-2xl font-mono text-center placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="0.0"
              step="0.1"
              min="0"
              inputMode="decimal"
            />
          </div>

          {/* Goal met toggle */}
          <div className="flex items-center justify-between min-h-[48px]">
            <span className="text-sm text-slate-300">Goal met (dry)</span>
            <button
              type="button"
              onClick={() => setGoalMet(!goalMet)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                goalMet ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  goalMet ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Save & Add Another — only for new readings */}
          {!isEditing && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-3 rounded-lg border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              Save & Add Another
            </button>
          )}
        </div>
      </div>
    </>
  );
}
