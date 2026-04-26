import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Key, User, AlertCircle, Music, Volume2, VolumeX } from 'lucide-react';

import AnimatedLogo from '../ui/AnimatedLogo';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'system' | 'admin'>('system');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      try {
        user = await login({ username, password });
      } catch (err: any) {
        // If it's the designated super admin and they don't exist, try bootstrapping
        if (username === 'RafaelGtz' && (err.message.includes('Usuário ou senha incorretos') || err.message.includes('não encontrado'))) {
          try {
            const result = await api.bootstrapSuperAdmin({ username, password });
            user = result.user;
          } catch (bootstrapErr) {
            // If bootstrap also fails (e.g. auth user exists but firestore doc doesn't, though the catch above handles many things)
            // we re-throw the original error or the bootstrap error
            throw err;
          }
        } else {
          throw err;
        }
      }
      
      // Verification logic based on tab
      if (activeTab === 'admin' && user.role !== 'admin') {
        throw new Error("Estas credenciais não pertencem a um Administrador.");
      }

      if (activeTab === 'admin' && user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-body relative overflow-hidden text-stone-200">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d4af37 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[120px]"></div>

      {/* Music Player */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
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
            {isPlaying ? 'Música Ativa' : 'Música Desativada'}
          </span>
          {isPlaying && (
            <div className="flex gap-0.5 items-end h-3">
              <motion.div animate={{ height: [4, 12, 6, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-amber-500 rounded-full" />
              <motion.div animate={{ height: [8, 4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-amber-500 rounded-full" />
              <motion.div animate={{ height: [6, 10, 4, 12] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-amber-500 rounded-full" />
            </div>
          )}
        </button>

        {/* Hidden YouTube Iframe - using visibility trick to keep it running */}
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

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bento-card p-8 bg-zinc-900/60 shadow-2xl border-amber-500/10 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
              <AnimatedLogo size={64} color="#d4af37" />
            </div>
            <h1 className="text-xl font-display font-bold text-center text-amber-500/90 tracking-widest uppercase">
              Conhecimento Dimensionais
            </h1>
            <div className="h-1 w-12 mt-4 rounded-full bg-amber-600"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">
                Protocolo de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-stone-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
                  placeholder="ID Dimensional"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Chave de Segurança</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-stone-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-bold uppercase tracking-tight"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-xl bg-amber-600 text-black shadow-lg shadow-amber-500/20 hover:bg-amber-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Validar Identidade'}
            </button>

            <a 
              href="https://wa.me/558494792723"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600/20 transition-all mb-4"
            >
              Suporte WhatsApp
            </a>

            <div className="h-4"></div>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-medium">
            Acesso restrito a usuários cadastrados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
