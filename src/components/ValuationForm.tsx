import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PropertyData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Loader2, X } from 'lucide-react';
import { getRegulatoryData } from '../services/geminiService.ts';

const schema = z.object({
  valuation_type: z.enum(['basic', 'professional']),
  property_type: z.enum(['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro']),
  rol_sii: z.string().optional(),
  rol_manzana: z.string().optional(),
  rol_predio: z.string().optional(),
  avaluo_fiscal: z.number().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  commune: z.string().min(1, "La comuna es requerida"),
  sector: z.string().optional(),
  zoning_code: z.string().optional(),
  property_usage: z.enum(['Habitacional', 'Comercial', 'Agrícola', 'Esparcimiento o Cultura']).optional(),
  m2_useful: z.number().min(0).optional().default(0),
  m2_total: z.number().min(1, "M2 totales requeridos"),
  bedrooms: z.number().min(0).optional().default(0),
  bathrooms: z.number().min(0).optional().default(0),
  parking: z.number().min(0).optional().default(0),
  storage: z.number().min(0).optional().default(0),
  year_built: z.number().min(1900).max(2026).optional(),
  floors: z.number().min(0).optional(),
  project_status: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  sustainability_features: z.array(z.string()).optional(),
  topography: z.enum(['Plano', 'Pendiente Suave', 'Pendiente Fuerte']).optional(),
  frontage_m: z.number().min(0).optional(),
  max_height: z.number().min(0).optional(),
  constructability_index: z.number().min(0).optional(),
  land_use_coefficient: z.number().min(0).optional(),
  // New Factors
  conservation_state: z.enum(['Excelente', 'Bueno', 'Regular', 'Malo']).optional(),
  construction_quality: z.enum(['Superior', 'Media', 'Económica']).optional(),
  proximity_to_metro: z.boolean().optional(),
  proximity_to_services: z.array(z.string()).optional(),
  view_quality: z.enum(['Despejada', 'Parcial', 'Obstruida']).optional(),
  security_level: z.enum(['Alta', 'Media', 'Baja']).optional(),
  noise_level: z.enum(['Silencioso', 'Moderado', 'Ruidoso']).optional(),
  // Rural/Agricultural specific fields
  num_lots: z.number().min(1).optional(),
  water_availability: z.enum(['Abundante', 'Suficiente', 'Escasa']).optional(),
  electricity_system: z.enum(['Público', 'Privado', 'Generador']).optional(),
  materiality_walls: z.string().optional(),
  materiality_roof: z.string().optional(),
  heating_system: z.string().optional(),
  complementary_works: z.array(z.string()).optional(),
  notes: z.string().optional(),
  advantages: z.string().optional(),
  disadvantages: z.string().optional(),
  client_name: z.string().optional(),
  sector_description: z.string().optional(),
  min_lot_size: z.number().min(0).optional(),
  min_frontage: z.number().min(0).optional(),
  density: z.string().optional(),
  setback: z.string().optional(),
  grouping: z.enum(['Continuo', 'Aislado', 'Pareado']).optional(),
  cip_status: z.string().optional(),
  expropriation_status: z.string().optional(),
  parking_quota: z.string().optional(),
  recent_amendments: z.string().optional(),
  occupancy_calculation: z.string().optional(),
  constructability_calculation: z.string().optional(),
  height_by_surface: z.string().optional(),
  allowed_buildable_surface: z.string().optional(),
  is_corner: z.boolean().optional(),
  access_description: z.string().optional(),
  distribution_description: z.string().optional(),
  structure_muros: z.string().optional(),
  structure_entrepiso: z.string().optional(),
  structure_escalera: z.string().optional(),
  structure_techumbre: z.string().optional(),
  structure_cubierta: z.string().optional(),
  finishes_walls: z.string().optional(),
  finishes_floors: z.string().optional(),
  finishes_ceilings: z.string().optional(),
  sanitary_artifacts: z.string().optional(),
  land_shape: z.string().optional(),
  land_topography: z.string().optional(),
  front_depth_ratio: z.string().optional(),
  permit_number: z.string().optional(),
  permit_date: z.string().optional(),
  reception_number: z.string().optional(),
  reception_date: z.string().optional(),
});

interface Props {
  onSubmit: (data: PropertyData) => void;
  isLoading: boolean;
}

const propertyTypes = ['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro'];
const topographyOptions = ['Plano', 'Pendiente Suave', 'Pendiente Fuerte'];
const conservationOptions = ['Excelente', 'Bueno', 'Regular', 'Malo'];
const qualityOptions = ['Superior', 'Media', 'Económica'];
const viewOptions = ['Despejada', 'Parcial', 'Obstruida'];
const securityOptions = ['Alta', 'Media', 'Baja'];
const noiseOptions = ['Silencioso', 'Moderado', 'Ruidoso'];
const usageOptions = ['Habitacional', 'Comercial', 'Agrícola', 'Esparcimiento o Cultura'];
const waterOptions = ['Abundante', 'Suficiente', 'Escasa'];
const electricityOptions = ['Público', 'Privado', 'Generador'];
const complementaryOptions = ["Piscina de Hormigón", "Bodegas", "Cierros Perimetrales", "Pozo Profundo", "Galpón"];
const serviceOptions = ["Metro", "Transporte Público", "Colegios", "Hospitales", "Comercio", "Parques", "Seguridad"];

const communes = [
  "Las Condes", "Providencia", "Santiago", "Ñuñoa", "Vitacura", "Lo Barnechea", 
  "La Reina", "Macul", "San Miguel", "La Florida", "Maipú", "Puente Alto",
  "Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Hualpén"
];

const amenityOptions = ["Piscina", "Quincho", "Gimnasio", "Lavandería", "Sala Multiuso", "Bicicletero"];
const sustainabilityOptions = ["Paneles Solares", "Aislación Térmica", "Reciclaje", "Ventanas Termopanel"];

export const ValuationForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PropertyData>({
    resolver: zodResolver(schema),
    defaultValues: {
      valuation_type: 'basic',
      property_type: 'Departamento',
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      storage: 1,
      m2_useful: 50,
      m2_total: 60,
      amenities: [],
      sustainability_features: [],
      proximity_to_services: [],
      proximity_to_metro: false,
      conservation_state: 'Bueno',
      construction_quality: 'Media',
      view_quality: 'Parcial',
      security_level: 'Media',
      noise_level: 'Moderado'
    }
  });

  const selectedAmenities = watch("amenities") || [];
  const selectedSustainability = watch("sustainability_features") || [];
  const selectedServices = watch("proximity_to_services") || [];
  const selectedComplementary = watch("complementary_works") || [];
  const selectedUsage = watch("property_usage");
  const propertyType = watch("property_type");
  const isPremium = watch("valuation_type") === 'professional';


  const [usageSearch, setUsageSearch] = React.useState("");
  const [showUsageOptions, setShowUsageOptions] = React.useState(false);
  const [isFetchingNorms, setIsFetchingNorms] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const commune = watch("commune");
  const sector = watch("sector");
  const rol = watch("rol_sii");
  const rolManzana = watch("rol_manzana");
  const rolPredio = watch("rol_predio");
  const street = watch("address_street");
  const number = watch("address_number");

  // Sync rol_sii with manzana and predio
  React.useEffect(() => {
    if (rolManzana || rolPredio) {
      setValue("rol_sii", `${rolManzana || ""}-${rolPredio || ""}`);
    }
  }, [rolManzana, rolPredio, setValue]);

  const handleFetchNorms = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) ||
                   (window as any).process?.env?.GEMINI_API_KEY;

    if (!apiKey || apiKey === "undefined") {
      setFetchError("Error: No se ha configurado la clave de API de Gemini. Si estás en Vercel, agrégala como VITE_GEMINI_API_KEY y haz un 'Redeploy'.");
      return;
    }

    if (!commune) {
      setFetchError("Por favor, selecciona una comuna primero.");
      return;
    }
    
    setIsFetchingNorms(true);
    setFetchError(null);
    try {
      const currentZoningCode = watch("zoning_code");
      const m2Total = watch("m2_total");
      const isCorner = watch("is_corner");
      const data = await getRegulatoryData(commune, sector || "", rol || "", street || "", number || "", rolManzana, rolPredio, currentZoningCode, m2Total, isCorner);
      if (!data) throw new Error("No se recibieron datos de la IA.");
      
      setValue("zoning_code", data.zoning_code);
      setValue("max_height", data.max_height);
      setValue("constructability_index", data.constructability_index);
      setValue("land_use_coefficient", data.land_use_coefficient);
      setValue("setback", data.setback);
      setValue("property_usage", data.property_usage as any);
      setValue("parking_quota", data.parking_quota);
      setValue("recent_amendments", data.recent_amendments);
      setValue("occupancy_calculation", data.occupancy_calculation);
      setValue("constructability_calculation", data.constructability_calculation);
      setValue("height_by_surface", data.height_by_surface);
      setValue("allowed_buildable_surface", data.allowed_buildable_surface);
      setUsageSearch(data.property_usage);
    } catch (error: any) {
      console.error("Error fetching norms:", error);
      const errorMessage = error?.message || "Error desconocido";
      setFetchError(`No se pudo obtener la normativa automáticamente: ${errorMessage}.`);
    } finally {
      setIsFetchingNorms(false);
    }
  };

  const filteredUsageOptions = usageOptions.filter(opt => 
    opt.toLowerCase().includes(usageSearch.toLowerCase())
  );

  if (Object.keys(errors).length > 0) {
    const errorMessages = Object.entries(errors).map(([field, err]) => `${field}: ${err?.message}`);
    console.log("ValuationForm validation errors:", errorMessages);
  }

  // Reset fields when property type changes to Sitio Eriazo or Agrícola
  React.useEffect(() => {
    if (propertyType === 'Sitio Eriazo' || propertyType === 'Agrícola / Parcela') {
      if (propertyType === 'Sitio Eriazo') {
        setValue("m2_useful", 0);
        setValue("bedrooms", 0);
        setValue("bathrooms", 0);
        setValue("parking", 0);
        setValue("storage", 0);
        setValue("floors", 0);
      }
    } else if (propertyType === 'Departamento' || propertyType === 'Casa') {
      // Restore some defaults if they were 0
      if (watch("m2_useful") === 0) setValue("m2_useful", 50);
      if (watch("bedrooms") === 0) setValue("bedrooms", 2);
      if (watch("bathrooms") === 0) setValue("bathrooms", 2);
    }
  }, [propertyType, setValue, watch]);

  const toggleOption = (field: "amenities" | "sustainability_features" | "proximity_to_services" | "complementary_works", value: string) => {
    const current = watch(field) || [];
    const updated = current.includes(value) 
      ? current.filter(v => v !== value)
      : [...current, value];
    setValue(field, updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-blue-600 py-0.5 md:py-1 px-4 md:px-6 mb-4 w-full shadow-lg shadow-blue-600/10">
        <h2 className="text-lg md:text-xl font-bold text-white text-center tracking-wider">Detalles de la Propiedad</h2>
      </div>
      
      <form 
        onSubmit={handleSubmit((data) => {
          const hasTransport = data.proximity_to_services?.some(s => s === "Metro" || s === "Transporte Público");
          const updatedData = { ...data, proximity_to_metro: hasTransport };
          console.log("Form data validated and submitting:", updatedData);
          onSubmit(updatedData);
        }, (errors) => {
          const errorMessages = Object.entries(errors).map(([field, err]) => `${field}: ${err?.message}`);
          console.error("Form validation failed:", errorMessages);
        })}
        className="max-w-7xl mx-auto px-4 md:px-6 pb-12 space-y-8"
      >
        {/* Valuation Type Selection */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <label className="text-lg font-bold text-slate-800 uppercase tracking-widest">Tipo de Tasación</label>
            <button
              type="button"
              onClick={() => {
                setValue('valuation_type', 'professional');
                setValue('client_name', 'SOCIEDAD DE INVERSIONES CHILE SPA');
                setValue('property_type', 'Local Comercial');
                setValue('commune', 'Concepción');
                setValue('address_street', 'Aníbal Pinto');
                setValue('address_number', '343');
                setValue('sector', 'Centro / Plaza de Armas (Local 29)');
                setValue('rol_manzana', '136');
                setValue('rol_predio', '126');
                setValue('rol_sii', '136-126');
                setValue('avaluo_fiscal', 676887653);
                setValue('m2_total', 959);
                setValue('m2_useful', 385.6);
                setValue('property_usage', 'Comercial');
                setValue('conservation_state', 'Regular');
                setValue('construction_quality', 'Media');
                setValue('security_level', 'Alta');
                setValue('noise_level', 'Moderado');
                setValue('view_quality', 'Despejada');
                setValue('zoning_code', 'CPH (Centro y Plazas Históricas)');
                setValue('max_height', 11);
                setValue('constructability_index', 5.0);
                setValue('land_use_coefficient', 0.6);
                setValue('min_lot_size', 350);
                setValue('min_frontage', 15);
                setValue('density', "Libre / No aplica");
                setValue('setback', "No aplica");
                setValue('grouping', "Continuo");
                setValue('cip_status', "Sin antecedentes (Solicitar CIP)");
                setValue('expropriation_status', "No se aportó información (Solicitar respaldo)");
                setValue('access_description', "Se produce en ángulo recto a través de los dos accesos de la galería: calles Aníbal Pinto y San Martín, principales vías del centro.");
                setValue('distribution_description', "1° Nivel: Plantas libres, hall de acceso, baños público, sala principal con escenario. 2° Nivel: Bodega, 2 oficinas, baño y sala de proyección.");
                setValue('structure_muros', "Hormigón Armado y Albañilería Reforzada");
                setValue('structure_entrepiso', "Hormigón Armado");
                setValue('structure_escalera', "Hormigón Armado");
                setValue('structure_techumbre', "Planchas de acero zincado");
                setValue('structure_cubierta', "Acero Zincado");
                setValue('finishes_walls', "Pintura sobre estuco y enlucido");
                setValue('finishes_floors', "Porcelanato y Cerámicos");
                setValue('finishes_ceilings', "Enlucido");
                setValue('sanitary_artifacts', "Enlozados de color blanco");
                setValue('land_shape', "Irregular");
                setValue('land_topography', "Plana");
                setValue('front_depth_ratio', "1:4");
                setValue('permit_number', "20/01/1962");
                setValue('permit_date', "1962-01-20");
                setValue('reception_number', "170");
                setValue('reception_date', "1962-10-25");
                setValue('year_built', 1961);
                setValue('proximity_to_services', ["Metro", "Transporte Público", "Colegios", "Comercio", "Seguridad"]);
                setValue('sector_description', "Barrio centro en torno al Centro Metropolitano. Tipología CPH. Sector de densidad alta, consolidado y equipado a excelente nivel, destinado a nivel socioeconómico medio-alto y con predominio comercial y/o de servicios. Urbanización completa de alta calidad (hormigón).");
                setValue('notes', "Se considera a la propiedad como subutilizada, pudiendo aprovechar su amplia superficie a tan poca distancia de la Plaza de Armas para generar un destino comercial más potente y renovado. Sustentación: Método de comparación de mercado con descuento por negociación. Usos Permitidos: Residencial, Equipamiento (Comercio, Culto, Cultura, Deporte, Educación, Esparcimiento, Salud, Seguridad, Servicios y Social).");
                setValue('advantages', "Buen emplazamiento, centro comercial y financiero. Versatilidad de usos. Alta demanda y rotación de arriendos. Entorno privilegiado. Doble acceso (San Martín y Aníbal Pinto).");
                setValue('disadvantages', "Mal estado general de mantención. Alta inversión requerida para renovación por la magnitud del bien.");
              }}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors border border-blue-200"
            >
              Cargar Ejemplo Real (Concepción)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${watch('valuation_type') === 'basic' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:border-blue-200'}`}>
              <input type="radio" value="basic" {...register('valuation_type')} className="sr-only" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Tasación Básica</span>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Gratis</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Estimación rápida basada en mercado y plusvalía. Ideal para una referencia inicial.</p>
            </label>
            <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${watch('valuation_type') === 'professional' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:border-blue-200'}`}>
              <input type="radio" value="professional" {...register('valuation_type')} className="sr-only" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Tasación Profesional</span>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Premium</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Análisis FODA detallado, comparables específicos y recomendación estratégica de inversión.</p>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Nombre del Cliente / Propietario</label>
            <input 
              {...register('client_name')}
              placeholder="Ej: Sociedad de Inversiones Chile SpA"
              className="w-full p-1.5 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Tipo de Propiedad</label>
            <select 
              {...register("property_type")}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.property_type ? 'border-red-500' : 'border-gray-200'}`}
            >
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.property_type && <p className="text-xs text-red-500">{errors.property_type.message}</p>}
          </div>

          {propertyType === 'Agrícola / Parcela' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">N° de Lotes</label>
              <input 
                type="number" 
                {...register("num_lots", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Rol SII (Manzana)</label>
          <input 
            type="text" 
            placeholder="Ej: 1234"
            {...register("rol_manzana")}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Rol SII (Predio)</label>
          <input 
            type="text" 
            placeholder="Ej: 56"
            {...register("rol_predio")}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Avalúo Fiscal</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Ej: 150000000"
              {...register("avaluo_fiscal", { valueAsNumber: true })}
              className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="button"
              onClick={() => window.open('https://www.sii.cl/servicios_online/1040-1041.html', '_blank')}
              className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Consultar SII
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Dirección (Calle / Avenida)</label>
          <input 
            type="text" 
            placeholder="Ej: Av. O'Higgins"
            {...register("address_street")}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Número</label>
          <input 
            type="text" 
            placeholder="Ej: 123"
            {...register("address_number")}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Sector / Barrio</label>
          <input 
            type="text" 
            placeholder="Ej: Andalué, El Golf"
            {...register("sector")}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Comuna <span className="text-red-500">*</span></label>
          <select 
            {...register("commune")}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Seleccionar comuna</option>
            {communes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.commune && <p className="text-xs text-red-500">{errors.commune.message}</p>}
        </div>
      </div>

      {/* Contenedor 1: Normativa y Superficies */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Normativa y Superficies
            </h3>
            <p className="text-[10px] text-gray-500 font-medium ml-6">Consulta automática basada en ROL y Dirección en cualquier comuna de Chile.</p>
          </div>
          <button
            type="button"
            onClick={handleFetchNorms}
            disabled={isFetchingNorms || !commune}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              isFetchingNorms 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-600/20 active:scale-95'
            }`}
          >
            <span className="flex items-center gap-2">
              {isFetchingNorms ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isFetchingNorms ? "Consultando PRC..." : "Consultar Normativa Automática"}
            </span>
          </button>
        </div>
        
        <AnimatePresence>
          {fetchError && (
            <motion.div 
              key="fetch-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                <Info className="w-4 h-4" />
                {fetchError}
              </div>
              <button 
                type="button"
                onClick={() => setFetchError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 items-start">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              Zona PRC
              <Info className="w-3 h-3 text-blue-400" />
            </label>
            <input 
              type="text" 
              placeholder="Ej: ZH-1"
              {...register("zoning_code")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-600">Destino</label>
            <input 
              type="text"
              placeholder="Buscar..."
              value={usageSearch || selectedUsage || ""}
              onChange={(e) => {
                setUsageSearch(e.target.value);
                setShowUsageOptions(true);
                const match = usageOptions.find(o => o.toLowerCase() === e.target.value.toLowerCase());
                if (match) setValue("property_usage", match as any);
              }}
              onFocus={() => setShowUsageOptions(true)}
              onBlur={() => setTimeout(() => setShowUsageOptions(false), 200)}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <AnimatePresence>
              {showUsageOptions && (
                <motion.div 
                  key="usage-options"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                >
                  {filteredUsageOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setValue("property_usage", opt as any);
                        setUsageSearch(opt);
                        setShowUsageOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Altura Máx</label>
            <input 
              type="number" 
              step="0.1"
              placeholder="Ej: 15"
              {...register("max_height", { valueAsNumber: true })}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Coef. Const.</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Ej: 2.5"
              {...register("constructability_index", { valueAsNumber: true })}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Coef. Uso Suelo</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Ej: 0.6"
              {...register("land_use_coefficient", { valueAsNumber: true })}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {propertyType !== 'Sitio Eriazo' && (
            <div key="m2-useful-field" className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                {propertyType === 'Departamento' ? 'M2 Útiles' : 'M2 Const.'}
              </label>
              <input 
                type="number" 
                {...register("m2_useful", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.m2_useful ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.m2_useful && <p className="text-[10px] text-red-500">{errors.m2_useful.message}</p>}
            </div>
          )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            {propertyType === 'Departamento' ? 'M2 Totales' : 'M2 Terreno'} <span className="text-red-500">*</span>
          </label>
          <input 
            type="number" 
            {...register("m2_total", { valueAsNumber: true })}
            className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.m2_total ? 'border-red-500' : 'border-gray-200'}`}
          />
          {errors.m2_total && <p className="text-[10px] text-red-500">{errors.m2_total.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-4 pt-4 border-t border-gray-50">
        <div className="space-y-1">
          <label className="text-sm font-bold text-orange-800">Esquina</label>
          <div className="flex items-center h-10">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                {...register("is_corner")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-600">¿Es esquina?</span>
            </label>
          </div>
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-sm font-bold text-blue-800">Altura máxima según superficie</label>
          <input 
            type="text" 
            placeholder="Ej: 5 pisos (Ajustado por superficie y ubicación)"
            {...register("height_by_surface")}
            className="w-full p-2 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold text-green-800">Superficie permitida</label>
          <input 
            type="text" 
            placeholder="Ej: 1.500 m2"
            {...register("allowed_buildable_surface")}
            className="w-full p-2 border border-green-100 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm bg-green-50/30"
          />
        </div>
      </div>
    </div>

      {/* Contenedor 2: Edificación y Atributos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 items-start">
          {propertyType !== 'Sitio Eriazo' && (
            <React.Fragment key="building-basic-fields">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Pisos Edif.</label>
                <input 
                  type="number" 
                  {...register("floors", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <select 
                  {...register("project_status")}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="En Venta">En Venta</option>
                  <option value="En Verde">En Verde</option>
                  <option value="Entrega Inmediata">Entrega</option>
                </select>
              </div>
            </React.Fragment>
          )}

          {propertyType === 'Sitio Eriazo' ? (
            <React.Fragment key="land-specific-fields">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Topografía</label>
                <select 
                  {...register("topography")}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
                >
                  {topographyOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Frente (m)</label>
                <input 
                  type="number" 
                  {...register("frontage_m", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
                />
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment key="building-amenities-fields">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Dorm.</label>
                <select 
                  {...register("bedrooms", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <option key={val} value={val}>{val === 10 ? '10+' : val}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Baños</label>
                <select 
                  {...register("bathrooms", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <option key={val} value={val}>{val === 10 ? '10+' : val}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Estac.</label>
                <select 
                  {...register("parking", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <option key={val} value={val}>{val === 10 ? '10+' : val}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Bod.</label>
                <select 
                  {...register("storage", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <option key={val} value={val}>{val === 10 ? '10+' : val}</option>
                  ))}
                </select>
              </div>
            </React.Fragment>
          )}
        </div>

      {/* Factores de Valoración Section */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Factores de Valoración
        </h3>
        <p className="text-xs text-gray-500 italic">Parámetros técnicos estandarizados para evaluar el estado y calidad de la propiedad.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Estado de Conservación</label>
            <select 
              {...register("conservation_state")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none"
            >
              {conservationOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Calidad de Construcción</label>
            <select 
              {...register("construction_quality")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none"
            >
              {qualityOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Vista</label>
            <select 
              {...register("view_quality")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none"
            >
              {viewOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Seguridad del Sector</label>
            <select 
              {...register("security_level")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none"
            >
              {securityOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Nivel de Ruido</label>
            <select 
              {...register("noise_level")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none"
            >
              {noiseOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Rural Specific Section */}
        {propertyType === 'Agrícola / Parcela' && (
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              Características Rurales / Agrícolas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Disponibilidad de Agua</label>
                <select 
                  {...register("water_availability")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {waterOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Sistema Eléctrico</label>
                <select 
                  {...register("electricity_system")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {electricityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Sistema de Calefacción</label>
                <input 
                  type="text" 
                  placeholder="Ej: Combustión Lenta"
                  {...register("heating_system")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Materialidad Muros</label>
                <input 
                  type="text" 
                  placeholder="Ej: Albañilería y Madera"
                  {...register("materiality_walls")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Materialidad Techumbre</label>
                <input 
                  type="text" 
                  placeholder="Ej: Madera y Fibrocemento"
                  {...register("materiality_roof")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-green-800">Obras Complementarias</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {complementaryOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption("complementary_works", opt)}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all border ${
                      selectedComplementary.includes(opt) 
                        ? 'bg-green-600 text-white border-green-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-green-200 hover:border-green-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 tracking-wider">Servicios Cercanos</label>
                <p className="text-[10px] text-slate-500 italic font-medium opacity-70">Equipamiento urbano a menos de 15 min.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {serviceOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption("proximity_to_services", opt)}
                    className={`px-3 py-2 rounded-md text-xs font-semibold transition-all border ${
                      selectedServices.includes(opt) 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 tracking-wider">Amenidades</label>
                <p className="text-[10px] text-slate-500 italic font-medium opacity-70">Espacios comunes y extras del edificio/casa.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {amenityOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption("amenities", opt)}
                    className={`px-3 py-2 rounded-md text-xs font-semibold transition-all border ${
                      selectedAmenities.includes(opt) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 tracking-wider">Sostenibilidad</label>
                <p className="text-[10px] text-slate-500 italic font-medium opacity-70">Eficiencia energética y cuidado ambiental.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sustainabilityOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption("sustainability_features", opt)}
                    className={`px-3 py-2 rounded-md text-xs font-semibold transition-all border ${
                      selectedSustainability.includes(opt) 
                        ? 'bg-green-600 text-white border-green-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
      </div>

      {/* Normativa Section */}
      {isPremium && (
        <div key="premium-normative-section" className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Normativa y Urbanismo (PRC)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Sup. Predial Mínima (m²)</label>
                <input type="number" {...register('min_lot_size', { valueAsNumber: true })} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Frente Predial Mínimo (m)</label>
                <input type="number" {...register('min_frontage', { valueAsNumber: true })} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Densidad Bruta</label>
                <input type="text" {...register('density')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Antejardín</label>
                <input type="text" {...register('setback')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Agrupamiento</label>
                <select {...register('grouping')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="Continuo">Continuo</option>
                  <option value="Aislado">Aislado</option>
                  <option value="Pareado">Pareado</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Estado del CIP</label>
                <input type="text" {...register('cip_status')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Estado de Expropiación</label>
                <input type="text" {...register('expropriation_status')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Cuotas Estacionamiento</label>
                <input type="text" {...register('parking_quota')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-blue-50 pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Cálculo Ocupación de Suelo (OGUC/PRC)</label>
                  <textarea 
                    {...register('occupancy_calculation')} 
                    className="w-full bg-transparent text-xs text-blue-900 border-none focus:ring-0 p-0 resize-none h-12"
                    placeholder="Cálculo automático de ocupación..."
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <label className="block text-[10px] font-bold text-green-800 uppercase mb-1">Cálculo Constructibilidad Máxima</label>
                  <textarea 
                    {...register('constructability_calculation')} 
                    className="w-full bg-transparent text-xs text-green-900 border-none focus:ring-0 p-0 resize-none h-12"
                    placeholder="Cálculo automático de constructibilidad..."
                  />
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <label className="block text-[10px] font-bold text-purple-800 uppercase mb-1">Modificaciones y Enmiendas Recientes (2024-2025)</label>
                <textarea 
                  {...register('recent_amendments')} 
                  className="w-full bg-transparent text-xs text-purple-900 border-none focus:ring-0 p-0 resize-none h-28"
                  placeholder="Información sobre enmiendas recientes..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Specifications Section */}
      {isPremium && (
        <div key="premium-technical-section" className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Especificaciones Técnicas y Estructura</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Muros / Estructura</label>
                    <input type="text" {...register('structure_muros')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Entrepiso</label>
                    <input type="text" {...register('structure_entrepiso')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Escaleras</label>
                    <input type="text" {...register('structure_escalera')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Techumbre / Cubierta</label>
                    <input type="text" {...register('structure_techumbre')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Terminaciones (Muros/Pisos/Cielos)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" {...register('finishes_walls')} placeholder="Muros" className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                    <input type="text" {...register('finishes_floors')} placeholder="Pisos" className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                    <input type="text" {...register('finishes_ceilings')} placeholder="Cielos" className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Forma Terreno</label>
                    <input type="text" {...register('land_shape')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Topografía</label>
                    <input type="text" {...register('land_topography')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Relación Frente/Fondo</label>
                    <input type="text" {...register('front_depth_ratio')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Artefactos Sanitarios</label>
                    <input type="text" {...register('sanitary_artifacts')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Distribución (Resumen)</label>
                  <textarea {...register('distribution_description')} className="w-full h-20 p-2 rounded-md border border-gray-200 text-xs resize-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Municipal Status Section */}
      {isPremium && (
        <div key="premium-municipal-section" className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <label className="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Situación Municipal y Permisos</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">N° Permiso Edificación</label>
                <input type="text" {...register('permit_number')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Fecha Permiso</label>
                <input type="date" {...register('permit_date')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">N° Recepción Final</label>
                <input type="text" {...register('reception_number')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Fecha Recepción</label>
                <input type="date" {...register('reception_date')} className="w-full p-1.5 rounded-md border border-gray-200 text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-sm">
          <label className="block text-sm font-bold text-green-800 mb-2 uppercase tracking-widest">Ventajas (Fortalezas)</label>
          <textarea 
            {...register('advantages')}
            placeholder="Ej: Ubicación privilegiada, doble acceso, alta demanda..."
            className="w-full h-24 p-4 rounded-xl border-2 border-gray-100 focus:border-green-600 focus:ring-0 transition-all text-sm resize-none"
          />
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm">
          <label className="block text-sm font-bold text-red-800 mb-2 uppercase tracking-widest">Desventajas (Debilidades)</label>
          <textarea 
            {...register('disadvantages')}
            placeholder="Ej: Mal estado de conservación, alta inversión requerida..."
            className="w-full h-24 p-4 rounded-xl border-2 border-gray-100 focus:border-red-600 focus:ring-0 transition-all text-sm resize-none"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
          <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-widest">Descripción del Sector / Entorno</label>
          <textarea 
            {...register('sector_description')}
            placeholder="Ej: Barrio centro consolidado, tipología CPH, densidad alta, nivel socioeconómico medio-alto..."
            className="w-full h-32 p-4 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all text-sm resize-none"
          />
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
          <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-widest">Notas Adicionales / Observaciones</label>
          <textarea 
            {...register('notes')}
            placeholder="Ej: Propiedad subutilizada, potencial de desarrollo comercial, cercanía a hitos urbanos, etc."
            className="w-full h-32 p-4 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all text-sm resize-none"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-4">
        {Object.keys(errors).length > 0 && (
          <div key="validation-errors-alert" className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <p className="text-sm text-red-600 font-bold">Por favor, revisa los campos marcados en rojo. Faltan datos obligatorios.</p>
          </div>
        )}
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded-md transition-all shadow-lg shadow-blue-600/20 disabled:bg-blue-300 text-lg tracking-widest"
        >
          {isLoading ? "Calculando..." : "Obtener Tasación"}
        </button>
        <div className="text-center">
          <button 
            type="button"
            onClick={() => window.location.reload()} 
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Limpiar Formulario
          </button>
        </div>
      </div>
    </form>
    </motion.div>
  );
};
