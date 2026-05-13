import { useState } from 'react';

export default function AddNoteModal({ rooms, onSave, onClose }) {
  const [roomId, setRoomId] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await onSave({ roomId: roomId || null, text: text.trim() });
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-slate-900 border border-slate-700 rounded-2xl max-w-md mx-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <h3 className="text-white font-medium">Add Note</h3>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Room selector */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Room (optional)</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Note text */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Note *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Enter your note..."
            />
          </div>
        </div>
      </div>
    </>
  );
}
