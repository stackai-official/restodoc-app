import { useState } from 'react';

const EQUIPMENT_TYPES = [
  'dehumidifier',
  'air_mover',
  'hepa_air_scrubber',
  'desiccant',
  'other',
];

const TYPE_LABELS = {
  dehumidifier: 'Dehumidifier',
  air_mover: 'Air Mover',
  hepa_air_scrubber: 'HEPA Air Scrubber',
  desiccant: 'Desiccant',
  other: 'Other',
};

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function AddEquipmentModal({ rooms, onSave, onClose }) {
  const [equipmentType, setEquipmentType] = useState('dehumidifier');
  const [brandModel, setBrandModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState('');
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [placedDate, setPlacedDate] = useState(new Date().toISOString().split('T')[0]);
  const [removedDate, setRemovedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await onSave({
        equipment_type: equipmentType,
        brand_model: brandModel || null,
        quantity,
        serial_numbers: serialNumbers || null,
        room_id: roomId || null,
        placed_date: placedDate,
        removed_date: removedDate || null,
      });
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
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <h3 className="text-white font-medium">Add Equipment</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Equipment type */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Equipment type</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEquipmentType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    equipmentType === t
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Brand/model */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Brand / Model</label>
            <input
              type="text"
              value={brandModel}
              onChange={(e) => setBrandModel(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>

          {/* Quantity stepper */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-750 transition-colors"
              >
                -
              </button>
              <span className="text-xl font-mono text-white w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-750 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Serial numbers */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Serial numbers</label>
            <input
              type="text"
              value={serialNumbers}
              onChange={(e) => setSerialNumbers(e.target.value)}
              className={inputClass}
              placeholder="Optional — comma separated"
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Placed date */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Placed date</label>
            <input
              type="date"
              value={placedDate}
              onChange={(e) => setPlacedDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Removed date */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Removed date (if picked up)</label>
            <input
              type="date"
              value={removedDate}
              onChange={(e) => setRemovedDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
