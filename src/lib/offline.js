import { Network } from '@capacitor/network';
import { createMoistureReading } from './api';

const JOBS_CACHE_KEY = 'restodoc_jobs_cache';
const OFFLINE_QUEUE_KEY = 'restodoc_offline_queue';

// ── Job list cache ──────────────────────────────────────────────

export function getCachedJobs() {
  try {
    const raw = localStorage.getItem(JOBS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedJobs(jobs) {
  try {
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(jobs));
  } catch {
    // localStorage full or unavailable
  }
}

// ── Offline queue for moisture readings ─────────────────────────

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueReading(data) {
  const queue = getOfflineQueue();
  queue.push({ ...data, _queued_at: Date.now() });
  setOfflineQueue(queue);
}

export async function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  const failed = [];
  let synced = 0;

  for (const item of queue) {
    const { _queued_at, ...data } = item;
    try {
      await createMoistureReading(data);
      synced++;
    } catch {
      failed.push(item);
    }
  }

  setOfflineQueue(failed);
  return synced;
}

// ── Network status ──────────────────────────────────────────────

export async function isOnline() {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return navigator.onLine;
  }
}

export function onNetworkChange(callback) {
  return Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
}
