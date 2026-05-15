import { createClient } from '@supabase/supabase-js';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// On native (iOS / Android), route Supabase's HTTP traffic through
// CapacitorHttp explicitly. Fixes the iOS "invalid path specified in
// request url" error caused by the WebView's `capacitor://localhost`
// origin tripping up Supabase's URL handling under the auto-patched
// fetch path.
async function nativeFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : (input.url || input.toString());

  const headers = {};
  if (init.headers) {
    const h = new Headers(init.headers);
    h.forEach((value, key) => { headers[key] = value; });
  }

  const response = await CapacitorHttp.request({
    url,
    method: init.method || 'GET',
    headers,
    data: init.body,
  });

  const body = typeof response.data === 'string'
    ? response.data
    : JSON.stringify(response.data);

  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}

const clientOptions = Capacitor.isNativePlatform()
  ? { global: { fetch: nativeFetch } }
  : {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
