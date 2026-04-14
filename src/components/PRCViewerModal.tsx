import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map as MapIcon, MapPin, Info, Layers, Maximize2 } from 'lucide-react';

interface PRCViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyData: {
    address?: string;
    number?: string;
    commune?: string;
    rol_manzana?: string;
    rol_predio?: string;
    m2_total?: number;
    gis_id?: string;
    zoning?: string;
  };
}

export const PRCViewerModal: React.FC<PRCViewerModalProps> = ({ isOpen, onClose, propertyData }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <MapIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Visor Territorial PRC</h2>
                <p className="text-xs text-slate-500 font-medium">Plano Regulador Comunal • {propertyData.commune || "Comuna No Especificada"}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Info */}
            <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Identificación Predial</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Rol de Avalúo</p>
                    <p className="text-sm font-black text-slate-800">
                      {propertyData.rol_manzana || "0000"}-{propertyData.rol_predio || "000"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Superficie Terreno</p>
                    <p className="text-sm font-black text-slate-800">{propertyData.m2_total || 0} m²</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">ID Objeto GIS</p>
                    <p className="text-sm font-black text-slate-800">#{propertyData.gis_id || "11791"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Normativa Vigente</h3>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">Zona PRC</span>
                  </div>
                  <p className="text-sm font-black text-amber-900 mb-1">{propertyData.zoning || "No detectada"}</p>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Zona sujeta a restricciones de altura y ocupación según Plan Regulador vigente.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button className="w-full py-3 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                  <Layers className="w-4 h-4" />
                  Cambiar Capas
                </button>
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-200 overflow-hidden">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 bg-[#e5e7eb]" style={{
                backgroundImage: `
                  linear-gradient(45deg, #d1d5db 25%, transparent 25%),
                  linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #d1d5db 75%),
                  linear-gradient(-45deg, transparent 75%, #d1d5db 75%)
                `,
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
              }}>
                {/* Simulated Streets */}
                <div className="absolute top-1/2 left-0 w-full h-12 bg-white/80 -translate-y-1/2 rotate-2 shadow-sm flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{propertyData.address || "CALLE PRINCIPAL"}</span>
                </div>
                <div className="absolute top-0 left-1/3 w-12 h-full bg-white/80 -translate-x-1/2 -rotate-1 shadow-sm flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] [writing-mode:vertical-lr] rotate-180">AVENIDA TRANSVERSAL</span>
                </div>

                {/* Property Polygon (Simulated) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute top-[45%] left-[35%] w-32 h-24 bg-blue-600/40 border-2 border-blue-600 shadow-2xl flex items-center justify-center"
                >
                  <div className="bg-blue-600 p-1.5 rounded-full text-white shadow-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  
                  {/* Property Info Overlay */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl">
                    PROPIEDAD ROL {propertyData.rol_manzana}-{propertyData.rol_predio}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </motion.div>

                {/* Zoning Areas (Simulated) */}
                <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-amber-500/10 border-l-2 border-b-2 border-amber-500/30 flex items-start p-4">
                  <span className="text-[10px] font-black text-amber-600/50 uppercase">ZONA {propertyData.zoning?.split(' ')[0] || "PRC"}</span>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button className="p-3 bg-white rounded-xl shadow-lg text-slate-600 hover:text-blue-600 transition-colors">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
                  <button className="p-3 text-xl font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-100">+</button>
                  <button className="p-3 text-xl font-bold text-slate-600 hover:bg-slate-50">-</button>
                </div>
              </div>

              {/* Scale Bar */}
              <div className="absolute bottom-6 left-6 flex items-end gap-2">
                <div className="w-24 h-1 border-b-2 border-l-2 border-r-2 border-slate-800"></div>
                <span className="text-[10px] font-bold text-slate-800 uppercase">20m</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
