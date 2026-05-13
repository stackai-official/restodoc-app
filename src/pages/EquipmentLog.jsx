import { useState, useEffect, useCallback } from 'react';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '../lib/api';
import AddEquipmentModal from '../components/AddEquipmentModal';

const TYPE_LABELS = {
  dehumidifier: 'Dehumidifier',
  air_mover: 'Air Mover',
  hepa_air_scrubber: 'HEPA Air Scrubber',
  desiccant: 'Desiccant',
  other: 'Other',
};

const TYPE_ICONS = {
  dehumidifier: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  air_mover: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  hepa_air_scrubber: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  ),
  desiccant: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  ),
};

function daysSincePlaced(placedDate) {
  const placed = new Date(placedDate + 'T12:00:00');
  const now = new Date();
  return Math.floor((now - placed) / (1000 * 60 * 60 * 24));
}

export default function EquipmentLog({ jobId, rooms }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEquipment = useCallback(async () => {
    try {
      const data = await getEquipment(jobId);
      setEquipment(data);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  async function handleSave(data) {
    const record = await createEquipment({ ...data, job_id: jobId });
    setEquipment((prev) => [record, ...prev]);
    setModalOpen(false);
  }

  async function handleMarkRemoved(id) {
    const today = new Date().toISOString().split('T')[0];
    const updated = await updateEquipment(id, { removed_date: today });
    setEquipment((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this equipment record?')) return;
    await deleteEquipment(id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  }

  // Group by room
  const byRoom = {};
  const noRoom = [];
  for (const e of equipment) {
    if (e.room_id) {
      if (!byRoom[e.room_id]) byRoom[e.room_id] = { name: e.room_name || 'Unknown', items: [] };
      byRoom[e.room_id].items.push(e);
    } else {
      noRoom.push(e);
    }
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
      {equipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
          </svg>
          <p className="text-slate-400 mb-1">No equipment logged</p>
          <p className="text-slate-600 text-sm mb-4">Track dehumidifiers, air movers, and other equipment on this job</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            + Add Equipment
          </button>
        </div>
      ) : (
        <>
          {/* Grouped by room */}
          <div className="space-y-4 mb-4">
            {Object.entries(byRoom).map(([roomId, group]) => (
              <div key={roomId}>
                <h4 className="text-sm font-medium text-slate-400 mb-2">{group.name}</h4>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      onMarkRemoved={handleMarkRemoved}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}

            {noRoom.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Unassigned</h4>
                <div className="space-y-2">
                  {noRoom.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      onMarkRemoved={handleMarkRemoved}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-3 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-colors"
          >
            + Add Equipment
          </button>
        </>
      )}

      {modalOpen && (
        <AddEquipmentModal
          rooms={rooms}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function EquipmentCard({ item, onMarkRemoved, onDelete }) {
  const days = daysSincePlaced(item.placed_date);
  const needsPickupCheck = !item.removed_date && days > 3;
  const isRemoved = !!item.removed_date;

  return (
    <div className={`rounded-lg border p-3 ${
      needsPickupCheck
        ? 'bg-orange-500/5 border-orange-500/30'
        : 'bg-slate-800/40 border-slate-700/50'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${needsPickupCheck ? 'text-orange-400' : 'text-slate-500'}`}>
          {TYPE_ICONS[item.equipment_type] || TYPE_ICONS.other}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm text-white font-medium">
              {TYPE_LABELS[item.equipment_type] || item.equipment_type}
            </span>
            {item.quantity > 1 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                x{item.quantity}
              </span>
            )}
            {isRemoved && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-500">
                Removed
              </span>
            )}
            {needsPickupCheck && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                {days}d — check pickup
              </span>
            )}
          </div>

          {item.brand_model && (
            <p className="text-xs text-slate-500">{item.brand_model}</p>
          )}

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
            <span>Placed {formatShortDate(item.placed_date)}</span>
            {item.removed_date && <span>Removed {formatShortDate(item.removed_date)}</span>}
            {item.serial_numbers && <span className="truncate">SN: {item.serial_numbers}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {!isRemoved && (
            <button
              onClick={() => onMarkRemoved(item.id)}
              className="text-slate-600 hover:text-emerald-400 transition-colors p-1"
              title="Mark as removed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-slate-600 hover:text-red-400 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
