import { useState, useEffect, useCallback } from 'react';
import { getMedia, deleteMedia } from '../lib/api';
import MediaThumbnail from './MediaThumbnail';

export default function MediaGallery({ jobId, rooms, onCapture, refreshKey }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('all');
  const [viewerIndex, setViewerIndex] = useState(null);

  const fetchMedia = useCallback(async () => {
    try {
      const data = await getMedia(jobId);
      setMedia(data);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia, refreshKey]);

  const filtered = filterRoom === 'all'
    ? media
    : media.filter((m) => m.room_id === filterRoom);

  async function handleDelete(id) {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteMedia(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
      setViewerIndex(null);
    } catch (err) {
      alert(err.message);
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
      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        <FilterPill
          label="All"
          active={filterRoom === 'all'}
          onClick={() => setFilterRoom('all')}
        />
        {rooms.map((r) => (
          <FilterPill
            key={r.id}
            label={r.name}
            active={filterRoom === r.id}
            onClick={() => setFilterRoom(r.id)}
          />
        ))}
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-14 h-14 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <p className="text-slate-400 mb-1">No photos yet</p>
          <p className="text-slate-600 text-sm">Use the + button to capture photos or add notes</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((item, i) => (
            <MediaThumbnail
              key={item.id}
              item={item}
              onClick={() => setViewerIndex(i)}
            />
          ))}
        </div>
      )}

      {/* Fullscreen viewer */}
      {viewerIndex !== null && filtered[viewerIndex] && (
        <FullscreenViewer
          items={filtered}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onDelete={handleDelete}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 ${
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function FullscreenViewer({ items, index, onIndexChange, onDelete, onClose }) {
  const item = items[index];
  const isNote = item.type === 'note';

  // Swipe handling
  const [touchStartX, setTouchStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  function onTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
  }

  function onTouchMove(e) {
    setOffsetX(e.touches[0].clientX - touchStartX);
  }

  function onTouchEnd() {
    if (offsetX > 60 && index > 0) {
      onIndexChange(index - 1);
    } else if (offsetX < -60 && index < items.length - 1) {
      onIndexChange(index + 1);
    }
    setOffsetX(0);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button onClick={onClose} className="text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-slate-400 text-sm">
          {index + 1} / {items.length}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isNote ? (
          <div className="max-w-sm mx-auto px-6 text-center">
            <svg className="w-10 h-10 text-amber-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-white text-lg">{item.note_text}</p>
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.caption || ''}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `translateX(${offsetX}px)` }}
          />
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 bg-black/80 space-y-1">
        {item.room_name && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            {item.room_name}
          </span>
        )}
        {item.caption && (
          <p className="text-sm text-slate-300">{item.caption}</p>
        )}
        <p className="text-xs text-slate-600">
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
