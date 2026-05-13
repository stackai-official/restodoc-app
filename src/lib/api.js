import { supabase } from './supabase';

// ── Backend fetch helper (Express API) ──────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  return res.json();
}

// ── Supabase query helpers ──────────────────────────────────────

export async function getJobs(userId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      rooms:rooms(count),
      media:media(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((job) => ({
    ...job,
    room_count: job.rooms[0]?.count ?? 0,
    media_count: job.media[0]?.count ?? 0,
  }));
}

export async function createJob(jobData) {
  const { data, error } = await supabase
    .from('jobs')
    .insert(jobData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(id, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJob(id) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Single job ──────────────────────────────────────────────────

export async function getJob(id) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ── Rooms ───────────────────────────────────────────────────────

export async function getRooms(jobId) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      moisture_readings:moisture_readings(count)
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map((room) => ({
    ...room,
    moisture_count: room.moisture_readings[0]?.count ?? 0,
  }));
}

export async function createRoom(roomData) {
  const { data, error } = await supabase
    .from('rooms')
    .insert(roomData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoom(id) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Media ───────────────────────────────────────────────────────

export async function getMedia(jobId) {
  const { data, error } = await supabase
    .from('media')
    .select('*, room:rooms(name)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((m) => ({
    ...m,
    room_name: m.room?.name ?? null,
  }));
}

export async function uploadMedia(file, path) {
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, { upsert: true });

  if (error) {
    if (error.message?.includes('Bucket not found')) {
      throw new Error('Storage bucket "media" not found. Please create it in Supabase Dashboard → Storage → New bucket → name "media" → toggle Public → Create.');
    }
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function createMediaRecord(record) {
  const { data, error } = await supabase
    .from('media')
    .insert(record)
    .select('*, room:rooms(name)')
    .single();

  if (error) throw error;

  return { ...data, room_name: data.room?.name ?? null };
}

export async function deleteMedia(id) {
  // Fetch the record first to get the storage path
  const { data: record, error: fetchErr } = await supabase
    .from('media')
    .select('url')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  // Delete from storage if it has a URL
  if (record.url) {
    // Extract path after /object/public/media/
    const match = record.url.match(/\/media\/(.+)$/);
    if (match) {
      await supabase.storage.from('media').remove([match[1]]);
    }
  }

  // Delete the DB record
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Moisture Readings ───────────────────────────────────────────

export async function getMoistureReadings(jobId, roomId) {
  let query = supabase
    .from('moisture_readings')
    .select('*, room:rooms(name)')
    .eq('job_id', jobId)
    .order('reading_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (roomId) {
    query = query.eq('room_id', roomId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((r) => ({
    ...r,
    room_name: r.room?.name ?? null,
  }));
}

export async function createMoistureReading(data) {
  const { data: record, error } = await supabase
    .from('moisture_readings')
    .insert(data)
    .select('*, room:rooms(name)')
    .single();

  if (error) throw error;
  return { ...record, room_name: record.room?.name ?? null };
}

export async function updateMoistureReading(id, updates) {
  const { data, error } = await supabase
    .from('moisture_readings')
    .update(updates)
    .eq('id', id)
    .select('*, room:rooms(name)')
    .single();

  if (error) throw error;
  return { ...data, room_name: data.room?.name ?? null };
}

export async function deleteMoistureReading(id) {
  const { error } = await supabase
    .from('moisture_readings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Equipment ───────────────────────────────────────────────────

export async function getEquipment(jobId) {
  const { data, error } = await supabase
    .from('equipment_log')
    .select('*, room:rooms(name)')
    .eq('job_id', jobId)
    .order('placed_date', { ascending: false });

  if (error) throw error;

  return data.map((e) => ({
    ...e,
    room_name: e.room?.name ?? null,
  }));
}

export async function createEquipment(data) {
  const { data: record, error } = await supabase
    .from('equipment_log')
    .insert(data)
    .select('*, room:rooms(name)')
    .single();

  if (error) throw error;
  return { ...record, room_name: record.room?.name ?? null };
}

export async function updateEquipment(id, updates) {
  const { data, error } = await supabase
    .from('equipment_log')
    .update(updates)
    .eq('id', id)
    .select('*, room:rooms(name)')
    .single();

  if (error) throw error;
  return { ...data, room_name: data.room?.name ?? null };
}

export async function deleteEquipment(id) {
  const { error } = await supabase
    .from('equipment_log')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Floor Plans ─────────────────────────────────────────────────

export async function getFloorPlan(jobId) {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertFloorPlan(jobId, canvasData) {
  // Check if one exists
  const existing = await getFloorPlan(jobId);

  if (existing) {
    const { data, error } = await supabase
      .from('floor_plans')
      .update({ canvas_data: canvasData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('floor_plans')
    .insert({ job_id: jobId, canvas_data: canvasData })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Reports ─────────────────────────────────────────────────────

export async function getReports(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, job:jobs(title, address)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((r) => ({
    ...r,
    job_title: r.job?.title ?? null,
    job_address: r.job?.address ?? null,
  }));
}

export async function createReport(reportData) {
  const { data, error } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
