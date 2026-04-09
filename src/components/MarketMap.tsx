import React from 'react';
import { MapPin, Building2, Home } from 'lucide-react';

interface Property {
  id: string;
  commune: string;
  price_uf: number;
  m2: number;
  type: string;
  x: number;
  y: number;
}

const mockProperties: Record<string, Property[]> = {
  'Metropolitana': [
    { id: '1', commune: 'Providencia', price_uf: 5200, m2: 65, type: 'Depto', x: 45, y: 40 },
    { id: '2', commune: 'Las Condes', price_uf: 8400, m2: 85, type: 'Depto', x: 65, y: 30 },
    { id: '3', commune: 'Santiago', price_uf: 3100, m2: 45, type: 'Depto', x: 35, y: 50 },
    { id: '4', commune: 'Ñuñoa', price_uf: 4800, m2: 70, type: 'Depto', x: 55, y: 55 },
    { id: '5', commune: 'Vitacura', price_uf: 12500, m2: 120, type: 'Casa', x: 75, y: 20 },
  ],
  'Biobío': [
    { id: '6', commune: 'Concepción (Centro)', price_uf: 4200, m2: 60, type: 'Depto', x: 50, y: 45 },
    { id: '7', commune: 'San Pedro (Huertos)', price_uf: 6500, m2: 110, type: 'Casa', x: 40, y: 60 },
    { id: '8', commune: 'Talcahuano', price_uf: 3500, m2: 55, type: 'Depto', x: 30, y: 35 },
    { id: '9', commune: 'Chiguayante', price_uf: 4900, m2: 80, type: 'Casa', x: 70, y: 70 },
    { id: '10', commune: 'Concepción (Lomas)', price_uf: 5800, m2: 75, type: 'Depto', x: 55, y: 35 },
    { id: '11', commune: 'San Pedro (Andalué)', price_uf: 8200, m2: 140, type: 'Casa', x: 35, y: 65 },
  ]
};

export const MarketMap: React.FC = () => {
  const [region, setRegion] = React.useState<'Metropolitana' | 'Biobío'>('Metropolitana');
  const properties = mockProperties[region];

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
            <MapPin className="text-blue-600 w-5 h-5" />
            Mapa de Oportunidades
          </h2>
          <div className="flex gap-2 mt-2">
            {['Metropolitana', 'Biobío'].map(r => (
              <button
                key={r}
                onClick={() => setRegion(r as any)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  region === r 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div> Depto
          </span>
          <span className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Casa
          </span>
        </div>
      </div>

      <div className="relative aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        {/* Mock Map Background (Abstract Grid) */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(#0A4F41 0.5px, transparent 0.5px)', 
          backgroundSize: '24px 24px' 
        }}></div>

        {/* Property Markers */}
        {properties.map(prop => (
          <div 
            key={prop.id}
            className="absolute group cursor-pointer"
            style={{ left: `${prop.x}%`, top: `${prop.y}%` }}
          >
            <div className={`p-1.5 rounded-full shadow-lg transition-transform group-hover:scale-125 ${prop.type === 'Depto' ? 'bg-blue-600' : 'bg-orange-600'}`}>
              <Building2 className="w-3 h-3 text-white" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
              <div className="bg-gray-900 text-white p-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                <p className="font-bold">{prop.commune}</p>
                <p>{prop.price_uf} UF • {prop.m2} m²</p>
              </div>
              <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        ))}

        {/* Map Legend/Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-gray-200 text-[10px] text-slate-500">
          <p>{region === 'Metropolitana' ? 'Región Metropolitana • Santiago' : 'Región del Biobío • Concepción'}</p>
        </div>
      </div>
    </div>
  );
};
