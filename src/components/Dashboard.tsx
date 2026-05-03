import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Sparkles, Image as ImageIcon, FileText, ShoppingBag, LogOut, Plus, Search, Trash2, Edit3, Grid, ExternalLink, Download } from 'lucide-react';
import ImageStudio from './ImageStudio';
import ContentStudio from './ContentStudio';
import Ecommerce from './Ecommerce';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'content' | 'shop' | 'archive'>('images');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'content'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'content', id));
      setDeletingId(null);
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    if (item.type === 'image') {
      setActiveTab('images');
    } else {
      setActiveTab('content');
    }
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Wutgo</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'images', icon: ImageIcon, label: 'Görsel Stüdyosu' },
            { id: 'content', icon: FileText, label: 'İçerik Stüdyosu' },
            { id: 'archive', icon: Grid, label: 'Tüm Üretimlerim' },
            { id: 'shop', icon: ShoppingBag, label: 'E-Ticaret' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-lg shadow-black/10' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={user?.photoURL || ''} className="w-8 h-8 rounded-full" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === 'images' && 'Görsel Stüdyosu'}
              {activeTab === 'content' && 'İçerik Stüdyosu'}
              {activeTab === 'archive' && 'Tüm Üretimlerim'}
              {activeTab === 'shop' && 'E-Ticaret'}
            </h1>
            <p className="text-gray-500">Tekrar hoş geldin, {user?.displayName?.split(' ')[0]}</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Üretimlerinde ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all w-64"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'images' && <ImageStudio editItem={editingItem} />}
          {activeTab === 'content' && <ContentStudio editItem={editingItem} />}
          {activeTab === 'archive' && (
            <div className="space-y-6">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-black/5 transition-all"
                    >
                      {item.type === 'image' || item.type === 'logo' ? (
                        <div className="aspect-square relative overflow-hidden bg-gray-50">
                          <img 
                            src={item.content} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-lg"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <a 
                              href={item.content}
                              download={`wutgo-${item.id}`} 
                              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-lg"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 aspect-square flex flex-col bg-brand-accent/5">
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-brand-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{item.type}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-6 leading-relaxed mb-4 flex-1">
                            {item.content}
                          </p>
                          <div className="flex justify-end pt-4 border-t border-brand-accent/10">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="text-brand-accent hover:text-brand-primary p-2 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{item.title || 'Başlıksız'}</h3>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {item.createdAt?.toDate().toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                            deletingId === item.id 
                              ? 'bg-red-500 text-white px-3' 
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === item.id && <span className="text-[10px] font-bold">Onayla</span>}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-20 rounded-[40px] border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Grid className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz üretiminiz yok</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    Görsel veya içerik stüdyosunu kullanarak ilk üretimini yapabilirsin.
                  </p>
                  <button 
                    onClick={() => setActiveTab('images')}
                    className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Hemen Başla
                  </button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'shop' && <Ecommerce />}
        </div>
      </main>
    </div>
  );
}
