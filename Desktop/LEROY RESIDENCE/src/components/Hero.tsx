import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Play, MapPin } from 'lucide-react';
import { HeroSearchState } from '../types';

interface HeroProps {
  onSearch: (state: HeroSearchState) => void;
  onQuickLinkClick: (label: string) => void;
  isSearching: boolean;
}

const Hero: React.FC<HeroProps> = ({ onSearch, onQuickLinkClick, isSearching }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920&auto=format&fit=crop',
      title: 'Bienvenido LeRoy Residence',
      subtitle: 'Propiedades en Venta'
    },
    {
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1920&auto=format&fit=crop',
      title: '¿Quieres comprar una propiedad?',
      subtitle: 'Propiedades en Venta'
    },
    {
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1920&auto=format&fit=crop',
      title: 'Bienvenidos',
      subtitle: 'Propiedades en Venta'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Faster transitions (4s)
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ location: searchQuery, category: 'all' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-leroy-black">
      {/* Background Slideshow */}
      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="w-full h-full object-cover scale-105 animate-slowZoom"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center text-white">
        <div className="mb-6 overflow-hidden">
          <span className="inline-block text-[8px] font-bold uppercase tracking-[0.4em] animate-slideUp text-white/90 drop-shadow-sm">
            The Pinnacle of Luxury Real Estate
          </span>
        </div>
        
        <div className="overflow-hidden mb-8">
          <h1 
            key={`title-${activeSlide}`}
            className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-[1.1] tracking-tight animate-slideInRight"
          >
            {slides[activeSlide].title}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-4xl animate-slideUp delay-300">
          <form onSubmit={handleSubmit} className="relative group mb-6">
            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
              <Search size={20} className="text-white/60 group-focus-within:text-leroy-orange transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Busca por ubicación, estilo o característica (ej: 'Casa moderna en Concepción')..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full py-4 pl-16 pr-32 text-base outline-none focus:bg-white/20 focus:border-white/40 transition-all placeholder:text-white/50"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-2 bottom-2 bg-leroy-orange hover:bg-white hover:text-leroy-black px-8 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
              {!isSearching && <ArrowRight size={14} />}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-end items-end text-white z-10 hidden md:flex">
        <div className="flex items-center gap-4">
          <MapPin size={16} className="text-leroy-orange" />
          <div className="text-right">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-white/50">Ubicación Actual</span>
            <span className="text-sm font-medium">{slides[activeSlide].subtitle}</span>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
        {slides.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`w-1 h-12 rounded-full transition-all ${i === activeSlide ? 'bg-leroy-orange w-1.5' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
