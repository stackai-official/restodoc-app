import { useState, useEffect } from 'react';
import { isOnline, onNetworkChange, syncOfflineQueue, getOfflineQueue } from '../lib/offline';

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    isOnline().then(setOnline);
    setQueueCount(getOfflineQueue().length);

    const listener = onNetworkChange(async (connected) => {
      setOnline(connected);
      if (connected) {
        const queue = getOfflineQueue();
        if (queue.length > 0) {
          setSyncing(true);
          await syncOfflineQueue();
          setSyncing(false);
          setQueueCount(getOfflineQueue().length);
        }
      }
    });

    return () => { listener.then((l) => l.remove()); };
  }, []);

  if (online && !syncing && queueCount === 0) return null;

  return (
    <div className={`fixed top-0 inset-x-0 z-50 px-4 py-1.5 text-center text-xs font-medium ${
      syncing
        ? 'bg-amber-500/90 text-white'
        : online
          ? 'bg-emerald-500/90 text-white'
          : 'bg-red-500/90 text-white'
    }`}>
      {syncing
        ? 'Syncing queued readings...'
        : !online
          ? `Offline${queueCount > 0 ? ` — ${queueCount} reading${queueCount > 1 ? 's' : ''} queued` : ''}`
          : `${queueCount} reading${queueCount > 1 ? 's' : ''} synced`
      }
    </div>
  );
}
