import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateImage, editImage } from '../services/gemini';
import { Image as ImageIcon, Upload, Wand2, Download, RefreshCw, Layers } from 'lucide-react';

export default function ImageStudio() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const imageUrl = await generateImage(prompt);
      setResult(imageUrl);
      await addDoc(collection(db, 'content'), {
        userId: user?.uid,
        type: 'image',
        title: prompt.slice(0, 30),
        content: imageUrl,
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
    if (!prompt || !selectedImage) return;
    setLoading(true);
    try {
      const imageUrl = await editImage(selectedImage, prompt);
      setResult(imageUrl);
      await addDoc(collection(db, 'content'), {
        userId: user?.uid,
        type: 'image',
        title: `Edit: ${prompt.slice(0, 20)}`,
        content: imageUrl,
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMode('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setMode('generate')}
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

        {mode === 'edit' && (
          <div className="mb-6">
            <label className="block w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden">
              {selectedImage ? (
                <img src={selectedImage} className="w-full h-full object-cover" alt="Selected" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Düzenlemek için görsel yükleyin</span>
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
          <button
            onClick={mode === 'generate' ? handleGenerate : handleEdit}
            disabled={loading || !prompt}
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
              <button className="flex-1 bg-gray-50 text-brand-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all">
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
  );
}
