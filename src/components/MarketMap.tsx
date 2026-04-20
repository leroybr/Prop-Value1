import React from 'react';
import { MapPin, Building2, Home } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  'Metropolitana': [
    { id: '1', commune: 'Providencia', price_uf: 5200, m2: 65, type: 'Depto', lat: -33.431, lng: -70.612 },
    { id: '2', commune: 'Las Condes', price_uf: 8400, m2: 85, type: 'Depto', lat: -33.412, lng: -70.566 },
    { id: '3', commune: 'Santiago', price_uf: 3100, m2: 45, type: 'Depto', lat: -33.448, lng: -70.667 },
    { id: '4', commune: 'Ñuñoa', price_uf: 4800, m2: 70, type: 'Depto', lat: -33.454, lng: -70.597 },
    { id: '5', commune: 'Vitacura', price_uf: 12500, m2: 120, type: 'Casa', lat: -33.381, lng: -70.578 },
  ],
  'Biobío': [
    { id: '6', commune: 'Concepción (Centro)', price_uf: 4200, m2: 60, type: 'Depto', lat: -36.827, lng: -73.050 },
    { id: '7', commune: 'San Pedro (Huertos)', price_uf: 6500, m2: 110, type: 'Casa', lat: -36.852, lng: -73.078 },
    { id: '8', commune: 'Talcahuano', price_uf: 3500, m2: 55, type: 'Depto', lat: -36.716, lng: -73.116 },
    { id: '9', commune: 'Chiguayante', price_uf: 4900, m2: 80, type: 'Casa', lat: -36.916, lng: -73.016 },
    { id: '10', commune: 'Concepción (Lomas)', price_uf: 5800, m2: 75, type: 'Depto', lat: -36.800, lng: -73.030 },
    { id: '11', commune: 'San Pedro (Andalué)', price_uf: 8200, m2: 140, type: 'Casa', lat: -36.845, lng: -73.065 },
  ]
};

const regionCenters = {
  'Metropolitana': [-33.448, -70.667] as [number, number],
  'Biobío': [-36.827, -73.050] as [number, number]
};

export const MarketMap: React.FC = () => {
  const [region, setRegion] = React.useState<'Metropolitana' | 'Biobío'>('Biobío');
  const properties = mockProperties[region];

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
          center={regionCenters[region]} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {properties.map(prop => (
            <Marker key={prop.id} position={[prop.lat, prop.lng]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold text-blue-800">{prop.commune}</p>
                  <p className="font-medium">{prop.type} • {prop.price_uf.toLocaleString()} UF</p>
                  <p className="text-gray-500">{prop.m2} m² • {(prop.price_uf / prop.m2).toFixed(1)} UF/m²</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend/Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-gray-200 text-[10px] text-slate-600 z-[1000] shadow-md">
          <p className="font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Capa: Satelital Esri World Imagery
          </p>
          <p>{region === 'Metropolitana' ? 'Región Metropolitana • Santiago' : 'Región del Biobío • Concepción'}</p>
        </div>
      </div>
    </div>
  );
};

import { Sparkles } from 'lucide-react';
