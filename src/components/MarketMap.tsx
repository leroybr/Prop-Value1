import React from 'react';
import { Sparkles, MapPin, Building2, Home, Landmark, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Property {
  id: string;
  commune: string;
  price_uf: number;
  m2: number;
  type: string;
  lat: number;
  lng: number;
}

const mockProperties: Record<string, Property[]> = {
  'Metropolitana': [],
  'Biobío': []
};

const regionCenters = {
  'Metropolitana': [-33.448, -70.667] as [number, number],
  'Biobío': [-36.827, -73.050] as [number, number]
};

export const MarketMap: React.FC = () => {
  const [region, setRegion] = React.useState<'Metropolitana' | 'Biobío'>('Biobío');
  const properties = mockProperties[region] || [];

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
            <MapPin className="text-blue-600 w-5 h-5" />
            Mapa de Oportunidades y Referencia GIS
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

      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 z-0">
        <MapContainer 
          center={regionCenters[region] || [-33.448, -70.667]} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {properties.map(prop => (
            <Marker key={prop.id} position={[prop.lat, prop.lng]}>
              <Popup className="sii-style-popup">
                <div className="p-3 min-w-[200px] font-sans">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficha de Referencia</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{prop.commune}</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Valor Referencial:</span>
                      <span className="font-bold text-blue-600">{(prop.price_uf || 0).toLocaleString()} UF</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Superficie Terreno:</span>
                      <span className="font-bold text-slate-700">{prop.m2 || 0} m²</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">UF / m²:</span>
                      <span className="font-bold text-slate-700">{((prop.price_uf || 0) / (prop.m2 || 1)).toFixed(1)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(`https://www4.sii.cl/mapasui/internet/#/contenido/index.html`, '_blank')}
                    className="w-full mt-3 py-1.5 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded hover:bg-black transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visor Oficial SII
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          <ZoomControl position="bottomright" />
        </MapContainer>

        {/* Map Legend/Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-gray-200 text-[10px] text-slate-600 z-[1000] shadow-md">
          <p className="font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Capa: Cartografía Técnica (Estilo SII)
          </p>
          <p>{region === 'Metropolitana' ? 'Región Metropolitana • Santiago' : 'Región del Biobío • Concepción'}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketMap;
