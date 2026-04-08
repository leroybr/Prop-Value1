import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ValuationForm } from './components/ValuationForm';
import { MarketTrends } from './components/MarketTrends';
import { MarketMap } from './components/MarketMap';
import { ProjectList } from './components/ProjectList';
import { LandingPage } from './components/LandingPage';
import { PropertyData, ValuationResult, MarketStat, Project } from './types';
import { estimatePropertyValue } from './services/geminiService';
import { useFirebase } from './components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Building2, TrendingUp, MapPin, Calculator, Info, LogOut, LogIn, Download, FileText, X, CheckCircle2, Map as MapIcon, History, Layout, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const { user, loading: authLoading, authActionLoading, login, logout } = useFirebase();
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);
  const [ufValue, setUfValue] = useState(38500); // Fallback value
  const [history, setHistory] = useState<ValuationResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'intro' | 'valuation' | 'projects'>('intro');
  const [showSplash, setShowSplash] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key || key === "undefined") {
      setApiKeyError("Falta la clave de API de Gemini (VITE_GEMINI_API_KEY) en Vercel. Las tasaciones no funcionarán hasta que la agregues.");
    }
  }, []);

  const formatCurrency = (uf: number) => {
    const clp = uf * ufValue;
    return (
      <div className="flex flex-col">
        <span className="font-bold text-blue-600">{uf.toLocaleString()} UF</span>
        <span className="text-[10px] text-slate-400">$ {clp.toLocaleString('es-CL')} CLP</span>
      </div>
    );
  };

  const formatCurrencyInline = (uf: number) => {
    const clp = uf * ufValue;
    return `${uf.toLocaleString()} UF / $${clp.toLocaleString('es-CL')} CLP`;
  };


  // Fetch real-time UF value
  useEffect(() => {
    const fetchUF = async () => {
      try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        if (data.serie && data.serie.length > 0) {
          setUfValue(data.serie[0].valor);
        }
      } catch (error) {
        console.error('Error fetching UF value:', error);
      }
    };
    fetchUF();
  }, []);

  useEffect(() => {
    fetch('/api/market-stats')
      .then(res => res.json())
      .then(setMarketStats);
  }, []);

  // Sync projects from Firestore
  useEffect(() => {
    const q = query(collection(db, 'projects'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Project[];
      setProjects(projectList);
      
      // Seed mock data if empty and user is admin
      if (projectList.length === 0 && user?.email === "janiceleroy@gmail.com") {
        seedMockProjects();
      }
    }, (error) => {
      // Don't crash for project listing, just log
      console.error("Error fetching projects:", error);
    });
    return () => unsubscribe();
  }, []);

  const seedMockProjects = async () => {
    try {
      const mockProjects: Partial<Project>[] = [
      {
        name: "Edificio Biobío Central",
        developer: "Inmobiliaria Sur",
        property_type: 'Departamento',
        region: "Biobío",
        commune: "Concepción",
        sector: "Centro",
        zoning_code: "ZH-1",
        address: "Av. Chacabuco 1234",
        status: "En Venta",
        floors: 15,
        total_units: 120,
        amenities: ["Piscina", "Quincho", "Gimnasio"],
        sustainability_features: ["Paneles Solares", "Aislación Térmica"],
        avg_price_uf_m2: 65,
        coordinates: { lat: -36.827, lng: -73.050 }
      },
      {
        name: "Edificio Parque Ecuador",
        developer: "Inmobiliaria Concepción",
        property_type: 'Departamento',
        region: "Biobío",
        commune: "Concepción",
        sector: "Parque Ecuador",
        zoning_code: "ZH-2",
        address: "Víctor Lamas 1050",
        status: "Entrega Inmediata",
        floors: 12,
        total_units: 85,
        amenities: ["Gimnasio", "Sala de Cine", "Lavandería"],
        sustainability_features: ["Reciclaje de Aguas Grises"],
        avg_price_uf_m2: 72,
        coordinates: { lat: -36.833, lng: -73.045 }
      },
      {
        name: "Torre Santiago Oriente",
        developer: "Inmobiliaria Capital",
        property_type: 'Departamento',
        region: "Metropolitana",
        commune: "Las Condes",
        sector: "El Golf",
        zoning_code: "UC-1",
        address: "Av. Apoquindo 5678",
        status: "Entrega Inmediata",
        floors: 22,
        total_units: 180,
        amenities: ["Piscina Panorámica", "Cowork", "Lavandería"],
        sustainability_features: ["Certificación LEED", "Puntos de Reciclaje"],
        avg_price_uf_m2: 95,
        coordinates: { lat: -33.412, lng: -70.566 }
      },
      {
        name: "Residencial San Pedro",
        developer: "Inmobiliaria del Mar",
        property_type: 'Departamento',
        region: "Biobío",
        commune: "San Pedro de la Paz",
        sector: "Andalué",
        zoning_code: "ZH-3",
        address: "Av. Michimalonco 450",
        status: "En Verde",
        floors: 12,
        total_units: 90,
        amenities: ["Piscina", "Juegos Infantiles", "Club House"],
        sustainability_features: ["Eficiencia Energética", "Riego Automático"],
        avg_price_uf_m2: 58,
        coordinates: { lat: -36.845, lng: -73.065 }
      },
      {
        name: "Condominio Huertos Familiares",
        developer: "Inmobiliaria Los Huertos",
        property_type: 'Casa',
        region: "Biobío",
        commune: "San Pedro de la Paz",
        sector: "Huertos Familiares",
        zoning_code: "ZH-4",
        address: "Los Canelos 1200",
        status: "En Venta",
        floors: 5,
        total_units: 40,
        amenities: ["Quincho", "Áreas Verdes", "Seguridad 24/7"],
        sustainability_features: ["Iluminación LED", "Aislación Térmica"],
        avg_price_uf_m2: 62,
        coordinates: { lat: -36.852, lng: -73.078 }
      },
      {
        name: "Edificio Ñuñoa Life",
        developer: "Inmobiliaria Urbana",
        property_type: 'Departamento',
        region: "Metropolitana",
        commune: "Ñuñoa",
        sector: "Plaza Ñuñoa",
        zoning_code: "ZH-5",
        address: "Av. Irarrázaval 2345",
        status: "En Venta",
        floors: 18,
        total_units: 150,
        amenities: ["Piscina", "Quincho", "Sala Multiuso"],
        sustainability_features: ["Ventanas Termopanel", "Reciclaje"],
        avg_price_uf_m2: 78,
        coordinates: { lat: -33.454, lng: -70.601 }
      },
      {
        name: "Sitio Industrial Lomas",
        developer: "Lomas Land",
        property_type: 'Sitio Eriazo',
        region: "Biobío",
        commune: "Concepción",
        sector: "Lomas de San Sebastián",
        zoning_code: "ZE-1",
        address: "Av. Jorge Alessandri s/n",
        status: "En Venta",
        floors: 0,
        total_units: 1,
        amenities: [],
        sustainability_features: [],
        avg_price_uf_m2: 12,
        coordinates: { lat: -36.795, lng: -73.040 }
      },
      {
        name: "Condominio Brisas del Sol",
        developer: "Inmobiliaria Talcahuano",
        property_type: 'Departamento',
        region: "Biobío",
        commune: "Talcahuano",
        sector: "Brisas del Sol",
        zoning_code: "ZH-5",
        address: "Av. Jorge Alessandri 1234",
        status: "En Venta",
        floors: 8,
        total_units: 60,
        amenities: ["Piscina", "Gimnasio", "Sala Multiuso"],
        sustainability_features: ["Eficiencia Energética"],
        avg_price_uf_m2: 52,
        coordinates: { lat: -36.782, lng: -73.061 }
      }
    ];

    for (const p of mockProjects) {
      await addDoc(collection(db, 'projects'), p);
    }
    } catch (error) {
      console.error("Error seeding projects:", error);
    }
  };

  // Sync valuations from Firestore
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'valuations'),
      where('userId', '==', user.uid),
      limit(20) // Increased limit since we sort client-side
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const valuations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as ValuationResult[];
      
      // Sort client-side to avoid requiring a composite index (userId + createdAt)
      // which often causes "FAILED_PRECONDITION" errors for new users
      const sortedValuations = [...valuations].sort((a, b) => {
        const dateA = (a.createdAt as any)?.seconds || 0;
        const dateB = (b.createdAt as any)?.seconds || 0;
        return dateB - dateA;
      });
      
      setHistory(sortedValuations);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'valuations');
      } catch (e: any) {
        setFirestoreError(e);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const loadDemoValuation = () => {
    const mockValuation: ValuationResult = {
      estimated_price_uf: 5250,
      estimated_price_clp: Math.round(5250 * ufValue),
      confidence_score: 0.94,
      market_context: "Propiedad de ejemplo ubicada en sector consolidado de Las Condes. El valor refleja una excelente conservación, orientación oriente y cercanía a servicios premium. Se considera un factor de plusvalía del 4.5% anual para el sector.",
      regulatory_analysis: {
        compliance_score: 1.0,
        is_consistent: true,
        observations: "Los parámetros de altura (15 pisos) y constructibilidad (2.5) son plenamente consistentes con la zona UC-1 del Plano Regulador de Las Condes para el sector El Golf."
      },
      comparables: [
        { price_uf: 5400, m2: 75, distance_km: 0.2, source: "Venta Reciente CBRS - El Golf" },
        { price_uf: 5150, m2: 72, distance_km: 0.4, source: "Portal Inmobiliario - Depto Similar" },
        { price_uf: 5300, m2: 78, distance_km: 0.6, source: "TocToc - Oferta Competitiva" }
      ],
      property_data: {
        valuation_type: 'professional',
        property_type: 'Departamento',
        commune: 'Las Condes',
        sector: 'El Golf',
        m2_total: 85,
        m2_useful: 78,
        bedrooms: 2,
        bathrooms: 2,
        client_name: 'Particular (Demo)'
      }
    };
    setValuation(mockValuation);
    setShowReport(true);
  };

  const handleValuation = async (data: PropertyData) => {
    console.log("handleValuation called with data:", data);
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) ||
                   (window as any).process?.env?.GEMINI_API_KEY;

    if (!apiKey || apiKey === "undefined") {
      alert("Error: No se ha configurado la clave de API de Gemini. Si estás en Vercel, agrégala como VITE_GEMINI_API_KEY y haz un 'Redeploy'.");
      return;
    }

    if (!user) {
      console.warn("User not logged in, cannot perform valuation");
      alert("Por favor, inicia sesión para realizar una tasación.");
      return;
    }

    setIsLoading(true);
    setValuation(null); // Clear previous result
    try {
      console.log("Calling estimatePropertyValue with timeout...");
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 30000)
      );

      const result = await Promise.race([
        estimatePropertyValue(data, ufValue),
        timeoutPromise
      ]) as ValuationResult;

      console.log("estimatePropertyValue success, result:", result);
      setValuation(result);
      setShowReport(true);
      
      // Save to Firestore
      console.log("Saving valuation to Firestore...");
      await addDoc(collection(db, 'valuations'), {
        ...data,
        ...result,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log("Valuation saved successfully to Firestore");
    } catch (error) {
      console.error("Valuation error caught in App.tsx:", error);
      if (error instanceof Error && error.message === "TIMEOUT") {
        alert("La tasación está tomando más tiempo de lo esperado. Por favor, intenta de nuevo en unos momentos.");
      } else {
        alert("Hubo un error al procesar la tasación. Por favor, intenta de nuevo.");
      }
      handleFirestoreError(error, OperationType.CREATE, 'valuations');
    } finally {
      setIsLoading(false);
      console.log("handleValuation finished, isLoading set to false");
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !valuation) {
      console.error("Cannot download PDF: reportRef or valuation missing", { reportRef: !!reportRef.current, valuation: !!valuation });
      return;
    }
    
    setIsDownloading(true);
    console.log("Starting PDF generation...");

    try {
      const element = reportRef.current;
      
      // Wait for any animations or images to settle
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use html2canvas with optimized options
      const canvas = await html2canvas(element, {
        scale: 2, // Scale 2 is a good balance between quality and performance
        useCORS: true,
        allowTaint: false, // Set to false when using useCORS to avoid tainting the canvas
        logging: true,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        removeContainer: true,
      });
      
      console.log("Canvas captured successfully");
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Multi-page logic
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `Tasacion_${valuation.estimated_price_uf}UF_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      console.log("PDF saved successfully:", fileName);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo. Si el error persiste, intenta usar la opción de Imprimir.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (showSplash) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center cursor-pointer"
        onClick={() => setShowSplash(false)}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mt-0 w-full"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-800 px-4">
            Prop value <span className="text-blue-600 font-normal">Chile</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-sm mt-4 px-4">
            Valoración de bienes raíces
          </p>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-2 font-light">
            Herramienta de LeRoy Residence
          </p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-40 text-slate-600 text-base md:text-lg max-w-5xl mx-auto leading-relaxed px-4 font-light"
          >
            Prop-Value es una herramienta que analiza variables clave como mercado, plusvalía y normativa para estimar con precisión el valor de tu propiedad.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-24 w-full border-y border-zinc-200 py-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-zinc-800 text-xs font-medium tracking-[0.3em] uppercase"
          >
            <span className="animate-pulse">Valoriza tu propiedad hoy</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (user) {
                  setShowSplash(false);
                } else {
                  login();
                }
              }}
              disabled={authActionLoading}
              className="border border-zinc-800 px-8 py-3 hover:bg-zinc-800 hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {authActionLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <>Continuar <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>Ingresar con Google <LogIn className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Firestore Error Banner */}
      {firestoreError && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold sticky top-0 z-[60] shadow-lg flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Hubo un problema con la base de datos.
            <button 
              onClick={() => setFirestoreError(null)}
              className="ml-4 bg-white/20 px-2 py-1 rounded hover:bg-white/30 text-[10px]"
            >
              Ignorar
            </button>
          </div>
          <p className="text-[10px] opacity-90 font-mono max-w-2xl truncate">
            {(() => {
              try {
                const parsed = JSON.parse(firestoreError.message);
                return `${parsed.operationType.toUpperCase()} error on ${parsed.path}: ${parsed.error}`;
              } catch (e) {
                return firestoreError.message;
              }
            })()}
          </p>
        </div>
      )}

      {/* API Key Error Banner */}
      {apiKeyError && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs font-bold sticky top-0 z-[60] shadow-lg flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          {apiKeyError}
          <button 
            onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
            className="underline hover:text-white/80"
          >
            Configurar en Vercel
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/40 backdrop-blur-md"
          >
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <Calculator className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Calculando Tasación</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nuestra IA está analizando el mercado, normativas urbanas y comparables para entregarte el valor más preciso.
              </p>
              <div className="mt-6 flex gap-1 justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600 w-8 h-8 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-none text-zinc-800">Prop value <span className="text-blue-600 font-normal">Chile</span></h1>
              <div className="flex items-baseline gap-1">
                <span className="text-[7px] md:text-[9px] text-gray-400 uppercase tracking-wider font-light">Herramienta de</span>
                <a 
                  href="https://leroyresidence.cl" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[8px] md:text-[10px] text-gray-400 font-medium tracking-widest hover:text-blue-600 transition-colors"
                >
                  LeRoy Residence
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Calculator className="w-6 h-6" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button 
              onClick={() => setActiveTab('intro')}
              className={`flex flex-col items-center hover:text-blue-600 transition-colors ${activeTab === 'intro' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Inicio</span>
            </button>
            <button 
              onClick={() => setActiveTab('valuation')}
              className={`flex flex-col items-center hover:text-blue-600 transition-colors ${activeTab === 'valuation' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Tasación</span>
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Nuevos Proyectos</span>
              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {projects.length}
              </span>
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Usuario</span>
                  <span className="text-xs font-bold text-slate-800">{user.displayName || user.email}</span>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                )}
                <button 
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                disabled={authActionLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-600/20 disabled:opacity-50"
              >
                {authActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            )}

            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2">
              <span className="text-[10px] text-blue-400 uppercase tracking-tighter">UF Hoy:</span>
              ${ufValue.toLocaleString('es-CL')}
            </div>
            {user && valuation && (
              <button 
                onClick={() => setValuation(null)}
                className="cta-top scale-75 lg:scale-90"
              >
                + Nueva Tasación
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                  <span className="font-semibold">{user.displayName}</span>
                </div>
                <button 
                  onClick={logout} 
                  disabled={authActionLoading}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {authActionLoading ? 'Saliendo...' : 'Salir'}
                </button>
              </div>
            ) : (
              <button 
                onClick={login} 
                disabled={authActionLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {authActionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {authActionLoading ? 'Cargando...' : 'Ingresar'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-4">
                <button 
                  onClick={() => { setActiveTab('intro'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-md ${activeTab === 'intro' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Info className="w-5 h-5" />
                  <span className="font-semibold">Inicio</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('valuation'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-md ${activeTab === 'valuation' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Calculator className="w-5 h-5" />
                  <span className="font-semibold">Tasación</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-md ${activeTab === 'projects' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">Nuevos Proyectos</span>
                  </div>
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {projects.length}
                  </span>
                </button>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-bold text-gray-500 tracking-wider">Valor UF Hoy</span>
                  <span className="text-blue-700 font-bold">${ufValue.toLocaleString('es-CL')}</span>
                </div>
                {user ? (
                  <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      disabled={authActionLoading}
                      className="flex items-center justify-center gap-2 p-3 text-red-600 font-semibold bg-red-50 rounded-md disabled:opacity-50"
                    >
                      <LogOut className="w-5 h-5" />
                      {authActionLoading ? 'Cargando...' : 'Cerrar Sesión'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { login(); setIsMobileMenuOpen(false); }}
                    disabled={authActionLoading}
                    className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white font-semibold rounded-md shadow-lg disabled:opacity-50"
                  >
                    {authActionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {authActionLoading ? 'Cargando...' : 'Ingresar con Google'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'intro' && (
          <LandingPage 
            setActiveTab={setActiveTab}
            marketStats={marketStats}
            loadDemoValuation={loadDemoValuation}
          />
        )}

        {activeTab === 'valuation' && (
          <motion.div
            key="valuation-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {/* Form Section - Full Width */}
            <section id="valuation-form" className="w-full bg-white border-b border-gray-100">
              {user ? (
                <ValuationForm onSubmit={handleValuation} isLoading={isLoading} />
              ) : (
                <div className="max-w-7xl mx-auto px-6 py-12">
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogIn className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Inicia Sesión</h3>
                    <p className="text-gray-600 mb-6 text-sm">Debes ingresar para realizar tasaciones y guardar tu historial.</p>
                    <button onClick={login} className="w-full bg-blue-600 text-white font-semibold py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                      Ingresar con Google
                    </button>
                  </div>
                </div>
              )}
            </section>

            <main className="max-w-7xl mx-auto px-6 py-8">
              <div className="space-y-8">
                {valuation && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-600 text-white p-6 rounded-xl shadow-xl relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-orange-leroy/80 text-sm font-medium tracking-wider">Estimación Prop value</p>
                          <h2 className="text-5xl font-bold mt-1">
                            {valuation.estimated_price_uf.toLocaleString()} <span className="text-2xl font-normal">UF</span>
                          </h2>
                          <p className="text-white mt-1 text-lg">
                            ≈ ${valuation.estimated_price_clp.toLocaleString('es-CL')} CLP
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg text-center min-w-[100px]">
                            <p className="text-xs font-bold">Confianza</p>
                            <p className="text-2xl font-bold">{(valuation.confidence_score * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-6">
                        <div className="flex gap-2 items-start">
                          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed">{valuation.market_context}</p>
                        </div>
                      </div>

                      <div className="flex justify-center mb-6">
                        <button 
                          onClick={() => setShowReport(true)}
                          className="bg-white text-blue-600 px-6 py-1 rounded-md font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Ver Informe Completo
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {valuation.comparables.map((comp, idx) => (
                          <div key={idx} className="bg-white/10 p-3 rounded-md border border-white/10">
                            <p className="text-xs text-white mb-1">{comp.source}</p>
                            <p className="font-bold">{comp.price_uf} UF</p>
                            <p className="text-xs text-white">{comp.m2} m² • {comp.distance_km} km</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-50"></div>
                  </motion.div>
                )}
                
                <div id="market-trends">
                  <MarketTrends />
                </div>
                
                <div className={`grid grid-cols-1 ${user ? 'lg:grid-cols-3' : ''} gap-6`}>
                  <div id="market-map" className={user ? 'lg:col-span-2' : ''}>
                    <MarketMap />
                  </div>

                  {user && (
                    <div id="valuation-history" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-600 w-5 h-5" />
                        Tasaciones Recientes
                      </h2>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No hay registros recientes.</p>
                        ) : (
                          history.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 text-sm">{item.estimated_price_uf.toLocaleString()} UF</p>
                                  <p className="text-[10px] text-gray-500">Confianza: {(item.confidence_score * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-blue-600 font-bold">${(item.estimated_price_clp / 1000000).toFixed(1)}M</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            key="projects-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-6 py-8"
          >
            <div id="projects-list">
              <ProjectList projects={projects} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12 text-center text-slate-500 text-xs">
        <p>© 2026 <span className="font-bold text-zinc-800">Prop value <span className="text-blue-600 font-normal">Chile</span></span>. <a href="https://leroyresidence.cl" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors underline underline-offset-2">LeRoy Residence</a>.</p>
        <p className="mt-1">Datos procesados de SII, CBRS y Portales Inmobiliarios.</p>
      </footer>

      {/* Report Modal - "Hoja Nueva" */}
      <AnimatePresence>
        {showReport && valuation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReport(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <div ref={reportRef} className="p-8 md:p-12 bg-white report-pdf-container">
                {/* Header of the report */}
                <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="text-blue-600 w-8 h-8" />
                      <div className="flex flex-col">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-800">Prop value <span className="text-blue-600 font-normal">Chile</span></h1>
                        <a 
                          href="https://leroyresidence.cl" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-gray-400 font-medium -mt-1 tracking-widest hover:text-blue-600 transition-colors"
                        >
                          LeRoy Residence
                        </a>
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Informe de Tasación Inmobiliaria</h2>
                    <p className="text-slate-500 font-medium">Generado el {new Date().toLocaleDateString('es-CL')}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-md inline-block font-bold mb-2">
                      CONFIDENCIAL
                    </div>
                    <p className="text-xs text-gray-400">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  </div>
                </div>

                {/* Client and Sector Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-b border-gray-50 pb-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Solicitante / Cliente</h4>
                      <p className="text-lg font-bold text-slate-800">{valuation.property_data?.client_name || "Particular"}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Ubicación y Rol</h4>
                      <p className="text-sm text-slate-600 font-medium">
                        {valuation.property_data?.sector ? `${valuation.property_data.sector}, ` : ""}{valuation.property_data?.commune}
                        {valuation.property_data?.zoning_code && ` • Zona: ${valuation.property_data.zoning_code}`}
                      </p>
                      <p className="text-xs text-slate-400">Rol SII: {valuation.property_data?.rol_sii || "No especificado"}</p>
                    </div>
                  </div>
                  {valuation.property_data?.sector_description && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción del Entorno</h4>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        {valuation.property_data?.sector_description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Main Value Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div className="bg-gray-50 p-8 rounded-xl border border-gray-100">
                    <p className="text-sm font-bold text-blue-600 tracking-widest mb-2">Valor Estimado de Mercado</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-gray-900">{valuation.estimated_price_uf.toLocaleString()}</span>
                      <span className="text-2xl font-bold text-gray-400">UF</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-600 mt-2">
                      ${valuation.estimated_price_clp.toLocaleString('es-CL')} CLP
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Basado en {valuation.comparables.length} comparables directos</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 tracking-widest mb-3">Índice de Confianza</h4>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${valuation.confidence_score * 100}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                      <p className="text-right text-sm font-bold mt-1 text-blue-600">{(valuation.confidence_score * 100).toFixed(0)}%</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-800 mb-2">Análisis Técnico de Valoración</h4>
                      <p className="text-sm text-blue-900 leading-relaxed italic">
                        "{valuation.market_context}"
                      </p>
                    </div>

                    {valuation.regulatory_analysis && (
                      <div className={`p-4 rounded-lg border ${valuation.regulatory_analysis.is_consistent ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${valuation.regulatory_analysis.is_consistent ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <h4 className={`text-xs font-bold ${valuation.regulatory_analysis.is_consistent ? 'text-green-800' : 'text-amber-800'}`}>
                            Verificación Normativa (PRC)
                          </h4>
                        </div>
                        <p className={`text-sm leading-relaxed ${valuation.regulatory_analysis.is_consistent ? 'text-green-900' : 'text-amber-900'}`}>
                          {valuation.regulatory_analysis.observations}
                        </p>
                        <div className="mt-2 text-[10px] font-bold opacity-60">
                          Consistencia: {(valuation.regulatory_analysis.compliance_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Technical Normative Details */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Normativa Técnica (PRC)</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                        <div className="text-slate-400">Zona PRC:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.zoning_code || "No especificada"}</div>
                        <div className="text-slate-400">Sup. Predial Mín:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.min_lot_size || "N/A"} m²</div>
                        <div className="text-slate-400">Frente Predial Mín:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.min_frontage || "N/A"} m</div>
                        <div className="text-slate-400">Ocupación Suelo:</div>
                        <div className="text-slate-800 font-bold text-right">{(valuation.property_data?.land_use_coefficient || 0) * 100}%</div>
                        <div className="text-slate-400">Constructibilidad:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.constructability_index || "N/A"}</div>
                        <div className="text-slate-400">Agrupamiento:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.grouping || "N/A"}</div>
                        <div className="text-slate-400">Altura Máxima:</div>
                        <div className="text-slate-800 font-bold text-right">{valuation.property_data?.max_height || "Libre"}</div>
                      </div>
                      {(valuation.property_data?.cip_status || valuation.property_data?.expropriation_status) && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                          {valuation.property_data?.cip_status && <p className="text-[9px] text-amber-600 font-medium">⚠️ CIP: {valuation.property_data.cip_status}</p>}
                          {valuation.property_data?.expropriation_status && <p className="text-[9px] text-amber-600 font-medium">⚠️ Expropiación: {valuation.property_data.expropriation_status}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* New Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {valuation.cabida_informe && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Informe de Cabida
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-500">Pisos Máximos:</span>
                          <span className="font-bold text-slate-800">{valuation.cabida_informe.max_floors}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-500">m² Edificables:</span>
                          <span className="font-bold text-slate-800">{valuation.cabida_informe.max_m2_buildable.toLocaleString()} m²</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed italic mt-2">
                          {valuation.cabida_informe.observations}
                        </p>
                      </div>
                    </div>
                  )}

                  {valuation.restricciones_analisis && (
                    <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                      <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600" />
                        Restricciones
                      </h3>
                      <div className="space-y-2 text-[10px]">
                        <p><span className="font-bold text-amber-800">Riesgo:</span> {valuation.restricciones_analisis.risk_zones}</p>
                        <p><span className="font-bold text-amber-800">Expropiación:</span> {valuation.restricciones_analisis.expropriations}</p>
                        <p><span className="font-bold text-amber-800">Patrimonio:</span> {valuation.restricciones_analisis.heritage_protection}</p>
                        <p className="text-amber-700 italic mt-1 border-t border-amber-100 pt-1">
                          {valuation.restricciones_analisis.observations}
                        </p>
                      </div>
                    </div>
                  )}

                  {valuation.plusvalia_calculo && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                      <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Plusvalía Estimada
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-green-700">Tasa Anual:</span>
                          <span className="font-bold text-green-800">+{valuation.plusvalia_calculo.estimated_annual_appreciation}%</span>
                        </div>
                        <p className="text-[10px] text-green-800 font-medium">
                          {valuation.plusvalia_calculo.future_factors}
                        </p>
                        <p className="text-[10px] text-green-700 leading-relaxed italic border-t border-green-100 pt-1">
                          {valuation.plusvalia_calculo.market_projection}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Analysis Section */}
                {valuation.valuation_type === 'professional' && valuation.professional_analysis && (
                  <div className="space-y-8 mb-12">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                          <TrendingUp className="w-8 h-8 text-blue-400" />
                          Análisis Estratégico Profesional
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-green-400 font-bold text-sm uppercase tracking-widest mb-4">Fortalezas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.strengths.map((s, i) => <li key={i} className="flex gap-2"><span>•</span> {s}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4">Debilidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.weaknesses.map((w, i) => <li key={i} className="flex gap-2"><span>•</span> {w}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Oportunidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.opportunities.map((o, i) => <li key={i} className="flex gap-2"><span>•</span> {o}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">Amenazas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.threats.map((t, i) => <li key={i} className="flex gap-2"><span>•</span> {t}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-600/20 p-8 rounded-2xl border border-blue-500/30">
                          <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Recomendación Final</h4>
                          <p className="text-lg text-white leading-relaxed italic">
                            "{valuation.professional_analysis.final_recommendation}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valuation Breakdown Section */}
                    {valuation.valuation_breakdown && (
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                          <Layout className="w-6 h-6 text-blue-600" />
                          Desglose de Tasación
                        </h3>
                        
                        <div className="space-y-6">
                          {/* Land Breakdown */}
                          <div className="border-b border-gray-100 pb-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-slate-700">1. Terreno</h4>
                              <span className="text-lg font-bold text-blue-600">{formatCurrencyInline(valuation.valuation_breakdown.land.total_uf)}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Superficie</p>
                                <p className="font-medium">{valuation.valuation_breakdown.land.m2} m²</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Valor Unitario</p>
                                <p className="font-medium text-[10px]">{formatCurrencyInline(valuation.valuation_breakdown.land.uf_m2)}/m²</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Factor Forma</p>
                                <p className="font-medium">{valuation.valuation_breakdown.land.form_factor}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Specifications and Municipal Status (Moved to end) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Especificaciones Técnicas
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estructura Muros</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_muros || "No especificado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrepiso</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_entrepiso || "No especificado"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Techumbre</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_techumbre || "No especificado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terminaciones</p>
                          <p className="text-xs text-slate-600">
                            {valuation.property_data?.finishes_walls ? `Muros: ${valuation.property_data.finishes_walls}. ` : ""}
                            {valuation.property_data?.finishes_floors ? `Pisos: ${valuation.property_data.finishes_floors}. ` : ""}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distribución</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          {valuation.property_data?.distribution_description || "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Situación Municipal
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Permiso Edificación</p>
                          <p className="text-sm font-bold text-slate-800">{valuation.property_data?.permit_number || "S/N"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{valuation.property_data?.permit_date || "Fecha no registrada"}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Recepción Final</p>
                          <p className="text-sm font-bold text-slate-800">{valuation.property_data?.reception_number || "S/N"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{valuation.property_data?.reception_date || "Fecha no registrada"}</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Observaciones Legales
                        </p>
                        <p className="text-[10px] text-amber-900 leading-relaxed italic">
                          {valuation.property_data?.cip_status ? `CIP: ${valuation.property_data.cip_status}. ` : ""}
                          {valuation.property_data?.expropriation_status ? `Expropiación: ${valuation.property_data.expropriation_status}. ` : ""}
                          Se recomienda validación en DOM Concepción.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Analysis Section */}
                {valuation.valuation_type === 'professional' && valuation.professional_analysis && (
                  <div className="space-y-8 mb-12">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                          <TrendingUp className="w-8 h-8 text-blue-400" />
                          Análisis Estratégico Profesional
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-green-400 font-bold text-sm uppercase tracking-widest mb-4">Fortalezas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.strengths.map((s, i) => <li key={i} className="flex gap-2"><span>•</span> {s}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4">Debilidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.weaknesses.map((w, i) => <li key={i} className="flex gap-2"><span>•</span> {w}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Oportunidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.opportunities.map((o, i) => <li key={i} className="flex gap-2"><span>•</span> {o}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">Amenazas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {valuation.professional_analysis.swot.threats.map((t, i) => <li key={i} className="flex gap-2"><span>•</span> {t}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-600/20 p-8 rounded-2xl border border-blue-500/30">
                          <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Recomendación Final</h4>
                          <p className="text-lg text-white leading-relaxed italic">
                            "{valuation.professional_analysis.final_recommendation}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valuation Breakdown Section */}
                    {valuation.valuation_breakdown && (
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                          <Layout className="w-6 h-6 text-blue-600" />
                          Desglose de Tasación
                        </h3>
                        
                        <div className="space-y-6">
                          {/* Land Breakdown */}
                          <div className="border-b border-gray-100 pb-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-slate-700">1. Terreno</h4>
                              {formatCurrency(valuation.valuation_breakdown.land.total_uf)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Superficie</p>
                                <p className="font-medium">{valuation.valuation_breakdown.land.m2} m²</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Valor Unitario</p>
                                <p className="font-medium">{valuation.valuation_breakdown.land.uf_m2} UF/m²</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Descripción</p>
                                <p className="font-medium text-xs">{valuation.valuation_breakdown.land.description}</p>
                              </div>
                            </div>
                          </div>

                          {/* Buildings Breakdown */}
                          <div className="border-b border-gray-100 pb-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-slate-700">2. Construcciones</h4>
                              {formatCurrency(valuation.valuation_breakdown.buildings.total_uf)}
                            </div>
                            <div className="space-y-3 mb-4">
                              {valuation.valuation_breakdown.buildings.details.map((detail, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                  <span className="text-slate-700 font-medium">{detail.description}</span>
                                  <div className="flex gap-6 text-slate-500 text-right">
                                    <span>{detail.m2} m²</span>
                                    <span>{detail.uf_m2} UF/m²</span>
                                    <span className="font-bold text-slate-800">{formatCurrencyInline(detail.total_uf)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end text-xs text-slate-500 gap-4">
                              <span>Total Construido: {valuation.valuation_breakdown.buildings.m2} m²</span>
                              <span>Promedio: {formatCurrencyInline(valuation.valuation_breakdown.buildings.uf_m2_avg)}/m²</span>
                            </div>
                          </div>

                          {/* Complementary Works */}
                          {valuation.valuation_breakdown.complementary_works.total_uf > 0 && (
                            <div className="border-b border-gray-100 pb-6">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-700">3. Obras Complementarias</h4>
                                {formatCurrency(valuation.valuation_breakdown.complementary_works.total_uf)}
                              </div>
                              <p className="text-sm text-slate-600">{valuation.valuation_breakdown.complementary_works.description}</p>
                            </div>
                          )}

                          {/* Total Summary */}
                          <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                            <div>
                              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Valor Total de Tasación</p>
                              <p className="text-sm text-slate-400">Suma de Terreno + Construcciones + Obras</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold">{formatCurrencyInline(valuation.valuation_breakdown.total_uf)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professional Comparables */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Comparables de Mercado (Detallado)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {valuation.professional_analysis.comparables.map((comp, idx) => (
                          <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Comparable #{idx + 1}</p>
                            <p className="font-bold text-slate-800 mb-3 truncate">{comp.address}</p>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-sm text-slate-600">Precio:</span>
                              <span className="text-lg font-bold text-blue-600">{comp.price_uf.toLocaleString()} UF</span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs text-slate-500">
                              <span>Superficie:</span>
                              <span>{comp.m2} m²</span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs text-slate-500">
                              <span>Distancia:</span>
                              <span>{comp.distance_km} km</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparables Table (Only for Basic or as fallback) */}
                {(!valuation.valuation_type || valuation.valuation_type === 'basic') && valuation.comparables && (
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      Análisis de Comparables
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-slate-500 text-xs font-bold">
                          <tr>
                            <th className="px-6 py-4">Fuente / Ubicación</th>
                            <th className="px-6 py-4 text-right">Precio (UF)</th>
                            <th className="px-6 py-4 text-right">Superficie (m²)</th>
                            <th className="px-6 py-4 text-right">Distancia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {valuation.comparables.map((comp, idx) => (
                            <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">{comp.source}</td>
                              <td className="px-6 py-4 text-right font-bold text-blue-600">{comp.price_uf.toLocaleString()} UF</td>
                              <td className="px-6 py-4 text-right">{comp.m2} m²</td>
                              <td className="px-6 py-4 text-right text-slate-500">{comp.distance_km} km</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer / Disclaimer */}
                <div className="pt-8 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed">
                  <p className="mb-2 font-bold">Aviso Legal:</p>
                  <p>
                    Este informe es una estimación generada mediante modelos de inteligencia artificial y análisis de datos masivos (Big Data). 
                    No constituye una tasación bancaria oficial ni legal. Los valores pueden variar según condiciones específicas del inmueble 
                    no detectadas por el modelo. Se recomienda la validación por un tasador certificado para operaciones financieras críticas.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center sticky bottom-0 z-20">
                <button 
                  onClick={() => setShowReport(false)}
                  className="text-gray-500 font-semibold hover:text-gray-700 transition-colors"
                >
                  Cerrar Vista
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-md font-semibold hover:bg-slate-50 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    Imprimir
                  </button>
                  <button 
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {isDownloading ? "Procesando..." : "Descargar PDF"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
