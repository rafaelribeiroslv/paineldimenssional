import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AnimatedLogo from '../ui/AnimatedLogo';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const email = `${username.toLowerCase()}@dimensional.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create Firestore doc
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: username,
        role: username === 'RafaelGtz' ? 'admin' : 'user',
        status: username === 'RafaelGtz' ? 'active' : 'pending',
        createdAt: new Date().toISOString(),
        expiryDate: null
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este nome de usuário já está em uso.");
      } else {
        setError(err.message || "Erro dimensional ao registrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-body relative overflow-hidden text-stone-200">
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
              Solicitar Acesso
            </h1>
            <div className="h-1 w-12 mt-4 rounded-full bg-amber-600"></div>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center flex-col items-center gap-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-sm font-bold uppercase tracking-widest text-green-400">Sucesso!</p>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Sua solicitação foi enviada. Aguarde a aprovação do Administrador Supremo para acessar o portal.
              </p>
              <p className="text-[10px] text-amber-500 uppercase font-black">Redirecionando para Login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Username Desejado</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-stone-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
                    placeholder="Ex: dimensional_explorer"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Definir Senha</label>
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

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Confirmar Senha</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/40 border border-stone-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-bold uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-xl bg-amber-600 text-black shadow-lg shadow-amber-500/20 hover:bg-amber-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sincronizando...' : 'Criar Registro'}
              </button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-[10px] text-stone-500 hover:text-amber-500 uppercase tracking-widest font-bold transition-colors">
                  Já tenho um registro
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
