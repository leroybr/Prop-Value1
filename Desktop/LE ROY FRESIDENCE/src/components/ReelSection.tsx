import React from 'react';
import { Instagram, Play, ExternalLink } from 'lucide-react';

const REELS = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
    title: 'Propiedad de Lujo',
    views: '28.5k',
    link: 'https://www.instagram.com/reel/DXQAnNxjAHa/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=='
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1600607687940-4e524cb35d27?q=80&w=600&auto=format&fit=crop',
    title: 'Nueva Propiedad Lo Barnechea',
    views: '8.2k',
    link: 'https://www.instagram.com/leroyresidence/'
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=600&auto=format&fit=crop',
    title: 'Estilo Contemporáneo',
    views: '15.1k',
    link: 'https://www.instagram.com/leroyresidence/'
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop',
    title: 'Diseño de Interior',
    views: '9.7k',
    link: 'https://www.instagram.com/leroyresidence/'
  }
];

const ReelSection: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 text-leroy-orange mb-2">
              <Instagram size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Social Experience</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-leroy-black">Nuestros Reels</h2>
          </div>
          <a 
            href="https://www.instagram.com/leroyresidence/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-orange transition-colors"
          >
            Seguir en Instagram
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {REELS.map((reel) => (
            <a 
              key={reel.id}
              href={reel.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[9/16] overflow-hidden bg-gray-100 shadow-2xl"
            >
              <img 
                src={reel.thumbnail} 
                alt={reel.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-500 border border-white/30">
                  <Play size={20} fill="white" className="text-white ml-1" />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{reel.views} vistas</p>
                <h3 className="text-white font-serif text-lg leading-tight">{reel.title}</h3>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 md:hidden">
          <a 
            href="https://www.instagram.com/leroyresidence/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-leroy-black"
          >
            <Instagram size={16} />
            Ver todos en Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default ReelSection;
