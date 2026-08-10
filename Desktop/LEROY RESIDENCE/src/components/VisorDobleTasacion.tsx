import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DestinoCatastral } from '../firebase';
import { PRCLayersControl } from './PRCLayersControl';

// Controlador de encuadre milimétrico y ajuste inteligente de bounds
function CoordenadorMapa({ centro, zoom, vertices }: { centro: [number, number]; zoom: number; vertices?: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (vertices && vertices.length > 0) {
      try {
        const bounds = L.latLngBounds(vertices);
        map.fitBounds(bounds, {
          padding: [60, 60], // Margen generoso para ver accesos, avenida Pedro Aguirre Cerda y vecinos
          maxZoom: 16.5      // Zoom óptimo para predios pequeños que evita que se vea excesivamente cerca
        });
      } catch (err) {
        console.warn("CoordenadorMapa fitBounds error, fallback to setView:", err);
        map.setView(centro, 16.5, { animate: true, duration: 1 });
      }
    } else {
      map.setView(centro, 16.5, { animate: true, duration: 1 });
    }
  }, [centro, zoom, vertices, map]);
  return null;
}

export const VisorDobleTasacion = ({ destino }: { destino: DestinoCatastral | null }) => {
  // Posición por defecto en caso de no haber consulta activa
  const centro: [number, number] = destino ? [destino.lat, destino.lng] : [-36.83914, -73.093251];

  // Icono certificado del SII: marcador naranja con halo amarillo de base
  const customSiiIcon = React.useMemo(() => L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <!-- Halo amarillo de base en el suelo -->
        <div class="w-8 h-2 bg-[#f59e0b] opacity-75 rounded-full absolute bottom-[-1px] border border-[#d97706] blur-[0.5px]"></div>
        <!-- Teardrop Pin naranja -->
        <div class="w-8 h-8 flex items-center justify-center relative -top-3.5 select-none pointer-events-none">
          <svg viewBox="0 0 384 512" class="w-8 h-8 text-[#e15200] drop-shadow-md">
            <path fill="currentColor" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0s85.961-192 192-192 192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
          </svg>
          <!-- Punto blanco central -->
          <div class="w-2.5 h-2.5 bg-white rounded-full absolute top-[11px]"></div>
        </div>
      </div>
    `,
    className: 'sii-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }), []);

  // Formateador de ROL en formato oficial "Manzana-Predio" (ej. 12030-2)
  const formatRolSii = (rup?: string) => {
    if (!rup) return "12030-2";
    const parts = rup.split('-');
    if (parts.length >= 3) {
      return `${parts[1].replace(/^0+/, '')}-${parts[2].replace(/^0+/, '')}`;
    }
    return rup;
  };

  return (
    <>
      {/* Definición de patrones SVG globales para el sombreado de catastro del SII */}
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Sombreado de malla de puntos azul para predios estándar vecinos */}
          <pattern id="sii-dots-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#f0f9ff" />
            <circle cx="5" cy="5" r="1.2" fill="#3b82f6" opacity="0.35" />
          </pattern>
          {/* Sombreado naranja/amarillo para el predio destacado consultado */}
          <pattern id="sii-target-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#fff7ed" />
            <circle cx="5" cy="5" r="1.5" fill="#ea580c" opacity="0.4" />
          </pattern>
        </defs>
      </svg>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-[520px]">
        
        {/* 🌲 CUADRO 1: FIDELIDAD DE TERRENO (SATELITAL RECONOCIBLE) */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
          <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg z-[1000] font-sans font-medium">
            1. Vista Satelital (Entorno y Accesos)
          </div>
          <MapContainer center={centro} zoom={18} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            {/* Satélite puro de alta resolución comercial */}
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {/* Rotulación fina de calles superpuesta */}
            <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" />
            
            {/* Marcador técnico exacto sin polígonos que obstruyan el inmueble */}
            {destino && <Marker position={centro} />}
            <CoordenadorMapa centro={centro} zoom={18} vertices={destino?.vertices} />
          </MapContainer>
        </div>

        {/* 📐 CUADRO 2: CERTEZA JURÍDICA (PLANO DE ROLES Y CATASTRO) */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner flex flex-col h-full bg-slate-50">
          {/* Header Oficial SII Mapas idéntico a la referencia del usuario */}
          <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between z-[1001] shadow-sm select-none shrink-0 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="text-[#e15200] font-black text-xs md:text-sm tracking-wider uppercase font-sans">
                CARTOGRAFÍA DIGITAL SII MAPAS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80">
                <svg className="w-4 h-4 text-[#e15200]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-[7.5px] font-black text-[#e15200] uppercase tracking-wider">Catálogo Mapas</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80">
                <svg className="w-4 h-4 text-[#e15200]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-8-3a2 2 0 012-2m-2 4a2 2 0 012 2m-3 4h12a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-[7.5px] font-black text-[#e15200] uppercase tracking-wider">Ingresar</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80">
                <svg className="w-4 h-4 text-[#e15200]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-[7.5px] font-black text-[#e15200] uppercase tracking-wider">Buscar Comunas</span>
              </div>
            </div>
          </div>

          {/* Área de la Cartografía */}
          <div className="relative flex-1 w-full h-[calc(100%-44px)]">
            <MapContainer center={centro} zoom={19} style={{ height: '100%', width: '100%' }} zoomControl={true}>
              {/* Fondo vectorial claro de alta certeza catastral */}
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              
              <PRCLayersControl 
                zoningCode={destino?.zoning_code} 
                geometryData={destino ? { type: "Polygon", coordinates: [destino.vertices.map(c => [c[1], c[0]])] } : undefined}
                propertyCenter={centro}
                commune={destino?.commune}
                rolSii={destino?.rup}
              />

              {/* Perímetro destacado calculado desde la base de datos sin redondeos */}
              {destino && (
                <Polygon
                  positions={destino.vertices}
                  pathOptions={{
                    color: '#ea580c',     // Solid red/orange borders for absolute high contrast
                    weight: 4.5,
                    fillColor: 'url(#sii-target-pattern)',
                    fillOpacity: 0.95
                  }}
                />
              )}

              {/* Marcador certificado del SII con popup de auto-apertura */}
              {destino && (
                <Marker 
                  position={centro} 
                  icon={customSiiIcon}
                  eventHandlers={{
                    add: (e) => {
                      setTimeout(() => {
                        try {
                          e.target.openPopup();
                        } catch (err) {
                          // Silent retry/catch for safe load
                        }
                      }, 100);
                    }
                  }}
                >
                  <Popup closeButton={true} className="sii-custom-popup" autoPan={false}>
                    <div style={{ fontFamily: 'sans-serif', padding: '2px', minWidth: '130px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '11px', color: '#111827', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>
                        Rol Predial: {formatRolSii(destino.rup)}
                      </strong>
                      <span style={{ fontSize: '9px', color: '#4b5563', display: 'block', fontWeight: 'normal' }}>
                        {destino.lat.toFixed(5)} &nbsp;&nbsp; {destino.lng.toFixed(5)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}

              <CoordenadorMapa centro={centro} zoom={19} vertices={destino?.vertices} />
            </MapContainer>
          </div>
        </div>

      </div>
    </>
  );
};

