import React from 'react';
import { Property, ListingType, PropertyType } from '../types';
import { MapPin, ArrowLeft, Bed, Bath, Car, Maximize, Home, Building, LandPlot, Trees } from 'lucide-react';
import { COMMUNES } from '../constants';

interface ListingViewProps {
  category: 'sale' | 'rent' | 'all';
  properties: Property[];
  selectedCommunes: string[];
  selectedType: PropertyType | null;
  onToggleCommune: (commune: string | null) => void;
  onToggleType: (type: PropertyType | null) => void;
  onClearFilters: () => void;
  onPropertyClick: (id: string) => void;
  onGoHome: () => void;
}

const ListingView: React.FC<ListingViewProps> = ({ 
  category, 
  properties, 
  selectedCommunes,
  selectedType,
  onToggleCommune,
  onToggleType,
  onClearFilters,
  onPropertyClick, 
  onGoHome 
}) => {
  const normalizeString = (str: string | undefined | null) => 
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProperties = properties.filter(p => {
    // Robust category matching
    const isRent = p.listingType === ListingType.RENT || String(p.listingType || '').toLowerCase() === 'arriendo' || String(p.listingType || '').toLowerCase() === 'rent';
    const isSale = !isRent || p.listingType === ListingType.SALE || String(p.listingType || '').toLowerCase() === 'venta' || String(p.listingType || '').toLowerCase() === 'sale';

    const matchesCategory = category === 'sale' ? isSale : 
                           category === 'rent' ? isRent : true;
    
    if (!matchesCategory) return false;

    const normalizedLocation = normalizeString(p.location);
    
    // If communes are selected, filter by them. Otherwise, show all properties of the category.
    if (selectedCommunes && selectedCommunes.length > 0) {
      const matchesCommune = selectedCommunes.some(commune => 
        normalizedLocation.includes(normalizeString(commune))
      );
      if (!matchesCommune) return false;
    }

    if (selectedType) {
      if (p.type !== selectedType) return false;
    }
    
    return true;
  });

  const heroConfig = {
    sale: {
      title: 'Propiedades en Venta',
      subtitle: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop'
    },
    rent: {
      title: 'Propiedades en Arriendo',
      subtitle: '',
      image: 'https://images.unsplash.com/photo-1600607687940-4e524cb35797?q=80&w=1920&auto=format&fit=crop'
    },
    all: {
      title: 'Propiedades en Venta',
      subtitle: '',
      image: 'https://images.unsplash.com/photo-1600596542815-2a434f678417?q=80&w=1920&auto=format&fit=crop'
    }
  };

  const currentHero = heroConfig[category] || heroConfig.all;

  const isLand = (type: PropertyType) => type === PropertyType.LAND || type === PropertyType.PARCEL;

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section for Listing - Clean White */}
      <div className="relative pt-12 md:pt-14 pb-2 flex flex-col items-start border-b border-gray-50 max-w-7xl mx-auto px-6 w-full">
        <div className="relative z-10 text-left mb-3">
          <button 
            onClick={onGoHome} 
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-leroy-orange transition-colors mb-1 group"
          >
            <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1" />
            Volver al inicio
          </button>
          <h1 className="text-xl md:text-2xl font-serif font-medium text-leroy-black mb-0.5 animate-slideInRight leading-tight">
            {currentHero.title}
          </h1>
          {currentHero.subtitle && (
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-leroy-orange animate-fadeIn">
              {currentHero.subtitle}
            </p>
          )}
        </div>

        {/* Commune Filter */}
        <div className="flex flex-wrap justify-start gap-x-6 gap-y-2 py-2 w-full relative border-b border-gray-50">
          <button 
            onClick={() => onToggleCommune(null)}
            className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedCommunes.length === 0 ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            Todas las comunas
          </button>
          {COMMUNES.map(commune => (
            <button 
              key={commune}
              onClick={() => onToggleCommune(commune)}
              className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedCommunes.includes(commune) ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
            >
              {commune}
            </button>
          ))}
        </div>

        {/* Property Type Filter */}
        <div className="flex flex-wrap justify-start gap-x-6 gap-y-2 py-2 w-full relative">
          <button 
            onClick={() => onToggleType(null)}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedType === null ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            Todos los tipos
          </button>
          <button 
            onClick={() => onToggleType(PropertyType.HOUSE)}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedType === PropertyType.HOUSE ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            <Home size={12} />
            Casas
          </button>
          <button 
            onClick={() => onToggleType(PropertyType.APARTMENT)}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedType === PropertyType.APARTMENT ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            <Building size={12} />
            Departamentos
          </button>
          <button 
            onClick={() => onToggleType(PropertyType.LAND)}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedType === PropertyType.LAND ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            <LandPlot size={12} />
            Terrenos
          </button>
          <button 
            onClick={() => onToggleType(PropertyType.PARCEL)}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedType === PropertyType.PARCEL ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            <Trees size={12} />
            Parcelas
          </button>
          
          {(selectedCommunes.length > 0 || selectedType !== null) && (
            <button 
              onClick={onClearFilters}
              className="ml-auto text-[8px] font-bold uppercase tracking-widest text-leroy-orange hover:text-leroy-black transition-colors"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid Section */}
      <div className="py-4 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {filteredProperties.map((p) => {
              const landMode = isLand(p.type);
              const accentColor = landMode ? 'leroy-green' : 'leroy-orange';
              const borderColor = landMode ? 'border-leroy-green' : 'border-leroy-orange';
              const textColor = landMode ? 'text-leroy-green' : 'text-leroy-orange';

              return (
                <div 
                  key={p.id} 
                  className="group cursor-pointer fade-in"
                  onClick={() => onPropertyClick(p.id)}
                >
                  <div className={`aspect-[16/10] flex flex-col overflow-hidden mb-2.5 relative bg-white border-2 md:border-3 ${borderColor} shadow-sm rounded-sm`}>
                    <div className="flex-grow overflow-hidden relative">
                      <img 
                        src={p.imageUrl} 
                        alt={p.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-leroy-black shadow-sm rounded-sm">
                        {p.currency} {p.price.toLocaleString()}
                      </div>
                      {p.isPremium && (
                        <div className={`absolute top-3 right-3 ${landMode ? 'bg-leroy-green' : 'bg-leroy-orange'} text-white px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest shadow-sm rounded-sm`}>
                          Premium
                        </div>
                      )}
                    </div>
                    
                    {/* Property Stats Bar inside the frame */}
                    <div className={`bg-white px-3 py-2 border-t ${landMode ? 'border-leroy-green/10' : 'border-leroy-orange/10'} flex justify-between items-center`}>
                      <div className="flex gap-3 text-gray-600">
                        {!landMode && (
                          <>
                            <div className="flex items-center gap-1" title="Dormitorios">
                              <Bed size={14} className={textColor} />
                              <span className="text-[10px] font-bold">{p.bedrooms}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Baños">
                              <Bath size={14} className={textColor} />
                              <span className="text-[10px] font-bold">{p.bathrooms}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Estacionamientos">
                              <Car size={14} className={textColor} />
                              <span className="text-[10px] font-bold">{p.parking}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1" title="Superficie">
                          <Maximize size={14} className={textColor} />
                          <span className="text-[10px] font-bold">{landMode ? (p.landArea || p.area) : p.area}m²</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-serif font-medium ${textColor}`}>LeRoy Residence</span>
                    </div>
                  </div>
                  <h3 className={`text-base md:text-lg font-serif font-medium mb-0.5 leading-snug truncate group-hover:${textColor} transition-colors duration-300`}>{p.title}</h3>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1 truncate">{p.subtitle}</p>
                  <div className="flex items-center gap-1.5 text-gray-400 border-t border-gray-100 pt-2">
                    <MapPin size={12} className={textColor} />
                    <span className="text-[9px] font-bold uppercase tracking-wider truncate">{p.location}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-gray-300 mb-6">No se encontraron propiedades en esta categoría.</p>
            <button 
              onClick={() => {
                localStorage.removeItem('leroy_properties_v1');
                window.location.reload();
              }}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-leroy-orange hover:text-leroy-black transition-colors border border-leroy-orange/20 px-6 py-3 rounded-full"
            >
              Restablecer base de datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingView;
