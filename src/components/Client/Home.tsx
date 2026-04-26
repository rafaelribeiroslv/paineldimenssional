import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Clock, Newspaper, LogOut, ChevronRight, User as UserIcon, Search, Tag, Filter, LayoutDashboard } from 'lucide-react';
import { formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnimatedLogo from '../ui/AnimatedLogo';

export default function ClientHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect admins directly to dashboard if they land here
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }

    Promise.all([api.getPosts(), api.getCategories()]).then(([p, c]) => {
      setPosts(p);
      setCategories(c);
    });
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.expiryDate || user?.role === 'admin') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      if (!user?.expiryDate) return false;
      
      const expiry = parseISO(user.expiryDate);
      const now = new Date();
      
      if (!isAfter(expiry, now)) {
        setTimeLeft(null);
        // Force logout if expired
        alert("Seu acesso VIP expirou. Renove sua assinatura!");
        logout();
        navigate('/login');
        return false;
      }

      const diff = expiry.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ d, h, m, s });
      return true;
    };

    // Calculate immediately to avoid delay
    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row relative overflow-x-hidden text-stone-200">
      {/* Categories Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#0a0a0a] border-r border-amber-500/10 z-50 p-6 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <AnimatedLogo size={32} color="#d4af37" />
                  <span className="text-sm font-bold text-amber-500 tracking-widest uppercase">Portal VIP</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bento-card p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Filter className="w-3 h-3" /> Categorias
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => { setSelectedCategory(null); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest border ${
                          !selectedCategory 
                            ? 'bg-amber-600 border-amber-500 text-black shadow-lg shadow-amber-500/30' 
                            : 'bg-zinc-900 border-white/5 text-stone-500 hover:text-stone-200'
                        }`}
                      >
                        <Newspaper className="w-4 h-4" />
                        Início
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => { setSelectedCategory(cat.id); setIsSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest border ${
                            selectedCategory === cat.id 
                              ? 'bg-amber-600 border-amber-500 text-black shadow-lg shadow-amber-500/30' 
                              : 'bg-zinc-900 border-white/5 text-stone-500 hover:text-stone-200'
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-amber-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] text-stone-500 uppercase font-black tracking-widest block">Logado como</span>
                        <span className="text-xs font-bold text-stone-100 truncate">{user?.username}</span>
                      </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 border border-white/5 text-stone-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-auto bento-card p-6 bg-amber-600/5 border-amber-500/10">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">Dimensional Sync</h4>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {user?.role === 'admin' ? 'Acesso administrativo vitalício habilitado.' : 'Sua conexão com o portal está segura.'}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full max-w-7xl mx-auto">
        {/* Top Header Bar */}
        <div className="flex justify-between items-center bg-zinc-900/40 border border-amber-500/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-amber-600/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-600 hover:text-black transition-all shadow-lg shadow-amber-500/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block h-6 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold text-white uppercase tracking-widest leading-none mb-1">
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Visão Geral'}
              </h1>
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-medium">Dimensional VIP</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.role === 'admin' ? (
              <button 
                onClick={() => navigate('/admin')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-600 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Painel Admin
              </button>
            ) : (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] text-stone-500 uppercase font-black">Status VIP</span>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sincronizado
                </span>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-amber-500/10 flex items-center justify-center relative group">
              <UserIcon className={`w-4 h-4 transition-colors ${user?.username === 'RafaelGtz' ? 'text-red-500 group-hover:text-red-400' : 'text-stone-400 group-hover:text-amber-500'}`} />
              {user?.role === 'admin' && (
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${user?.username === 'RafaelGtz' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
              )}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-10 flex flex-col lg:flex-row justify-between items-center gap-8 min-h-[200px] bg-gradient-to-br from-zinc-900/40 to-amber-900/5 border-amber-500/5"
        >
          <div className="flex-1 text-center lg:text-left">
            <span className={`px-4 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-widest ${
              user?.username === 'RafaelGtz'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : (user?.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : (user?.expiryDate 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-green-500/10 text-green-500 border-green-500/20'))
            }`}>
              {user?.username === 'RafaelGtz' 
                ? 'Administrador Supremo'
                : (user?.role === 'admin'
                    ? 'Painel Administrativo'
                    : (user?.expiryDate 
                        ? (timeLeft ? 'Assinatura VIP' : 'Acesso Expirado')
                        : 'Acesso Vitalício'))}
            </span>
            <h2 className="text-3xl sm:text-4xl font-light mt-8 text-slate-300 leading-tight">
              {user?.role === 'admin' 
                ? 'Bem-vindo ao Núcleo, ' 
                : (timeLeft ? 'Tempo de Acesso: ' : (user?.expiryDate ? 'Seu portal ' : 'Você possui '))}
              <span className="font-semibold text-white">
                {user?.role === 'admin' 
                  ? user.username 
                  : (timeLeft ? '' : (user?.expiryDate ? 'Instável' : 'Vínculo Vitalício'))}
              </span>
            </h2>
          </div>
          
          {user?.role !== 'admin' && timeLeft && (
            <div className="flex gap-3 sm:gap-5 flex-wrap justify-center">
              <TimeBlock value={timeLeft.d} label="Dias" />
              <TimeBlock value={timeLeft.h} label="Horas" />
              <TimeBlock value={timeLeft.m} label="Min" />
              <TimeBlock value={timeLeft.s} label="Seg" />
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="hidden lg:flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Privilégios</span>
                <span className="text-xs text-amber-500 font-mono">ROOT_ACCESS: ENABLED</span>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          {posts
            .filter(p => !selectedCategory || p.categoryId === selectedCategory)
            .map((post, idx) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bento-card overflow-hidden flex flex-col group"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={post.image} 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110" 
                    alt={post.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-amber-600/20 text-amber-400 text-[9px] font-bold uppercase tracking-widest border border-amber-500/30 rounded backdrop-blur-md">
                      {categories.find(c => c.id === post.categoryId)?.name || 'Dimensional'}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <h4 className="text-xl font-bold mb-3 text-white group-hover:text-amber-500 transition-colors">
                    {post.title}
                  </h4>
                  <p className={`text-sm text-stone-400 leading-relaxed italic mb-8 ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                    {post.content}
                  </p>
                  
                  <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-6">
                    <span className="text-[9px] text-stone-600 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {(() => {
                        try {
                          return post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : 'Sem data';
                        } catch (e) {
                          return 'Data Inválida';
                        }
                      })()}
                    </span>
                    <button 
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:text-amber-300 transition-colors flex items-center gap-1"
                    >
                      {expandedPost === post.id ? 'Sincronizar' : 'Ler Conteúdo'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${expandedPost === post.id ? '-rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}

          {posts.filter(p => !selectedCategory || p.categoryId === selectedCategory).length === 0 && (
            <div className="md:col-span-2 bento-card p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Tag className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sem frequências nesta categoria</h3>
              <p className="text-slate-500 italic max-w-sm">Este canal dimensional ainda está sendo carregado.</p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <footer className="mt-auto flex flex-col md:flex-row justify-between items-center gap-4 py-8 border-t border-zinc-900 text-[10px] text-stone-600 uppercase tracking-[0.2em] font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
            <span>Versão do Sistema: 2.4.0-Stable</span>
          </div>
          <span>&copy; 2026 Conhecimento Dimensional Systems</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-stone-400 cursor-pointer transition-colors">Termos de Uso</span>
            <span className="hover:text-stone-400 cursor-pointer transition-colors">Privacidade</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number, label: string }) {
  return (
    <div className="bg-black/60 border border-amber-500/10 px-6 py-4 rounded-2xl min-w-[100px] text-center backdrop-blur-md">
      <div className="text-3xl font-display font-black text-amber-500">{String(value).padStart(2, '0')}</div>
      <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{label}</div>
    </div>
  );
}
