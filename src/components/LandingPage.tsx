import React from 'react';
import { motion } from 'motion/react';
import { Calculator, TrendingUp, Building2, MapPin, Info } from 'lucide-react';
import { MarketStat } from '../types.ts';

interface LandingPageProps {
  setActiveTab: (tab: 'intro' | 'valuation' | 'projects') => void;
  marketStats: MarketStat[];
  loadDemoValuation: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  setActiveTab, 
  marketStats, 
  loadDemoValuation 
}) => {
  return (
    <motion.div
      key="intro-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className="hero pb-2 md:pb-4">
        <div className="w-full flex flex-col items-center">
          <div className="hero-title-banner flex-col">
            <h1 className="text-2xl md:text-4xl lg:text-5xl text-center text-white font-bold">
              ¿Sabes cuánto vale tu propiedad?
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4 max-w-5xl mx-auto w-full">
              <button 
                onClick={() => {
                  setActiveTab('valuation');
                  setTimeout(() => document.getElementById('market-map')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Mapa de Oportunidades
              </button>
              <button 
                onClick={() => {
                  setActiveTab('valuation');
                  setTimeout(() => document.getElementById('market-trends')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Análisis de Mercado
              </button>
              <button 
                onClick={() => {
                  setActiveTab('valuation');
                  setTimeout(() => document.getElementById('valuation-history')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Historial
              </button>
              <button 
                onClick={() => {
                  setTimeout(() => document.getElementById('market-stats')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Mercado por Comuna
              </button>
              <button 
                onClick={() => {
                  setActiveTab('projects');
                  setTimeout(() => document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Proyectos
              </button>
              <button 
                onClick={() => {
                  setTimeout(() => document.getElementById('plusvalia')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="hero-nav-btn text-[10px] md:text-xs py-3 px-2 h-full flex items-center justify-center text-center"
              >
                Plusvalía
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4 w-full max-w-6xl px-4 items-stretch">
            <div className="valuation-pillar p-3 md:p-4">
              <div className="pillar-icon mb-2">
                <Calculator className="w-6 h-6 md:w-7 h-7" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1">Técnico y Normativo</h3>
              <p className="text-[10px] text-slate-500 mb-2 italic font-bold leading-tight">Analizamos el Plan Regulador, zonificación y normas del SII para saber qué se permite construir.</p>
              <div className="w-full">
                <p className="pillar-subtitle text-[11px] mb-2">Aspectos que considera:</p>
                <ul className="pillar-list text-[10px] space-y-1">
                  <li><span>•</span> Rol de Avalúo SII</li>
                  <li><span>•</span> Zonificación (PRC)</li>
                  <li><span>•</span> Coef. Constructibilidad</li>
                  <li><span>•</span> Rasantes y Densidad</li>
                </ul>
              </div>
            </div>
            
            <div className="valuation-pillar p-3 md:p-4">
              <div className="pillar-icon mb-2">
                <TrendingUp className="w-6 h-6 md:w-7 h-7" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1">Análisis de Mercado</h3>
              <p className="text-[10px] text-slate-500 mb-2 italic font-bold leading-tight">Comparamos con ventas reales y oferta actual en el sector para determinar el valor de mercado.</p>
              <div className="w-full">
                <p className="pillar-subtitle text-[11px] mb-2">Aspectos que considera:</p>
                <ul className="pillar-list text-[10px] space-y-1">
                  <li><span>•</span> Testigos de Venta</li>
                  <li><span>•</span> Oferta Competitiva</li>
                  <li><span>•</span> Plusvalía de Zona</li>
                  <li><span>•</span> Valor UF/m² Promedio</li>
                </ul>
              </div>
            </div>

            <div className="valuation-pillar p-3 md:p-4">
              <div className="pillar-icon mb-2">
                <Building2 className="w-6 h-6 md:w-7 h-7" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1">Atributos Propiedad</h3>
              <p className="text-[10px] text-slate-500 mb-2 italic font-bold leading-tight">Evaluamos el estado, terminaciones y equipamiento que hacen única a tu propiedad.</p>
              <div className="w-full">
                <p className="pillar-subtitle text-[11px] mb-2">Aspectos que considera:</p>
                <ul className="pillar-list text-[10px] space-y-1">
                  <li><span>•</span> Superficie Útil/Total</li>
                  <li><span>•</span> Calidad de Terminaciones</li>
                  <li><span>•</span> Orientación y Vista</li>
                  <li><span>•</span> Equipamiento Común</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2 px-4">
            <button 
              onClick={() => setActiveTab('valuation')}
              className="cta-main text-sm md:text-base py-1.5 px-6"
            >
              Obtener Tasación
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Stats */}
          <div id="market-stats" className="lg:col-span-4 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Mercado por Comuna
              </h3>
              <div className="space-y-3">
                {marketStats.map(stat => (
                  <div key={stat.commune} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sm font-medium">{stat.commune}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold">{stat.avgPriceUF.toLocaleString()} UF</div>
                      <div className={`text-xs ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Plusvalia & Access */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="plusvalia" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Zonas de Alta Plusvalía
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span>Andalué, San Pedro de la Paz</span>
                    <span className="text-green-600 font-bold">+9.5% anual</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span>Lomas de San Sebastián, Concepción</span>
                    <span className="text-green-600 font-bold">+7.2% anual</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Brisas del Sol, Talcahuano</span>
                    <span className="text-green-600 font-bold">+5.8% anual</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                <p className="text-sm text-gray-500 mb-2">¿Eres corredor de propiedades?</p>
                <button className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors">
                  Acceso Profesional
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Biobío Specific Insights - Full Width */}
      <section className="w-full bg-gradient-to-br from-blue-600 to-blue-900 py-20 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-12">
            <div className="max-w-3xl">
              <h3 className="text-4xl font-bold mb-6 flex items-center gap-4">
                <Info className="w-10 h-10 text-white" />
                Análisis Instrumentos Técnicos Considerados
              </h3>
              <p className="text-white text-xl leading-relaxed">
                Nuestra plataforma integra datos geoespaciales críticos y normativas de la Región del Biobío, 
                asegurando que cada tasación se fundamente en los instrumentos técnicos vigentes y el análisis territorial preciso.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <p className="text-xs text-white tracking-widest font-bold mb-3">Normativa Urbana</p>
                <p className="font-bold text-xl mb-3 group-hover:text-blue-100 transition-colors">Concepción Centro (PRC)</p>
                <p className="text-white/90 text-sm leading-relaxed">
                  El Plan Regulador Comunal (PRC) en su zonificación ZH-1 permite alta densidad, 
                  siendo el principal motor para proyectos mixtos y la renovación urbana del casco histórico.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <p className="text-xs text-white tracking-widest font-bold mb-3">Plusvalía & Vistas</p>
                <p className="font-bold text-xl mb-3 group-hover:text-blue-100 transition-colors">San Pedro (Andalué/Huertos)</p>
                <p className="text-white/90 text-sm leading-relaxed">
                  Consideramos las restricciones de altura específicas en zonas residenciales exclusivas, 
                  un factor determinante para preservar la plusvalía y el valor de las vistas privilegiadas.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <p className="text-xs text-white tracking-widest font-bold mb-3">Riesgos & Seguridad</p>
                <p className="font-bold text-xl mb-3 group-hover:text-blue-100 transition-colors">Sistema GIS Municipal</p>
                <p className="text-white/90 text-sm leading-relaxed">
                  Integramos capas de riesgo (inundación y remoción en masa) del sistema de información geográfica, 
                  garantizando tasaciones que reflejan la seguridad real del terreno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">¿Listo para conocer el valor real de tu propiedad?</h2>
          <p className="text-gray-600 mb-8 text-lg">Obtén un informe detallado en segundos con nuestra tecnología de IA.</p>
          <button 
            onClick={() => {
              setActiveTab('valuation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-blue-600 text-white px-10 py-4 rounded-md font-bold text-xl hover:bg-blue-700 transition-all shadow-xl hover:scale-105"
          >
            Comenzar Tasación Ahora
          </button>
        </div>
      </section>
    </motion.div>
  );
};
