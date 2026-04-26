import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../App';
import { motion, AnimatePresence } from 'motion/react';
import { Users, FileText, Plus, Trash2, LayoutDashboard, LogOut, Loader2, Image as ImageIcon, Edit2, X, Search, FolderPlus, Tag, Shield, CheckCircle, XCircle, Crown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'categories'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newPost, setNewPost] = useState({ title: '', content: '', image: '', categoryId: '' });
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    expiryDate: '',
    role: 'user',
    duration: { d: 0, h: 0, m: 0 },
    isEternal: false
  });
  const [newCategory, setNewCategory] = useState({ name: '' });
  
  // Editing states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Confirmation states
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'post' | 'category', id: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p, c] = await Promise.all([
        api.getUsers(), 
        api.getPosts(),
        api.getCategories()
      ]);
      
      // Sort users: SuperAdmin first, then Admins, then VIPs
      const sortedUsers = [...u].sort((a: any, b: any) => {
        if (a.username === 'RafaelGtz') return -1;
        if (b.username === 'RafaelGtz') return 1;
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return (a.username || '').localeCompare(b.username || '');
      });

      setUsers(sortedUsers);
      setPosts(p);
      setCategories(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPostId) {
        await api.updatePost(editingPostId, newPost);
        setEditingPostId(null);
      } else {
        await api.createPost(newPost);
      }
      setNewPost({ title: '', content: '', image: '', categoryId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newCategory.name.trim()) return;
      await api.createCategory(newCategory);
      setNewCategory({ name: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalExpiryDate = newUser.expiryDate;
      
      if (!newUser.isEternal) {
        const hasDuration = newUser.duration.d > 0 || newUser.duration.h > 0 || newUser.duration.m > 0;
        
        if (hasDuration) {
          const date = new Date();
          date.setDate(date.getDate() + newUser.duration.d);
          date.setHours(date.getHours() + newUser.duration.h);
          date.setMinutes(date.getMinutes() + newUser.duration.m);
          finalExpiryDate = date.toISOString();
        } else if (!newUser.expiryDate && !editingUserId) {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          finalExpiryDate = date.toISOString();
        }
      } else {
        finalExpiryDate = '';
      }

      const userData: any = {
        username: newUser.username,
        role: newUser.role,
        expiryDate: finalExpiryDate
      };

      // Only include password if provided
      if (newUser.password.trim()) {
        userData.password = newUser.password;
      }

      if (editingUserId) {
        await api.updateUser(editingUserId, userData);
        setEditingUserId(null);
      } else {
        // Password is required for new users
        if (!newUser.password.trim()) {
          throw new Error("A senha é obrigatória para novos usuários.");
        }
        await api.createUser({...userData, password: newUser.password});
      }
      setNewUser({ 
        username: '', 
        password: '', 
        expiryDate: '', 
        role: 'user',
        duration: { d: 0, h: 0, m: 0 },
        isEternal: false
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const approveUser = async (id: string) => {
    try {
      await api.updateUser(id, { status: 'active' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const rejectUser = async (id: string) => {
    if (window.confirm("Deseja realmente rejeitar este usuário?")) {
      try {
        await api.updateUser(id, { status: 'rejected' });
        fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const startEditingPost = (post: any) => {
    setEditingPostId(post.id);
    setNewPost({ 
      title: post.title || '', 
      content: post.content || '', 
      image: post.image || '', 
      categoryId: post.categoryId || '' 
    });
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingUser = (user: any) => {
    setEditingUserId(user.id);
    let dateStr = '';
    if (user.expiryDate) {
      try {
        const date = new Date(user.expiryDate);
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().slice(0, 16);
        }
      } catch (e) {}
    }
    setNewUser({ 
      username: user.username || '', 
      password: '', 
      expiryDate: dateStr,
      role: user.role || 'user',
      duration: { d: 0, h: 0, m: 0 },
      isEternal: !user.expiryDate
    });
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingUserId(null);
    setNewPost({ title: '', content: '', image: '', categoryId: '' });
    setNewUser({ 
      username: '', 
      password: '', 
      expiryDate: '',
      role: 'user',
      duration: { d: 0, h: 0, m: 0 },
      isEternal: false
    });
    setNewCategory({ name: '' });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      if (confirmDelete.type === 'user') {
        await api.deleteUser(confirmDelete.id);
      } else if (confirmDelete.type === 'post') {
        await api.deletePost(confirmDelete.id);
      } else if (confirmDelete.type === 'category') {
        await api.deleteCategory(confirmDelete.id);
      }
      setConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row p-6 md:p-8 gap-6 text-stone-200">
      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bento-card p-8 max-w-sm w-full bg-zinc-900 border-amber-500/20 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-4">Confirmar Exclusão?</h3>
              <p className="text-stone-400 mb-8 leading-relaxed">
                Esta ação é irreversível. Você tem certeza que deseja remover este {confirmDelete.type === 'user' ? 'usuário' : confirmDelete.type === 'category' ? 'categoria' : 'post'} do sistema?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-stone-800 text-stone-300 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-stone-700 transition-colors"
                >
                  Não, Cancelar
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-500 transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sidebar - Bento Style */}
      <aside className="w-full md:w-72 bento-card p-6 flex flex-col border-amber-500/5">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-amber-600 text-black rounded-lg flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">A</div>
            <span className="font-display font-bold tracking-tight text-white uppercase text-sm">Painel Admin</span>
          </div>

          <nav className="space-y-3">
            <TabButton 
              active={activeTab === 'users'} 
              onClick={() => { setActiveTab('users'); cancelEdit(); setSearchQuery(''); }} 
              icon={<Users className="w-4 h-4" />} 
              label="Usuários VIP" 
            />
            <TabButton 
              active={activeTab === 'posts'} 
              onClick={() => { setActiveTab('posts'); cancelEdit(); setSearchQuery(''); }} 
              icon={<FileText className="w-4 h-4" />} 
              label="Conteúdo" 
            />
            <TabButton 
              active={activeTab === 'categories'} 
              onClick={() => { setActiveTab('categories'); cancelEdit(); setSearchQuery(''); }} 
              icon={<Tag className="w-4 h-4" />} 
              label="Categorias" 
            />
          </nav>
        </div>

        <div className="mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 hover:text-white hover:bg-stone-800 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Statistics Header / Top Nav */}
        <header className="bento-card p-6 flex flex-col lg:flex-row justify-between items-center gap-4 border-amber-500/5">
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-3 whitespace-nowrap">
            <LayoutDashboard className="w-6 h-6 text-amber-500" />
            {activeTab === 'users' ? 'Gestão de Acessos' : activeTab === 'posts' ? 'Publicações Ativas' : 'Gestão de Categorias'}
          </h1>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <input 
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
              />
            </div>
            <div className="h-8 w-[1px] bg-white/5 mx-2"></div>
            <div className="px-4 py-2 bg-stone-800 rounded-lg text-[10px] text-stone-400 font-bold uppercase tracking-widest border border-white/5">
              Admin: {user?.username}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
        ) : (
          <div className="flex flex-col gap-6 flex-grow">
            {/* Form Section - Now at the top */}
            <div className="w-full">
              <div className="bento-card p-6 bg-amber-600/5 border-amber-500/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-amber-500 uppercase tracking-widest">
                    {editingPostId || editingUserId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {activeTab === 'users' ? (editingUserId ? 'Editar Credencial' : 'Nova Credencial') : (editingPostId ? 'Editar Conteúdo' : 'Novo Conteúdo')}
                  </h3>
                  {(editingPostId || editingUserId) && (
                    <button onClick={cancelEdit} className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {activeTab === 'users' ? (
                  <form onSubmit={handleUserSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5 items-end">
                      <InputField 
                        label="Username" 
                        value={newUser.username} 
                        onChange={v => setNewUser({...newUser, username: v})} 
                      />
                      <InputField 
                        label={editingUserId ? "Nova Senha (opcional)" : "Senha Inicial"} 
                        type="password"
                        value={newUser.password} 
                        onChange={v => setNewUser({...newUser, password: v})} 
                        required={!editingUserId}
                      />
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Tipo de Conta</label>
                        <select 
                          className="w-full bg-black/40 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 outline-none focus:border-amber-500/30 transition-colors"
                          value={newUser.role}
                          onChange={e => setNewUser({...newUser, role: e.target.value})}
                        >
                          <option value="user">Usuário VIP</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="flex items-center h-[46px] gap-2 px-4 bg-black/40 border border-stone-800 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="isEternal"
                          className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-amber-600 focus:ring-amber-500/20"
                          checked={newUser.isEternal} 
                          onChange={e => setNewUser({...newUser, isEternal: e.target.checked})}
                        />
                        <label htmlFor="isEternal" className="text-xs text-stone-400 font-bold uppercase tracking-widest cursor-pointer select-none">
                          Acesso Eterno
                        </label>
                      </div>
                    </div>

                    {!newUser.isEternal && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                        <div className="md:col-span-3 grid grid-cols-3 gap-4">
                          <InputField 
                            label="Dias" 
                            type="number"
                            value={newUser.duration.d.toString()} 
                            onChange={v => setNewUser({...newUser, duration: {...newUser.duration, d: parseInt(v) || 0}})} 
                          />
                          <InputField 
                            label="Horas" 
                            type="number"
                            value={newUser.duration.h.toString()} 
                            onChange={v => setNewUser({...newUser, duration: {...newUser.duration, h: parseInt(v) || 0}})} 
                          />
                          <InputField 
                            label="Minutos" 
                            type="number"
                            value={newUser.duration.m.toString()} 
                            onChange={v => setNewUser({...newUser, duration: {...newUser.duration, m: parseInt(v) || 0}})} 
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col text-left">
                          <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Ou Data Específica</label>
                          <input 
                            type="datetime-local"
                            className="bg-black/40 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 outline-none focus:border-amber-500/30 transition-colors"
                            value={newUser.expiryDate} 
                            onChange={e => setNewUser({...newUser, expiryDate: e.target.value})} 
                          />
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn-primary w-full h-[46px] text-xs font-bold uppercase tracking-widest">
                      {editingUserId ? 'Salvar Alterações' : 'Validar Usuário'}
                    </button>
                  </form>
                ) : activeTab === 'posts' ? (
                  <form onSubmit={handlePostSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField 
                        label="Título" 
                        value={newPost.title} 
                        onChange={v => setNewPost({...newPost, title: v})} 
                      />
                      <InputField 
                        label="URL da Imagem" 
                        value={newPost.image} 
                        onChange={v => setNewPost({...newPost, image: v})} 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Categoria</label>
                        <select 
                          className="w-full bg-black/40 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 outline-none focus:border-amber-500/30 transition-colors"
                          value={newPost.categoryId}
                          onChange={e => setNewPost({...newPost, categoryId: e.target.value})}
                        >
                          <option value="">Sem Categoria</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Corpo do Texto</label>
                      <textarea 
                        className="w-full bg-black/40 border border-stone-800 rounded-xl p-4 text-xs min-h-[100px] text-stone-100 outline-none focus:border-amber-500/30 transition-colors"
                        value={newPost.content}
                        onChange={e => setNewPost({...newPost, content: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full h-[46px] text-xs font-bold uppercase tracking-widest">
                      {editingPostId ? 'Salvar Alterações' : 'Sincronizar Post'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                    <InputField 
                      label="Nome da Categoria" 
                      value={newCategory.name} 
                      onChange={v => setNewCategory({...newCategory, name: v})} 
                    />
                    <button type="submit" className="btn-primary w-full h-[46px] text-xs font-bold uppercase tracking-widest">
                      Criar Categoria
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* List Section - Now below the form */}
            <div className="flex flex-col gap-6">
              {activeTab === 'users' ? (
                <div className="bento-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-black/60 text-stone-500 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4">Nome de Usuário</th>
                          <th className="px-6 py-4">Status / Tipo</th>
                          <th className="px-6 py-4">Expiração do VIP</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(searchQuery.trim() ? users.filter(u => (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())) : users).map(u => {
                          const isSuperAdmin = u.username === 'RafaelGtz';
                          const isAdmin = u.role === 'admin' && !isSuperAdmin;
                          const isPermanent = !u.expiryDate && u.role !== 'admin';
                          const isExpiring = u.expiryDate && u.role !== 'admin';
                          
                          let badgeClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                          let label = "VIP";

                          if (isSuperAdmin) {
                            badgeClass = "bg-red-500/10 text-red-500 border border-red-500/20";
                            label = "Supremo";
                          } else if (isAdmin) {
                            badgeClass = "bg-pink-500/10 text-pink-500 border border-pink-500/20";
                            label = "Admin";
                          } else if (isPermanent) {
                            badgeClass = "bg-green-500/10 text-green-500 border border-green-500/20";
                            label = "VIP Permanente";
                          } else if (isExpiring) {
                            badgeClass = "bg-red-500/10 text-red-500 border border-red-500/20";
                            label = "VIP Expira";
                          }

                          const canBeEditedByMe = user?.username === 'RafaelGtz';
                          const canBeDeletedByMe = user?.username === 'RafaelGtz' && u.username !== 'RafaelGtz';

                          return (
                            <tr key={u.id} className="hover:bg-amber-500/5 transition-colors">
                              <td className="px-6 py-4 font-semibold text-stone-200">
                                <div className="flex items-center gap-2">
                                  {u.username}
                                  {u.status === 'pending' && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase">Pendentes</span>
                                  )}
                                  {u.status === 'rejected' && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-black uppercase">Rejeitado</span>
                                  )}
                                  {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-red-500" />}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${badgeClass}`}>
                                  {label}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-sm font-mono ${isPermanent ? 'text-green-500' : isExpiring ? 'text-red-400' : 'text-slate-400'}`}>
                                {u.expiryDate ? (() => {
                                  try {
                                    return format(new Date(u.expiryDate), 'dd/MM/yyyy HH:mm');
                                  } catch (e) {
                                    return 'Data Inválida';
                                  }
                                })() : (u.role === 'admin' ? 'Vitalício' : 'Permanente')}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {user?.username === 'RafaelGtz' && u.status === 'pending' && (
                                  <>
                                    <button onClick={() => approveUser(u.id)} title="Aprovar Usuário" className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-all">
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => rejectUser(u.id)} title="Rejeitar Usuário" className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all">
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {canBeEditedByMe && (
                                  <button onClick={() => startEditingUser(u)} className="p-2 hover:bg-amber-500/10 text-stone-500 hover:text-amber-500 rounded-lg transition-all">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {canBeDeletedByMe && (
                                  <button onClick={() => setConfirmDelete({ type: 'user', id: u.id })} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {users.length > 0 && searchQuery.trim() && users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                              Nenhum usuário encontrado para "{searchQuery}".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {users.length === 0 && <p className="p-12 text-center text-slate-500 italic text-sm">Nenhum portal VIP registrado.</p>}
                </div>
              ) : activeTab === 'posts' ? (
                <div className="grid grid-cols-1 gap-6">
                    {posts.filter(p => (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.content || '').toLowerCase().includes(searchQuery.toLowerCase())).map(post => (
                      <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bento-card flex flex-col sm:flex-row gap-6 p-6 hover:border-amber-500/30 transition-colors cursor-default"
                      >
                        <img src={post.image} className="w-full sm:w-32 h-32 object-cover rounded-2xl border border-white/5" />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between">
                              <div className="flex flex-col">
                                <h4 className="text-lg font-bold mb-2 text-amber-500/90">{post.title}</h4>
                                <div className="flex gap-2 mb-2">
                                  {post.categoryId && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase rounded tracking-widest border border-amber-500/20">
                                      {categories.find(c => c.id === post.categoryId)?.name || 'Desconhecida'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => startEditingPost(post)} className="p-2 hover:bg-amber-500/10 text-stone-500 hover:text-amber-500 rounded-lg transition-all">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setConfirmDelete({ type: 'post', id: post.id })} className="p-2 hover:bg-red-500/10 text-stone-500 hover:text-red-500 rounded-lg transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{post.content}</p>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-[10px] text-stone-600 uppercase font-bold tracking-widest">
                              {(() => {
                                try {
                                  return post.createdAt ? format(new Date(post.createdAt), 'dd MMM yyyy') : 'Sem data';
                                } catch (e) {
                                  return 'Data Inválida';
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  {posts.length === 0 && <p className="p-12 text-center text-slate-500 italic text-sm bento-card">Nenhum registro de conhecimento localizado.</p>}
                </div>
              ) : (
                <div className="bento-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-black/60 text-stone-500 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4">Nome da Categoria</th>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {categories.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                          <tr key={c.id} className="hover:bg-amber-500/5 transition-colors">
                            <td className="px-6 py-4 font-semibold text-stone-200">{c.name}</td>
                            <td className="px-6 py-4 text-xs text-stone-500 font-mono">{c.id}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => setConfirmDelete({ type: 'category', id: c.id })} className="p-2 hover:bg-red-500/10 text-stone-500 hover:text-red-500 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {categories.length === 0 && <p className="p-12 text-center text-slate-500 italic text-sm">Nenhuma categoria cadastrada.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${
        active ? 'bg-amber-600 text-black shadow-lg shadow-amber-500/30' : 'text-stone-500 hover:text-stone-200 hover:bg-stone-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, type = "text", required = true }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{label}</label>
      <input 
        type={type}
        className="w-full bg-black/40 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 outline-none focus:border-amber-500/30 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
