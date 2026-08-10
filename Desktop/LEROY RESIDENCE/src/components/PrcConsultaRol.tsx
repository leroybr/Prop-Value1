import React, { useState, useEffect } from 'react';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { prcData } from '../data/prcData';
import { Search, Building2, MapPin, Scale, Sparkles, AlertCircle, Database, CheckCircle2, Layers, Leaf, FileJson, Info, Coins, Globe } from 'lucide-react';
import { db as firestoreDb, collection, getDocs, query, limit } from '../firebase';
import { Project } from '../types';
import { parseSiiJson, SiiParsedData } from '../utils/siiImport';

// Configuration for the PropValue Realtime Database
const firebaseConfig = {
  apiKey: "AIzaSyAxmI2_7QHigXuwOUmFdm4C7asjT3160TY",
  authDomain: "propvalue-cl.firebaseapp.com",
  databaseURL: "https://propvalue-cl-default-rtdb.firebaseio.com",
  projectId: "propvalue-cl",
  storageBucket: "propvalue-cl.appspot.com",
  messagingSenderId: "21026459472",
  appId: "1:21026459472:web:3dd2e8b5c6575b7e8ae655"
};

// Avoid app duplication in Vite dev environment
let rtdbApp;
try {
  rtdbApp = getApps().find(app => app.name === 'propvalue-rtdb') || initializeApp(firebaseConfig, 'propvalue-rtdb');
} catch (e) {
  console.warn("Retrying main app configuration as fallback");
  rtdbApp = getApp();
}

const db = getDatabase(rtdbApp);

interface PrcResult {
  comunaTexto: string;
  zonaCodigo: string;
  nombre: string;
  norma: string;
  permitidos: string[];
  prohibidos: string[];
  constructibilidad: string;
  ocupacion_suelo: string;
  altura_maxima: string;
  densidad_maxima: string;
  source: 'database' | 'local_catalog';
}

const LOCAL_FALLBACK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Edificio Parque Laguna',
    developer: 'Inmobiliaria LeRoy residence',
    property_type: 'Departamento',
    region: 'Biobío',
    commune: 'San Pedro de la Paz',
    sector: 'Andalué',
    zoning_code: 'H2',
    address: 'Av. Las Condes 12300',
    status: 'En Verde',
    floors: 14,
    total_units: 84,
    amenities: ['Piscina', 'Quincho panorámico', 'Gimnasio', 'Bicicletero'],
    sustainability_features: ['Eficiencia Energética', 'Cargador auto eléctrico'],
    avg_price_uf_m2: 56.5,
    coordinates: { lat: -36.852, lng: -73.064 }
  },
  {
    id: 'p2',
    name: 'Condominio Lomas de San Andrés',
    developer: 'Inmobiliaria Biobío S.A.',
    property_type: 'Casa',
    region: 'Biobío',
    commune: 'Concepción',
    sector: 'Lomas de San Andrés',
    zoning_code: 'HE',
    address: 'Camino del Sol 452',
    status: 'Entrega Inmediata',
    floors: 2,
    total_units: 24,
    amenities: ['Sala Multiuso', 'Conserjería 24/7', 'Áreas Verdes'],
    sustainability_features: ['Paneles Solares', 'Aislación térmica avanzada'],
    avg_price_uf_m2: 52.0,
    coordinates: { lat: -36.790, lng: -73.051 }
  },
  {
    id: 'p3',
    name: 'Edificio O\'Higgins Plaza',
    developer: 'Inmobiliaria Concepción Centro',
    property_type: 'Departamento',
    region: 'Biobío',
    commune: 'Concepción',
    sector: 'Centro',
    zoning_code: 'ZH-1',
    address: 'Av. O\'Higgins 1045',
    status: 'En Venta',
    floors: 18,
    total_units: 120,
    amenities: ['Cowork', 'Gimnasio', 'Lavandería', 'Conserjería 24/7'],
    sustainability_features: ['Ventanas de Termopanel', 'Grifería de bajo consumo'],
    avg_price_uf_m2: 63.8,
    coordinates: { lat: -36.827, lng: -73.050 }
  }
];

export const PrcConsultaRol = () => {
  const [comuna, setComuna] = useState<'concepcion' | 'san_pedro_de_la_paz'>('concepcion');
  const [rol, setRol] = useState('');
  const [resultado, setResultado] = useState<PrcResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(firestoreDb, 'projects'), limit(100));
        const snap = await getDocs(q);
        const list: Project[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as any);
        });
        if (list.length > 0) {
          setAllProjects(list);
        } else {
          setAllProjects(LOCAL_FALLBACK_PROJECTS);
        }
      } catch (err) {
        console.warn("Error loading projects from Firestore, using local fallback list:", err);
        setAllProjects(LOCAL_FALLBACK_PROJECTS);
      }
    };
    fetchProjects();
  }, []);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rol) return;

    setCargando(true);
    setError('');
    setResultado(null);

    // Extrae la manzana (lo que está antes del guión)
    const manzana = rol.split('-')[0].trim().replace(/^0+/, "");

    try {
      let zoneCodigo: string | null = null;
      let zoneDetails: any = null;
      let loadedFrom: 'database' | 'local_catalog' = 'database';

      try {
        // Paso 1: Buscar la Zona correspondiente a la manzana en la comuna (RTDB)
        const manzanaRef = ref(db, `manzanas_prc/${comuna}/${manzana}`);
        const manzanaSnapshot = await get(manzanaRef);

        if (manzanaSnapshot.exists()) {
          zoneCodigo = manzanaSnapshot.val();

          if (zoneCodigo) {
            // Paso 2: Buscar el detalle técnico de esa Zona del PRC
            const zonaDetalleRef = ref(db, `detalles_zonas/${comuna}/${zoneCodigo}`);
            const zonaSnapshot = await get(zonaDetalleRef);

            if (zonaSnapshot.exists()) {
              zoneDetails = zonaSnapshot.val();
            }
          }
        }
      } catch (databaseError) {
        console.warn("Base de datos en la nube inaccesible o error de privilegios. Usando catálogo integrado de alta precisión.");
      }

      // Fallback a catálogo local si no se encontró en la base de datos o hubo conexión fallida
      if (!zoneCodigo || !zoneDetails) {
        const localManzanas = prcData.manzanas_prc[comuna];
        if (localManzanas && localManzanas[manzana]) {
          zoneCodigo = localManzanas[manzana];
          const localDetails = prcData.detalles_zonas[comuna]?.[zoneCodigo];
          if (localDetails) {
            zoneDetails = localDetails;
            loadedFrom = 'local_catalog';
          }
        }
      }

      if (!zoneCodigo) {
        setError(`La manzana ${manzana} no se encuentra registrada en el PRC de esta comuna.`);
        setCargando(false);
        return;
      }

      if (!zoneDetails) {
        setError(`Se identificó la zona ${zoneCodigo}, pero no hay parámetros normativos cargados.`);
        setCargando(false);
        return;
      }

      setResultado({
        comunaTexto: comuna === 'concepcion' ? 'Concepción' : 'San Pedro de la Paz',
        zonaCodigo: zoneCodigo,
        nombre: zoneDetails.nombre,
        norma: zoneDetails.norma,
        permitidos: zoneDetails.permitidos || [],
        prohibidos: zoneDetails.prohibidos || [],
        constructibilidad: zoneDetails.constructibilidad,
        ocupacion_suelo: zoneDetails.ocupacion_suelo,
        altura_maxima: zoneDetails.altura_maxima,
        densidad_maxima: zoneDetails.densidad_maxima,
        source: loadedFrom
      });

    } catch (err) {
      console.error(err);
      setError('Error al consultar la base de datos de PropValue.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div id="prc_consulta_container" className="max-w-4xl mx-auto py-8 px-4 font-sans antialiased text-slate-800">
      
      {/* HEADER PRINCIPAL */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
          <Building2 className="w-8 h-8 text-blue-600 shrink-0" />
          Consulta de Zonificación por Rol (PRC)
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Visualice coeficientes constructivos, usos permitidos y restrictivos de acuerdo con el Plan Regulador Comunal (PRC) del Gran Concepción.
        </p>
      </div>

      {/* FORMULARIO DE BÚSQUEDA */}
      <div id="prc_search_card" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm transition-all hover:shadow-md mb-8">
        <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Identificación de Rol y Comuna
        </h3>
        
        <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Comuna</label>
            <select 
              value={comuna} 
              onChange={(e) => setComuna(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="concepcion">Concepción</option>
              <option value="san_pedro_de_la_paz">San Pedro de la Paz</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Número de Rol (Manzana-Predio)</label>
            <input 
              type="text" 
              placeholder="Ej: 102-15" 
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition-colors"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {cargando ? 'Consultando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* INFORME NORMATIVO TÉCNICO COMPLETO */}
      {resultado && (
        <div id="prc_report_card" className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          {/* Header del Informe */}
          <div className="bg-slate-950 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Certificado de Información</span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                Informe Normativo Urbano
              </h2>
            </div>
            
            {/* Fuente de Datos Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                resultado.source === 'database' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}>
                {resultado.source === 'database' ? (
                  <>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Base de Datos Activa
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Catálogo de Resiliencia
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* 1. Identificación del Predio */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">I. Identificación Catastral</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 p-4 items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instrumento Regulador</span>
                  <span className="text-sm font-semibold text-slate-900 sm:col-span-2">Plan Regulador Comunal (PRC)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 p-4 items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurisdicción / Comuna</span>
                  <span className="text-sm font-semibold text-slate-900 sm:col-span-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {resultado.comunaTexto}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 p-4 items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zonificación Oficial</span>
                  <span className="text-sm font-semibold text-slate-900 sm:col-span-2 flex items-center gap-2">
                    <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md font-black text-xs">
                      {resultado.zonaCodigo}
                    </span>
                    <span className="font-extrabold text-slate-900">{resultado.nombre}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 p-4 items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuente Legal Directa</span>
                  <span className="text-xs font-mono font-medium text-slate-600 sm:col-span-2">{resultado.norma}</span>
                </div>
              </div>
            </div>

            {/* 2. Parámetros Técnicos de Edificación */}
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Scale className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  II. Parámetros Técnicos de Edificación
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coef. Constructibilidad</span>
                  <span className="text-lg font-black text-slate-900">{resultado.constructibilidad}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ocupación de Suelo</span>
                  <span className="text-lg font-black text-slate-900">{resultado.ocupacion_suelo}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Altura Máxima</span>
                  <span className="text-sm font-black text-slate-900 line-clamp-2 min-h-[40px] flex items-center justify-center">{resultado.altura_maxima}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Densidad Máxima</span>
                  <span className="text-sm font-black text-slate-900 line-clamp-2 min-h-[40px] flex items-center justify-center">{resultado.densidad_maxima}</span>
                </div>
              </div>
            </div>

            {/* 3. Aptitud de Usos de Suelo */}
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  III. Aptitud de Usos de Suelo
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Usos Permitidos */}
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5">
                  <h5 className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Usos Permitidos (Aptos)
                  </h5>
                  <ul className="space-y-2">
                    {resultado.permitidos.map((uso, index) => (
                      <li key={index} className="text-xs font-semibold text-slate-700 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        {uso}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Usos Prohibidos */}
                <div className="bg-red-50/40 border border-red-100 rounded-2xl p-5">
                  <h5 className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Usos Prohibidos y Restricciones
                  </h5>
                  <ul className="space-y-2">
                    {resultado.prohibidos.map((uso, index) => (
                      <li key={index} className="text-xs font-semibold text-slate-700 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-red-500 font-bold shrink-0">✕</span>
                        {uso}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Proyectos en Ejecución Aprobados */}
            <div>
              {(() => {
                const matchCommune = (projCommune: string, selectedCommune: string) => {
                  const norm = (s: string) => s.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, '');
                  return norm(projCommune) === norm(selectedCommune);
                };
                const communeProjects = allProjects.filter(p => matchCommune(p.commune, resultado.comunaTexto));
                
                return (
                  <>
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <Layers className="w-4.5 h-4.5 text-blue-600" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center justify-between w-full">
                        <span>IV. Proyectos en Ejecución Aprobados</span>
                        <span className="text-xs font-semibold normal-case text-slate-500">
                          {communeProjects.length} {communeProjects.length === 1 ? 'proyecto encontrado' : 'proyectos encontrados'}
                        </span>
                      </h3>
                    </div>

                    {communeProjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {communeProjects.map((project) => (
                          <div key={project.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-5 transition-all duration-200 hover:shadow-sm">
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-950">{project.name}</h4>
                                <span className="text-[11px] text-blue-600 font-bold">{project.developer}</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                project.status === 'Entrega Inmediata' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                                project.status === 'En Verde' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {project.status}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{project.address}{project.sector ? `, ${project.sector}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{project.property_type} • {project.floors} pisos • {project.total_units} unidades</span>
                              </div>
                              {project.zoning_code && (
                                <div className="inline-flex items-center gap-1.5 bg-blue-50/80 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  <span>Zonificación: {project.zoning_code}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {project.amenities.slice(0, 3).map((amenity, idx) => (
                                <span key={idx} className="bg-white border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                  {amenity}
                                </span>
                              ))}
                              {project.sustainability_features && project.sustainability_features.length > 0 && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                                  <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
                                  Sostenible
                                </span>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium">Precio Promedio</p>
                                <p className="text-sm font-black text-slate-900">{project.avg_price_uf_m2} UF/m²</p>
                              </div>
                              <span className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                                Aprobado SERVIU
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          No se registran proyectos en ejecución aprobados para la comuna de {resultado.comunaTexto} en este momento.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PrcConsultaRol;
