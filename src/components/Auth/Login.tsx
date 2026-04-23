import React, { useState } from 'react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Key, User, AlertCircle } from 'lucide-react';

import AnimatedLogo from '../ui/AnimatedLogo';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'system' | 'admin'>('system');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ username, password });
      
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
              className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600/20 transition-all"
            >
              Suporte WhatsApp
            </a>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-medium">
            Acesso restrito a usuários cadastrados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
