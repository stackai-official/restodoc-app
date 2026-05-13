import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadMedia, createMediaRecord } from '../lib/api';

export default function CaptureMedia({ jobId, userId, rooms, onComplete, onClose }) {
  const [step, setStep] = useState('room'); // 'room' | 'caption' | 'uploading'
  const [selectedRoom, setSelectedRoom] = useState('');
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState('photo');
  const [error, setError] = useState('');

  async function takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        allowEditing: false,
        width: 1920,
      });

      setImageData(photo.base64String);
      setMediaType('photo');
      setStep('room');
    } catch (err) {
      // User cancelled
      if (err.message?.includes('cancel') || err.message?.includes('Cancel')) {
        onClose();
        return;
      }
      setError(err.message);
    }
  }

  async function recordVideo() {
    try {
      // Capacitor Camera plugin doesn't support video directly on all platforms.
      // Fall back to file input for video.
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.capture = 'environment';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageData(file);
        setMediaType('video');
        setStep('room');
      };
      input.click();
    } catch (err) {
      setError(err.message);
    }
  }

  // Start capture on mount based on mode passed in
  useState(() => {
    // This runs once on mount
  });

  async function handleSave() {
    setStep('uploading');
    setError('');

    try {
      const timestamp = Date.now();
      const ext = mediaType === 'video' ? 'mp4' : 'jpg';
      const filename = `${mediaType}_${timestamp}.${ext}`;
      const storagePath = `${userId}/${jobId}/${filename}`;

      let file;
      if (mediaType === 'video' && imageData instanceof File) {
        file = imageData;
      } else {
        // Convert base64 to blob
        const byteChars = atob(imageData);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }
        file = new Blob([byteArray], { type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' });
      }

      const url = await uploadMedia(file, storagePath);

      await createMediaRecord({
        job_id: jobId,
        room_id: selectedRoom || null,
        type: mediaType,
        url,
        caption: caption.trim() || null,
      });

      onComplete();
    } catch (err) {
      setError(err.message);
      setStep('caption');
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* No image yet — show capture options */}
        {!imageData && step === 'room' && (
          <div className="px-4 pb-6">
            <h3 className="text-white font-medium text-center mb-4">Capture Media</h3>
            <div className="space-y-2">
              <button
                onClick={takePhoto}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-white transition-colors"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                <span>Take Photo</span>
              </button>
              <button
                onClick={recordVideo}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-white transition-colors"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Record Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Room selector */}
        {imageData && step === 'room' && (
          <div className="px-4 pb-6">
            <h3 className="text-white font-medium text-center mb-4">Select Room</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setSelectedRoom(''); setStep('caption'); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  !selectedRoom ? 'bg-blue-500/15 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                No room
              </button>
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRoom(r.id); setStep('caption'); }}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caption + preview */}
        {imageData && step === 'caption' && (
          <div className="px-4 pb-6">
            <h3 className="text-white font-medium text-center mb-4">Add Caption</h3>

            {/* Preview */}
            {mediaType === 'photo' && (
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-800 mb-4">
                <img
                  src={`data:image/jpeg;base64,${imageData}`}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('room')}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="px-4 pb-8 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Uploading...</p>
          </div>
        )}
      </div>
    </>
  );
}
