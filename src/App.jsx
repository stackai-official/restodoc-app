import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Preferences } from '@capacitor/preferences';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import ReportsList from './pages/ReportsList';
import Settings from './pages/Settings';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import AddRoom from './pages/AddRoom';
import FloorPlan from './pages/FloorPlan';
import GenerateReport from './pages/GenerateReport';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AuthenticatedApp({ session }) {
  const userId = session.user.id;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Dashboard userId={userId} />} />
        <Route path="/calendar" element={<Calendar userId={userId} />} />
        <Route path="/reports" element={<ReportsList userId={userId} />} />
        <Route path="/settings" element={<Settings session={session} />} />
        <Route path="/jobs/new" element={<CreateJob userId={userId} />} />
        <Route path="/jobs/:id" element={<JobDetail userId={userId} />} />
        <Route path="/jobs/:id/floor-plan" element={<FloorPlan />} />
        <Route path="/jobs/:id/report" element={<GenerateReport />} />
        <Route path="/jobs/:id/rooms/new" element={<AddRoom />} />
        <Route path="/jobs/:id/rooms/:roomId" element={<RoomDetailPlaceholder />} />
        <Route path="/jobs/:id/edit" element={<EditJobPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function RoomDetailPlaceholder() {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/jobs/${id}`)} className="text-slate-400 hover:text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Room Detail</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">Room detail coming soon</p>
      </div>
    </div>
  );
}

function EditJobPlaceholder() {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/jobs/${id}`)} className="text-slate-400 hover:text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Edit Job</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">Edit job coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const { value } = await Preferences.get({ key: 'auth_session' });
      if (value) {
        const saved = JSON.parse(value);
        await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token,
        });
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);

        // Persist refreshed tokens
        if (event === 'TOKEN_REFRESHED' && newSession) {
          Preferences.set({
            key: 'auth_session',
            value: JSON.stringify({
              access_token: newSession.access_token,
              refresh_token: newSession.refresh_token,
            }),
          });
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={session ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/*"
        element={session ? <AuthenticatedApp session={session} /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
