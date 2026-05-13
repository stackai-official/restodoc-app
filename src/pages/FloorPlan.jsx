import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFloorPlan, upsertFloorPlan, getRooms, getMoistureReadings } from '../lib/api';
import FloorPlanCanvas from '../components/FloorPlanCanvas';

const TOOLS = [
  { key: 'draw', label: 'Draw', icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15' },
  { key: 'select', label: 'Pan', icon: 'M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5' },
  { key: 'label', label: 'Label', icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
  { key: 'erase', label: 'Erase', icon: 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' },
  { key: 'pin', label: 'Pin', icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
];

const EMPTY_DATA = {
  rooms: [],
  pins: [],
  scale: { pixelsPerFoot: 20 },
};

export default function FloorPlan() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [canvasData, setCanvasData] = useState(EMPTY_DATA);
  const [tool, setTool] = useState('draw');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [labelModal, setLabelModal] = useState(null); // { shapeId, rooms }
  const [pinModal, setPinModal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [plan, roomData, readings] = await Promise.all([
        getFloorPlan(jobId),
        getRooms(jobId),
        getMoistureReadings(jobId),
      ]);
      setRooms(roomData);

      if (plan?.canvas_data) {
        // Enrich room colors based on latest moisture readings
        const enriched = enrichRoomColors(plan.canvas_data, readings);
        setCanvasData(enriched);
      }
    } catch (err) {
      console.error('Failed to load floor plan:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function enrichRoomColors(data, readings) {
    if (!data.rooms || !readings.length) return data;

    // Group latest moisture readings by room_id
    const latestByRoom = {};
    for (const r of readings) {
      if (r.reading_type !== 'moisture') continue;
      if (!latestByRoom[r.room_id]) latestByRoom[r.room_id] = [];
      latestByRoom[r.room_id].push(r.reading_value);
    }

    const enrichedRooms = data.rooms.map((room) => {
      if (!room.roomId || !latestByRoom[room.roomId]) return { ...room, color: 'none' };
      const vals = latestByRoom[room.roomId];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      let color = 'dry';
      if (avg > 20) color = 'wet';
      else if (avg > 16) color = 'progress';
      return { ...room, color };
    });

    return { ...data, rooms: enrichedRooms };
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertFloorPlan(jobId, canvasData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLabelRoom(shapeId, dbRooms) {
    setLabelModal({ shapeId, rooms: dbRooms });
  }

  function applyLabel(shapeId, label, roomId) {
    setCanvasData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === shapeId ? { ...r, label, roomId: roomId || null } : r
      ),
    }));
    setLabelModal(null);
  }

  function handlePinTap(pin) {
    setPinModal(pin);
  }

  function updatePin(pinId, updates) {
    setCanvasData((prev) => ({
      ...prev,
      pins: prev.pins.map((p) => (p.id === pinId ? { ...p, ...updates } : p)),
    }));
    setPinModal(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-800 z-10">
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-white font-medium">Floor Plan</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 h-12 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'text-emerald-400'
              : 'text-blue-400 hover:text-blue-300'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-900/80 border-b border-slate-800">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${
              tool === t.key
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            <span className="text-[10px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <FloorPlanCanvas
          canvasData={canvasData}
          onChange={setCanvasData}
          tool={tool}
          rooms={rooms}
          onLabelRoom={handleLabelRoom}
          onPinTap={handlePinTap}
        />
      </div>

      {/* Label modal */}
      {labelModal && (
        <LabelModal
          rooms={labelModal.rooms}
          onSelect={(label, roomId) => applyLabel(labelModal.shapeId, label, roomId)}
          onClose={() => setLabelModal(null)}
        />
      )}

      {/* Pin detail modal */}
      {pinModal && (
        <PinModal
          pin={pinModal}
          onUpdate={(updates) => updatePin(pinModal.id, updates)}
          onClose={() => setPinModal(null)}
        />
      )}
    </div>
  );
}

function LabelModal({ rooms, onSelect, onClose }) {
  const [custom, setCustom] = useState('');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <h3 className="text-white font-medium text-center px-4 py-2">Name this room</h3>

        {/* Existing rooms as suggestions */}
        {rooms.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-500 mb-2">Existing rooms:</p>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.name, r.id)}
                  className="px-3 py-2 rounded-lg text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-colors min-h-[48px] flex items-center"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom name */}
        <div className="px-4 py-3 flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Or type a name..."
            className="flex-1 px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={() => custom.trim() && onSelect(custom.trim(), null)}
            disabled={!custom.trim()}
            className="px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 transition-colors min-w-[48px]"
          >
            Set
          </button>
        </div>
      </div>
    </>
  );
}

function PinModal({ pin, onUpdate, onClose }) {
  const [value, setValue] = useState(pin.value || '');
  const [label, setLabel] = useState(pin.label || '');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-slate-900 border border-slate-700 rounded-2xl max-w-sm mx-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <h3 className="text-white font-medium">Moisture Pin</h3>
          <button
            onClick={() => onUpdate({ value, label })}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Save
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. East wall"
              className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Moisture reading %</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.0"
              step="0.1"
              inputMode="decimal"
              className="w-full px-4 py-4 rounded-lg bg-slate-800 border border-slate-700 text-white text-2xl font-mono text-center placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </>
  );
}
