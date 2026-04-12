import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, Sparkles, Image as ImageIcon, FileText, ShoppingBag, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { signIn, user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-bottom border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Wutgo</span>
            </div>
            <div>
              {user ? (
                <button className="bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all">
                  Panel
                </button>
              ) : (
                <button 
                  onClick={signIn}
                  className="flex items-center gap-2 text-brand-primary font-medium hover:text-brand-accent transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-serif italic mb-6 tracking-tight">
              Sınır Tanımadan <br />
              <span className="text-brand-accent not-italic font-sans font-bold">Üretin.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Yapay zeka destekli en kapsamlı içerik stüdyosu. Saniyeler içinde etkileyici görseller, 
              ikna edici metinler ve profesyonel logolar oluşturun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={signIn}
                className="bg-brand-primary text-white px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all group"
              >
                Ücretsiz Başlayın
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-gray-200 text-brand-primary px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-all"
              >
                Örneklere Göz Atın
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ImageIcon, title: "AI Görsel Stüdyosu", desc: "Doğal dille görseller oluşturun ve düzenleyin." },
              { icon: FileText, title: "İçerik Yazarı", desc: "Satan blog yazıları ve ürün açıklamaları." },
              { icon: Sparkles, title: "Logo Tasarımcısı", desc: "Yeni fikriniz için profesyonel markalaşma." },
              { icon: ShoppingBag, title: "E-Ticaret", desc: "Tasarımlarınızı anında listeleyin ve satın." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="text-brand-accent w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase */}
      <section id="showcase" className="py-20 overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <h2 className="text-4xl font-bold">Wutgo ile Üretildi</h2>
          <p className="text-gray-500 mt-2">Mobilya, ev aletleri, dekorasyon ve logo tasarımlarından örnekler.</p>
        </div>
        <div className="flex gap-6 animate-marquee whitespace-nowrap">
          {[
            { id: '20', label: 'Ofis Mobilyası' },
            { id: '21', label: 'Ayakkabı Tasarımı' },
            { id: '26', label: 'Teknolojik Cihaz' },
            { id: '30', label: 'Modern Mutfak' },
            { id: '42', label: 'Kahve Makinesi' },
            { id: '48', label: 'Bilgisayar' },
            { id: '54', label: 'Kamera' },
            { id: '60', label: 'Masaüstü' },
            { id: '75', label: 'Dizüstü Bilgisayar' },
            { id: '160', label: 'Akıllı Telefon' },
            { id: '175', label: 'Saat Tasarımı' },
            { id: '250', label: 'Fotoğraf Makinesi' },
            // Duplicate for seamless loop
            { id: '20', label: 'Ofis Mobilyası' },
            { id: '21', label: 'Ayakkabı Tasarımı' },
            { id: '26', label: 'Teknolojik Cihaz' },
            { id: '30', label: 'Modern Mutfak' },
            { id: '42', label: 'Kahve Makinesi' },
            { id: '48', label: 'Bilgisayar' },
            { id: '54', label: 'Kamera' },
            { id: '60', label: 'Masaüstü' },
            { id: '75', label: 'Dizüstü Bilgisayar' },
            { id: '160', label: 'Akıllı Telefon' },
            { id: '175', label: 'Saat Tasarımı' },
            { id: '250', label: 'Fotoğraf Makinesi' }
          ].map((item, n) => (
            <div key={n} className="inline-block w-80 h-96 rounded-3xl overflow-hidden flex-shrink-0 relative group">
              <img 
                src={`https://picsum.photos/id/${item.id}/800/1000`} 
                alt={item.label} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <span className="text-white font-bold">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="text-brand-accent w-6 h-6" />
            <span className="text-xl font-bold">Wutgo</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 wutgo.com. Gemini AI ile güçlendirilmiştir.</p>
        </div>
      </footer>
    </div>
  );
}
