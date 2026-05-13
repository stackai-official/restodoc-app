import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getRooms, updateJob, deleteJob, createMediaRecord } from '../lib/api';
import { StatusBadge, LossTypeBadge } from '../components/StatusBadge';
import RoomCard from '../components/RoomCard';
import MediaGallery from '../components/MediaGallery';
import CaptureMedia from './CaptureMedia';
import AddNoteModal from '../components/AddNoteModal';
import MoistureLog from './MoistureLog';
import EquipmentLog from './EquipmentLog';

const TABS = ['Rooms', 'Photos', 'Moisture', 'Equipment', 'Plan'];
const STATUSES = ['active', 'drying', 'complete'];

export default function JobDetail({ userId }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('Rooms');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [error, setError] = useState('');

  // Media state
  const [fabOpen, setFabOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [jobData, roomData] = await Promise.all([getJob(id), getRooms(id)]);
      setJob(jobData);
      setRooms(roomData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(newStatus) {
    setStatusSheetOpen(false);
    try {
      const updated = await updateJob(id, { status: newStatus });
      setJob(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job and all its data? This cannot be undone.')) return;
    setMenuOpen(false);
    try {
      await deleteJob(id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleNoteSave({ roomId, text }) {
    await createMediaRecord({
      job_id: id,
      room_id: roomId,
      type: 'note',
      note_text: text,
    });
    setNoteOpen(false);
    setMediaRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">{error || 'Job not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white flex-1 truncate">{job.title}</h1>
          <button
            onClick={() => navigate(`/jobs/${id}/edit`)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-40 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); navigate(`/jobs/${id}/edit`); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Edit job
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate(`/jobs/${id}/report`); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Generate Report
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setStatusSheetOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Change status
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                  >
                    Delete job
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Info bar */}
      <div className="px-4 py-3 border-b border-slate-800/50 space-y-2">
        <p className="text-sm text-slate-400">{job.address}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <LossTypeBadge lossType={job.loss_type} />
          <StatusBadge status={job.status} onClick={() => setStatusSheetOpen(true)} />
          {job.claim_number && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400">
              #{job.claim_number}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {activeTab === 'Rooms' && (
          <RoomsTab rooms={rooms} jobId={id} navigate={navigate} />
        )}
        {activeTab === 'Photos' && (
          <MediaGallery
            jobId={id}
            rooms={rooms}
            refreshKey={mediaRefreshKey}
          />
        )}
        {activeTab === 'Moisture' && (
          <MoistureLog jobId={id} rooms={rooms} />
        )}
        {activeTab === 'Equipment' && (
          <EquipmentLog jobId={id} rooms={rooms} />
        )}
        {activeTab === 'Plan' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="text-slate-400 mb-4">Sketch your floor plan</p>
            <button
              onClick={() => navigate(`/jobs/${id}/floor-plan`)}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              Open Floor Plan
            </button>
          </div>
        )}
      </div>

      {/* FAB — visible on Photos tab */}
      {activeTab === 'Photos' && (
        <div className="fixed bottom-20 right-4 z-20 flex flex-col-reverse items-end gap-2">
          {/* Expanded options */}
          {fabOpen && (
            <>
              <div className="fixed inset-0 -z-10" onClick={() => setFabOpen(false)} />
              <button
                onClick={() => { setFabOpen(false); setCaptureOpen(true); }}
                className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-blue-500 text-white text-sm shadow-lg shadow-blue-500/25 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                Take Photo / Video
              </button>
              <button
                onClick={() => { setFabOpen(false); setNoteOpen(true); }}
                className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-amber-500 text-white text-sm shadow-lg shadow-amber-500/25 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Add Note
              </button>
            </>
          )}

          {/* Main FAB */}
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={`w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform ${
              fabOpen ? 'rotate-45' : ''
            }`}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}

      {/* Status bottom sheet */}
      {statusSheetOpen && (
        <StatusSheet
          current={job.status}
          onSelect={handleStatusChange}
          onClose={() => setStatusSheetOpen(false)}
        />
      )}

      {/* Capture media sheet */}
      {captureOpen && (
        <CaptureMedia
          jobId={id}
          userId={userId}
          rooms={rooms}
          onComplete={() => {
            setCaptureOpen(false);
            setMediaRefreshKey((k) => k + 1);
          }}
          onClose={() => setCaptureOpen(false)}
        />
      )}

      {/* Add note modal */}
      {noteOpen && (
        <AddNoteModal
          rooms={rooms}
          onSave={handleNoteSave}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </div>
  );
}

function RoomsTab({ rooms, jobId, navigate }) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <p className="text-slate-400 mb-1">No rooms added</p>
        <p className="text-slate-600 text-sm mb-4">Add rooms to document each affected area</p>
        <button
          onClick={() => navigate(`/jobs/${jobId}/rooms/new`)}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
        >
          + Add Room
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} jobId={jobId} />
      ))}
      <button
        onClick={() => navigate(`/jobs/${jobId}/rooms/new`)}
        className="w-full py-3 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-colors"
      >
        + Add Room
      </button>
    </div>
  );
}

function StatusSheet({ current, onSelect, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <h3 className="text-white font-medium text-center px-4 py-2">Change Status</h3>
        <div className="px-4 pb-4 space-y-1">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm capitalize transition-colors flex items-center justify-between ${
                current === status
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {status}
              {current === status && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
