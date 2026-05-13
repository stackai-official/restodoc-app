import { supabase } from '../lib/supabase';
import { Preferences } from '@capacitor/preferences';

const APP_VERSION = '1.0.0';

export default function Settings({ session }) {
  const user = session?.user;

  async function handleLogout() {
    await supabase.auth.signOut();
    await Preferences.remove({ key: 'auth_session' });
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </header>

      <div className="flex-1 px-4 py-4 pb-24 space-y-4">
        {/* Profile */}
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Profile</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-lg font-bold">
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm truncate">{user?.email || 'Unknown'}</p>
              <p className="text-xs text-slate-500">
                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">App</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span className="text-slate-300">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Build</span>
              <span className="text-slate-300">Capacitor + React</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg bg-slate-800 border border-slate-700 text-red-400 hover:bg-slate-750 hover:border-slate-600 transition-colors min-h-[48px]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
