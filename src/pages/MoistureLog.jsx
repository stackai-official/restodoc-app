import { useState, useEffect, useCallback } from 'react';
import { getMoistureReadings, createMoistureReading, updateMoistureReading, deleteMoistureReading } from '../lib/api';
import ReadingRow from '../components/ReadingRow';
import DryingChart from '../components/DryingChart';
import AddReadingModal from '../components/AddReadingModal';

export default function MoistureLog({ jobId, rooms }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editReading, setEditReading] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});

  const today = new Date().toISOString().split('T')[0];

  const fetchReadings = useCallback(async () => {
    try {
      const data = await getMoistureReadings(jobId);
      setReadings(data);
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  async function handleSave(data, addAnother = false) {
    if (data.id) {
      // Editing
      const { id, ...updates } = data;
      const updated = await updateMoistureReading(id, updates);
      setReadings((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditReading(null);
      setModalOpen(false);
    } else {
      // Creating
      const record = await createMoistureReading({ ...data, job_id: jobId });
      setReadings((prev) => [record, ...prev]);
      if (!addAnother) {
        setModalOpen(false);
      }
    }
  }

  function handleEdit(reading) {
    setEditReading(reading);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading?')) return;
    await deleteMoistureReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleExpand(roomId) {
    setExpandedRooms((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  }

  function openNewReading() {
    setEditReading(null);
    setModalOpen(true);
  }

  // Filter
  const filtered = filterRoom === 'all'
    ? readings
    : readings.filter((r) => r.room_id === filterRoom);

  // Group by room
  const byRoom = {};
  for (const r of filtered) {
    const key = r.room_id;
    if (!byRoom[key]) byRoom[key] = { name: r.room_name || 'Unknown', readings: [] };
    byRoom[key].readings.push(r);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <button
          onClick={openNewReading}
          className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors min-h-[48px]"
        >
          Log Reading
        </button>
      </div>

      {/* Room filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3">
        <FilterPill label="All Rooms" active={filterRoom === 'all'} onClick={() => setFilterRoom('all')} />
        {rooms.map((r) => (
          <FilterPill key={r.id} label={r.name} active={filterRoom === r.id} onClick={() => setFilterRoom(r.id)} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p className="text-slate-400 mb-1">No moisture readings yet</p>
          <p className="text-slate-600 text-sm mb-4">Log your first reading to start tracking drying progress</p>
          <button
            onClick={openNewReading}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors min-h-[48px]"
          >
            Log Reading
          </button>
        </div>
      ) : (
        <>
          {/* Per-room sections */}
          <div className="space-y-4 mb-6">
            {Object.entries(byRoom).map(([roomId, group]) => {
              const todayReadings = group.readings.filter((r) => r.reading_date === today);
              const historicalReadings = group.readings.filter((r) => r.reading_date !== today);
              const expanded = expandedRooms[roomId];

              return (
                <div key={roomId} className="bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden">
                  {/* Room header */}
                  <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/50">
                    <h4 className="text-sm font-medium text-white">{group.name}</h4>
                  </div>

                  {/* Today's readings table */}
                  {todayReadings.length > 0 ? (
                    <div className="px-3 py-1">
                      {/* Column headers */}
                      <div className="flex items-center gap-2 py-1.5 text-[10px] text-slate-600 uppercase tracking-wider">
                        <div className="flex-1">Location</div>
                        <div className="w-16 text-center">Material</div>
                        <div className="w-14 text-right">Reading</div>
                        <div className="w-6 text-center">Goal</div>
                        <div className="w-6" />
                      </div>
                      {todayReadings.map((r) => (
                        <ReadingRow key={r.id} reading={r} onDelete={handleDelete} onEdit={handleEdit} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-3 text-xs text-slate-600">No readings today</p>
                  )}

                  {/* Historical expand */}
                  {historicalReadings.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleExpand(roomId)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-slate-700/30 transition-colors min-h-[44px]"
                      >
                        <span>{historicalReadings.length} previous reading{historicalReadings.length !== 1 ? 's' : ''}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 border-t border-slate-700/30">
                          {historicalReadings.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => handleEdit(r)}
                              className="w-full flex items-center gap-2 py-2 text-xs hover:bg-slate-700/30 rounded transition-colors"
                            >
                              <span className="text-slate-600 w-16 shrink-0">{formatShortDate(r.reading_date)}</span>
                              <span className="text-slate-400 flex-1 truncate text-left">{r.location_label}</span>
                              <span className="text-slate-500 w-14 text-center capitalize">{r.material}</span>
                              <span className={`font-mono w-12 text-right ${r.is_goal_met ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {r.reading_value}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drying chart */}
          <DryingChart readings={filtered} />
        </>
      )}

      {/* Add/edit reading modal */}
      {modalOpen && (
        <AddReadingModal
          rooms={rooms}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditReading(null); }}
          savedLocations={readings}
          editReading={editReading}
        />
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 min-h-[44px] ${
        active ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
