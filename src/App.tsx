import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from './services/api';
import Login from './components/Auth/Login';
import Landing from './components/Landing';
import ClientHome from './components/Client/Home';
import AdminDashboard from './components/Admin/Dashboard';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Auth sync error:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: any) => {
    const data = await api.login(credentials);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {loading ? (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

function MusicPlayer({ isPlaying, toggleMusic }: { isPlaying: boolean, toggleMusic: () => void }) {
  const location = useLocation();
  const isAmbientPage = ['/landing', '/login'].includes(location.pathname);

  return (
    <div className="fixed top-6 right-6 z-[100]">
      {/* Show controls only on landing/login to keep UI clean in dashboard, but iframe stays always */}
      {isAmbientPage && (
        <button
          onClick={toggleMusic}
          className={`group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${
            isPlaying 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
            : 'bg-zinc-900/50 border-white/5 text-stone-500 hover:border-white/10'
          }`}
        >
          <div className="relative">
            {isPlaying ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
            {isPlaying ? 'Áudio Ativo' : 'Áudio Mudo'}
          </span>
          {isPlaying && (
            <div className="flex gap-0.5 items-end h-3">
              <motion.div animate={{ height: [4, 12, 6, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-amber-500 rounded-full" />
              <motion.div animate={{ height: [8, 4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-amber-500 rounded-full" />
              <motion.div animate={{ height: [6, 10, 4, 12] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-amber-500 rounded-full" />
            </div>
          )}
        </button>
      )}

      {/* Hidden YouTube Iframe - stays mounted to keep music playing */}
      <div className="absolute opacity-0 pointer-events-none overflow-hidden h-0 w-0">
        {isPlaying && (
          <iframe
            width="100"
            height="100"
            src={`https://www.youtube.com/embed/ayME3xJXhIQ?autoplay=1&mute=0&loop=1&playlist=ayME3xJXhIQ&enablejsapi=1`}
            title="YouTube background audio"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const [isMusicStarted, setIsMusicStarted] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <MusicPlayer isPlaying={isMusicStarted} toggleMusic={() => setIsMusicStarted(!isMusicStarted)} />
        <Routes>
          <Route path="/landing" element={<Landing onStart={() => setIsMusicStarted(true)} />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ClientHome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/landing" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
