import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { generateImage, editImage } from '../services/gemini';
import { Image as ImageIcon, Upload, Wand2, Download, RefreshCw, Layers, History, Edit2, Trash2 } from 'lucide-react';

interface ImageStudioProps {
  editItem?: any;
}

export default function ImageStudio({ editItem }: ImageStudioProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (editItem && (editItem.type === 'image' || editItem.type === 'logo')) {
      setMode('edit');
      setSelectedImage(editItem.content);
      setPrompt(editItem.prompt || '');
      setResult(editItem.content);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editItem]);

  const getEffectiveParams = () => {
    const ratio = width / height;
    const supportedRatios = [
      { name: "1:1", val: 1.0 },
      { name: "4:3", val: 4/3 },
      { name: "3:4", val: 3/4 },
      { name: "16:9", val: 16/9 },
      { name: "9:16", val: 9/16 }
    ];

    const bestRatio = supportedRatios.reduce((prev, curr) => 
      Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
    );

    return { 
      aspectRatio: bestRatio.name as any
    };
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'content'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(allItems.filter((item: any) => item.type === 'image'));
    });
    return () => unsubscribe();
  }, [user]);

  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleGenerate = async () => {
    if (!prompt || !user) return;
    setLoading(true);
    const { aspectRatio } = getEffectiveParams();
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      
      // Compress before saving to ensure history works even with large images
      const compressed = await compressImage(imageUrl);
      setResult(imageUrl); // Show full res in preview if possible
      
      await addDoc(collection(db, 'content'), {
        userId: user.uid,
        type: 'image',
        title: prompt.slice(0, 30),
        content: compressed,
        prompt,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt || !selectedImage || !user) return;
    setLoading(true);
    const { aspectRatio } = getEffectiveParams();
    try {
      const imageUrl = await editImage(selectedImage, prompt, aspectRatio);
      const compressed = await compressImage(imageUrl);
      setResult(imageUrl);
      
      await addDoc(collection(db, 'content'), {
        userId: user.uid,
        type: 'image',
        title: `Edit: ${prompt.slice(0, 20)}`,
        content: compressed,
        prompt,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMode('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleUseAsProduct = async () => {
    if (!result || !user) return;
    try {
      // Compress image to ensure it stays under 1MB Firestore limit
      const compressedImageUrl = await compressImage(result);
      
      await addDoc(collection(db, 'products'), {
        userId: user.uid,
        name: prompt.slice(0, 30) || 'Yeni Ürün',
        price: 0,
        description: prompt,
        imageUrl: compressedImageUrl,
        createdAt: serverTimestamp(),
      });
      alert('Görsel başarıyla e-ticaret kataloğuna eklendi!');
    } catch (error: any) {
      if (error?.message?.includes('size')) {
        alert('Görsel boyutu çok büyük olduğu için kaydedilemedi. Lütfen daha kısa bir tarif deneyin.');
      }
      console.error(error);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => {
                setMode('generate');
                setSelectedImage(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'generate' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-gray-50 text-gray-500'}`}
            >
              Yeni Oluştur
            </button>
            <button 
              onClick={() => setMode('edit')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'edit' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-gray-50 text-gray-500'}`}
            >
              Görseli Düzenle
            </button>
          </div>

          {products.length > 0 && (
            <div className="mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ürünlerimden Referans Al</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (mode === 'edit') {
                        setSelectedImage(product.imageUrl);
                      } else {
                        setPrompt(prev => `${prev}\n\nÜrün Referansı: ${product.name} - ${product.description}`.trim());
                      }
                      setSelectedProduct(product);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 transition-all p-1 overflow-hidden ${selectedProduct?.id === product.id ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                  >
                    <img src={product.imageUrl} className="w-full h-full object-cover rounded-lg" alt={product.name} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <div className="mb-6">
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`block w-full aspect-video border-2 border-dashed rounded-2xl cursor-pointer transition-all relative overflow-hidden ${
                  isDragging ? 'border-brand-accent bg-brand-accent/5 scale-[1.02]' : 'border-gray-200 hover:border-brand-accent'
                }`}
              >
                {selectedImage ? (
                  <img src={selectedImage} className="w-full h-full object-cover" alt="Selected" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Upload className={`w-8 h-8 mb-2 transition-transform ${isDragging ? 'scale-110' : ''}`} />
                    <span className="text-sm font-medium px-4 text-center">
                      {isDragging ? 'Görseli Buraya Bırakın' : 'Düzenlemek için görsel yükleyin veya sürükleyip bırakın'}
                    </span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
              </label>
            </div>
          )}

          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' ? "Oluşturmak istediğiniz görseli tarif edin..." : "Yapmak istediğiniz değişiklikleri tarif edin (örn: 'arkaplanı gün batımı yap', 'bir kedi ekle')..."}
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 resize-none"
            />
            
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Genişlik (px)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min="256"
                    max="4096"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">PX</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Yükseklik (px)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min="256"
                    max="4096"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">PX</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eşleşen Oran</span>
                  <span className="bg-brand-accent/10 text-brand-accent text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {getEffectiveParams().aspectRatio}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={mode === 'generate' ? handleGenerate : handleEdit}
              disabled={loading || !prompt || (mode === 'edit' && !selectedImage)}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {mode === 'generate' ? 'Görsel Oluştur' : 'Yapay Zeka ile Düzenle'}
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={result} className="w-full h-auto" alt="AI Result" />
              </div>
              <div className="flex gap-4">
                <a 
                  href={result} 
                  download="wutgo-ai-image.png"
                  className="flex-1 bg-gray-50 text-brand-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                >
                  <Download className="w-4 h-4" />
                  İndir
                </a>
                <button 
                  onClick={handleUseAsProduct}
                  className="flex-1 bg-gray-50 text-brand-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  Ürün Olarak Kullan
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Üretiminiz burada görünecek</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand-accent" />
          <h2 className="text-xl font-bold text-gray-900">Üretim Geçmişim</h2>
        </div>
        
        {history.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <img 
                  src={item.content} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                  <button
                    onClick={() => {
                      setSelectedImage(item.content);
                      setMode('edit');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full bg-white text-brand-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100"
                  >
                    <Edit2 className="w-3 h-3" />
                    Düzenle
                  </button>
                  <a
                    href={item.content}
                    download={`wutgo-${item.id}.png`}
                    className="w-full bg-brand-accent text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-opacity-90"
                  >
                    <Download className="w-3 h-3" />
                    İndir
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`w-full backdrop-blur-md py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      deletingId === item.id 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-500/20 text-white hover:bg-red-500'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {deletingId === item.id ? 'Onayla' : 'Sil'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400">
            <p className="text-sm">Henüz bir görsel üretmediniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
