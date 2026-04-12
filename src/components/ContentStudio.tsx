import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateText } from '../services/gemini';
import { FileText, RefreshCw, PenTool, BookOpen, Tag, Copy, Check } from 'lucide-react';

export default function ContentStudio() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [type, setType] = useState<'product' | 'blog' | 'logo'>('product');
  const [copied, setCopied] = useState(false);

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

  return (
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

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
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
  );
}
