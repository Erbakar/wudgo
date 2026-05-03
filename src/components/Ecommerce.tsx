import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ShoppingBag, Plus, Trash2, Package, LayoutGrid, List, Edit2, X, Image as ImageIcon, Check } from 'lucide-react';

export default function Ecommerce() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '', images: [] as string[] });

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
        images: newProduct.images.length > 0 ? newProduct.images : [newProduct.imageUrl].filter(Boolean),
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', description: '', imageUrl: '', images: [] });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price.toString()),
        description: editingProduct.description,
        imageUrl: editingProduct.imageUrl,
        images: editingProduct.images || [],
        updatedAt: serverTimestamp(),
      });
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error(error);
    }
  };

  const addImageToEditing = (url: string) => {
    if (!editingProduct) return;
    const currentImages = editingProduct.images || [];
    setEditingProduct({ ...editingProduct, images: [...currentImages, url] });
  };

  const removeImageFromEditing = (index: number) => {
    if (!editingProduct) return;
    const currentImages = [...(editingProduct.images || [])];
    currentImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: currentImages });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-accent" />
            Ürün Kataloğu
          </h2>
          <p className="text-sm text-gray-500">Katalogdaki tüm ürünlerini yönet ve düzenle</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-gray-100 text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-black/5"
          >
            <Plus className="w-4 h-4" />
            Ürün Ekle
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div 
              layout
              key={product.id}
              onClick={() => setEditingProduct(product)}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group cursor-pointer"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
                    <Edit2 className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-gray-900">Düzenle</span>
                  </div>
                </div>
                {user?.uid === product.userId && (
                  <button 
                    onClick={(e) => handleDelete(e, product.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 truncate flex-1">{product.name}</h3>
                  <span className="text-brand-accent font-bold ml-2 whitespace-nowrap">{product.price} TL</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{product.description}</p>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {product.images?.length || 1} GÖRSEL
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ürün</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fiyat</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Açıklama</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Görsel</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr 
                  key={product.id} 
                  onClick={() => setEditingProduct(product)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-accent">
                    {product.price} TL
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                       <img src={product.imageUrl} className="w-8 h-8 rounded-lg border-2 border-white object-cover" />
                       {product.images?.slice(0, 2).map((img: string, i: number) => (
                         <img key={i} src={img} className="w-8 h-8 rounded-lg border-2 border-white object-cover" />
                       ))}
                       {product.images?.length > 2 && (
                         <div className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                           +{product.images.length - 2}
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-brand-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, product.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ürün Adı</label>
                  <input 
                    required
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                    placeholder="Örn: Minimalist Logo Tasarımı"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fiyat (TL)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Başlangıç Görseli (URL)</label>
                    <input 
                      value={newProduct.imageUrl}
                      onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Açıklama</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 h-28 resize-none font-medium leading-relaxed"
                    placeholder="Ürününüzü detaylıca tarif edin..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-brand-primary text-white rounded-2xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg"
                  >
                    Ürünü Yayınla
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-3xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="flex flex-col md:flex-row gap-10">
                  {/* Image Manager */}
                  <div className="w-full md:w-80 space-y-6">
                    <div className="aspect-square rounded-[32px] overflow-hidden border border-gray-100 bg-gray-50 group relative">
                      <img 
                        src={editingProduct.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt="Kapak" 
                      />
                      <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Kapak Görseli
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ek Görseller</label>
                        <span className="text-[10px] font-bold text-brand-accent">{editingProduct.images?.length || 0}/5</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {(editingProduct.images || []).map((img: string, i: number) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100 relative group">
                            <img src={img} className="w-full h-full object-cover" alt="Ürün" />
                            <button 
                              onClick={() => removeImageFromEditing(i)}
                              className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(editingProduct.images || []).length < 5 && (
                          <button 
                            onClick={() => {
                              const url = prompt('Eklemek istediğiniz görselin linkini girin:');
                              if (url) addImageToEditing(url);
                            }}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 hover:border-brand-accent hover:text-brand-accent transition-all"
                          >
                            <Plus className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-bold">Resim Ekle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleUpdateProduct} className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">Ürün Detayları</h3>
                      <p className="text-sm text-gray-500">Mağazada görünecek içeriği özelleştir</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ürün Adı</label>
                        <input 
                          required
                          value={editingProduct.name}
                          onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fiyat (TL)</label>
                          <div className="relative">
                            <input 
                              required
                              type="number"
                              step="0.01"
                              value={editingProduct.price}
                              onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                              className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">TL</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kapak URL</label>
                          <input 
                            value={editingProduct.imageUrl}
                            onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ürün Açıklaması</label>
                        <textarea 
                          value={editingProduct.description}
                          onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm min-h-[160px] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                          placeholder="Ürününüzün özellikleri, kullanım alanları..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Değişiklikleri Kaydet
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          handleDelete(e as any, editingProduct.id);
                          setEditingProduct(null);
                        }}
                        className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
