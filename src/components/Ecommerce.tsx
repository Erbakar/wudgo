import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ShoppingBag, Plus, Trash2, Package } from 'lucide-react';

export default function Ecommerce() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '' });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'products'), {
        userId: user.uid,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${Math.random()}/400/400`,
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', description: '', imageUrl: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-accent" />
          Ürün Kataloğu
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ürün Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <motion.div 
            layout
            key={product.id}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-50">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {user?.uid === product.userId && (
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 truncate flex-1">{product.name}</h3>
                <span className="text-brand-accent font-bold">{product.price} TL</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{product.description}</p>
              <button className="w-full bg-gray-50 text-brand-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all">
                <ShoppingBag className="w-4 h-4" />
                Hemen Al
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ürün Adı</label>
                <input 
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  placeholder="Örn: Minimalist Logo Tasarımı"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fiyat (TL)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Açıklama</label>
                <textarea 
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 h-24 resize-none"
                  placeholder="Ürününüzü tarif edin..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Görsel URL (Opsiyonel)</label>
                <input 
                  value={newProduct.imageUrl}
                  onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all"
                >
                  Ürünü Listele
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
