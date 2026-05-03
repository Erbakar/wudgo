import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { generateText } from '../services/gemini';
import { FileText, RefreshCw, PenTool, BookOpen, Tag, Copy, Check, History, Edit2, Trash2 } from 'lucide-react';

interface ContentStudioProps {
  editItem?: any;
}

export default function ContentStudio({ editItem }: ContentStudioProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [type, setType] = useState<'product' | 'blog' | 'logo'>('product');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (editItem && (editItem.type === 'product' || editItem.type === 'blog' || editItem.type === 'logo')) {
      setType(editItem.type);
      setPrompt(editItem.prompt || '');
      setResult(editItem.content || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editItem]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'content'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(allItems.filter((item: any) => ['product', 'blog', 'logo'].includes(item.type)));
    });
    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const systemInstructions = {
        product: "Siz uzman bir e-ticaret metin yazarısınız. Sağlanan anahtar kelimelere ve ayrıntılara dayanarak ilgi çekici, SEO dostu bir ürün açıklaması oluşturun. Akılda kalıcı bir başlık, temel özellikler ve ikna edici bir eylem çağrısı ekleyin.",
        blog: "Siz profesyonel bir blog yazarısınız. Sağlanan konuya dayalı olarak ilgi çekici, bilgilendirici ve iyi yapılandırılmış bir blog yazısı oluşturun. Alt başlıklar, madde işaretleri ve konuşma dili kullanın.",
        logo: "Siz bir marka kimliği tasarımcısısınız. Sağlanan şirket adı ve havaya dayanarak bir logo için ayrıntılı bir görsel açıklama ve konsept sağlayın. Renkleri, sembolleri ve tipografiyi tanımlayın."
      };

      const text = await generateText(prompt, systemInstructions[type]);
      setResult(text || '');
      
      await addDoc(collection(db, 'content'), {
        userId: user?.uid,
        type,
        title: prompt.slice(0, 30),
        content: text,
        prompt,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000); // 3 saniye sonra onayı iptal et
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'product', icon: Tag, label: 'Ürün Açıklaması' },
              { id: 'blog', icon: BookOpen, label: 'Blog Yazısı' },
              { id: 'logo', icon: PenTool, label: 'Logo Konsepti' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  type === t.id ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>

          {products.length > 0 && (
            <div className="mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ürünlerimden Referans Al</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setPrompt(`Ürün: ${product.name}\nAçıklama: ${product.description}`);
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

          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                type === 'product' ? "Ürün adını ve temel özelliklerini girin..." :
                type === 'blog' ? "Blog konusunu veya anahtar kelimeleri girin..." :
                "Şirket adını ve istediğiniz havayı girin..."
              }
              className="w-full h-48 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
              İçerik Oluştur
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Üretilen İçerik</h3>
            {result && (
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px] prose prose-sm max-w-none">
            {result ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {result}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-8 h-8 mb-4 opacity-20" />
                <p className="text-sm">Yapay zeka içeriğiniz burada görünecek</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand-accent" />
          <h2 className="text-xl font-bold text-gray-900">İçerik Geçmişim</h2>
        </div>
        
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-md transition-all relative"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/5 px-2 py-0.5 rounded-full">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {item.createdAt?.toDate().toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 truncate">{item.title || 'Başlıksız'}</h3>
                <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                  {item.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setType(item.type);
                      setPrompt(item.prompt || '');
                      setResult(item.content || '');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 bg-gray-50 text-brand-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.content);
                    }}
                    className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                      deletingId === item.id 
                        ? 'bg-red-500 text-white px-4' 
                        : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {deletingId === item.id && <span className="text-[10px] font-bold">Onayla</span>}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400">
            <p className="text-sm">Henüz bir içerik üretmediniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
