import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Image as ImageIcon, FileText, ShoppingBag, LogOut, Plus, Search, Trash2, Edit3 } from 'lucide-react';
import ImageStudio from './ImageStudio';
import ContentStudio from './ContentStudio';
import Ecommerce from './Ecommerce';

export default function Dashboard() {
  const { user, signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'content' | 'shop'>('images');
  const [items, setItems] = useState<any[]>([]);

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full">
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
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'images' && <ImageStudio />}
          {activeTab === 'content' && <ContentStudio />}
          {activeTab === 'shop' && <Ecommerce />}
        </div>
      </main>
    </div>
  );
}
