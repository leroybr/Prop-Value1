import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PropertyData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Loader2, X, Calculator, MapPin, ExternalLink, FileText, Building2, ShieldAlert, Scale, User, Home, Search } from 'lucide-react';
import { PRCViewerModal } from './PRCViewerModal';
import { getRegulatoryData } from '../services/geminiService';

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().optional());

const requiredNumber = (msg: string) => z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().min(1, msg));

const optionalEnum = <T extends string>(values: [T, ...T[]]) => 
  z.preprocess((val) => (val === "" ? undefined : val), z.enum(values).optional());

const schema = z.object({
  valuation_type: z.enum(['basic', 'professional']),
  property_type: z.enum(['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro']),
  rol_sii: z.string().optional(),
  rol_manzana: z.string().optional(),
  rol_predio: z.string().optional(),
  avaluo_fiscal: optionalNumber,
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  commune: z.string().min(1, "La comuna es requerida"),
  sector: z.string().optional(),
  zoning_code: z.string().optional(),
  property_usage: optionalEnum(['Habitacional', 'Comercial', 'Agrícola', 'Esparcimiento o Cultura']),
  m2_useful: optionalNumber,
  m2_total: requiredNumber("M2 totales requeridos"),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  parking: optionalNumber,
  storage: optionalNumber,
  year_built: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(1900).max(2026).optional()),
  orientation: z.string().optional(),
  gastos_comunes: optionalNumber,
  floors: optionalNumber,
  project_status: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  sustainability_features: z.array(z.string()).optional(),
  topography: optionalEnum(['Plano', 'Pendiente Suave', 'Pendiente Fuerte']),
  frontage_m: optionalNumber,
  max_height: optionalNumber,
  constructability_index: optionalNumber,
  land_use_coefficient: optionalNumber,
  // New Factors
  conservation_state: optionalEnum(['Excelente', 'Bueno', 'Regular', 'Malo']),
  construction_quality: optionalEnum(['Superior', 'Media', 'Económica']),
  proximity_to_metro: z.boolean().optional(),
  proximity_to_services: z.array(z.string()).optional(),
  view_quality: optionalEnum(['Despejada', 'Parcial', 'Obstruida']),
  security_level: optionalEnum(['Alta', 'Media', 'Baja']),
  noise_level: optionalEnum(['Silencioso', 'Moderado', 'Ruidoso']),
  // Rural/Agricultural specific fields
  num_lots: optionalNumber,
  water_availability: optionalEnum(['Abundante', 'Suficiente', 'Escasa']),
  electricity_system: optionalEnum(['Público', 'Privado', 'Generador']),
  materiality_walls: z.string().optional(),
  materiality_roof: z.string().optional(),
  heating_system: z.string().optional(),
  complementary_works: z.array(z.string()).optional(),
  notes: z.string().optional(),
  advantages: z.string().optional(),
  disadvantages: z.string().optional(),
  client_name: z.string().optional(),
  client_rut: z.string().optional(),
  client_email: z.string().email("Email inválido").optional().or(z.literal('')),
  client_phone: z.string().optional(),
  location_type: optionalEnum(['Urbana', 'Rural']),
  utms_coordinates: z.string().optional(),
  treasury_debt: optionalNumber,
  occupant_type: optionalEnum(['Propietario', 'Arrendatario', 'Allegado', 'Otro']),
  is_verbal_data: z.boolean().optional(),
  rent_expiry: z.string().optional(),
  monthly_rent_uf: optionalNumber,
  has_construction: z.boolean().optional(),
  block_info: z.string().optional(),
  report_type: optionalEnum(['Tasación', 'Retasación', 'Estudio de Título']),
  is_expropiation_affected: z.boolean().optional(),
  has_servidumbre: z.boolean().optional(),
  is_adobe_construction: z.boolean().optional(),
  dismountable_construction: z.boolean().optional(),
  is_dfl2: z.boolean().optional(),
  is_copropiedad: z.boolean().optional(),
  is_ley_3516: z.boolean().optional(),
  is_unregularized: z.boolean().optional(),
  has_regularization_feasibility: z.boolean().optional(),
  visit_type: optionalEnum(['Interior', 'Exterior']),
  visit_date: z.string().optional(),
  land_measures_source: z.string().optional(),
  construction_measures_source: z.string().optional(),
  cbr_fojas: z.string().optional(),
  cbr_numero: z.string().optional(),
  cbr_year: z.string().optional(),
  cbr_plano: z.string().optional(),
  acquisition_value_uf: optionalNumber,
  previous_valuation_date: z.string().optional(),
  previous_valuation_uf: optionalNumber,
  sector_description: z.string().optional(),
  min_lot_size: optionalNumber,
  upper_floor_occupancy_coefficient: optionalNumber,
  max_height_continuous: optionalNumber,
  max_depth_continuous: optionalNumber,
  max_height_isolated_over_continuous: optionalNumber,
  min_frontage: optionalNumber,
  density: z.string().optional(),
  setback: z.string().optional(),
  retranqueo: z.string().optional(),
  adosamiento: z.string().optional(),
  distanciamiento: z.string().optional(),
  antejardin: z.string().optional(),
  incentivos: z.string().optional(),
  condicion_incentivo: z.string().optional(),
  grouping: optionalEnum(['Continuo', 'Aislado', 'Pareado']),
  cip_status: z.string().optional(),
  expropriation_status: z.string().optional(),
  parking_quota: z.string().optional(),
  recent_amendments: z.string().optional(),
  occupancy_calculation: z.string().optional(),
  constructability_calculation: z.string().optional(),
  height_by_surface: z.string().optional(),
  allowed_buildable_surface: z.string().optional(),
  continuous_building_details: z.string().optional(),
  verified_land_surface: optionalNumber,
  surface_verification_notes: z.string().optional(),
  gis_reference_id: z.string().optional(),
  is_corner: z.boolean().optional(),
  corner_street: z.string().optional(),
  street_classification: z.string().optional(),
  corner_street_classification: z.string().optional(),
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
  kitchen_description: z.string().optional(),
  bathrooms_description: z.string().optional(),
  rtv_status: z.string().optional(),
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
  isPRCModalOpen: boolean;
  setIsPRCModalOpen: (open: boolean) => void;
}

const propertyTypes = ['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro'];
const streetClassifications = ['Troncal', 'Colectora', 'Servicio', 'Local'];
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

export const ValuationForm: React.FC<Props> = ({ onSubmit, isLoading, isPRCModalOpen, setIsPRCModalOpen }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PropertyData>({
    resolver: zodResolver(schema) as any,
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
      noise_level: 'Moderado',
      client_email: '',
      client_phone: '',
      location_type: 'Urbana',
      occupant_type: 'Arrendatario',
      report_type: 'Tasación',
      visit_type: 'Interior',
      is_verbal_data: false,
      has_construction: true,
      block_info: '',
      is_expropiation_affected: false,
      has_servidumbre: false,
      is_adobe_construction: false,
      dismountable_construction: false,
      is_dfl2: false,
      is_copropiedad: false,
      is_ley_3516: false,
      is_unregularized: false,
      has_regularization_feasibility: false,
      upper_floor_occupancy_coefficient: 0,
      max_height_continuous: 0,
      max_depth_continuous: 0,
      max_height_isolated_over_continuous: 0
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

  // Sync rol_sii with manzana and predio (Bidirectional)
  React.useEffect(() => {
    // If rol_sii changes, try to split it
    if (rol && rol.includes('-')) {
      const [m, p] = rol.split('-');
      if (m !== rolManzana) setValue("rol_manzana", m);
      if (p !== rolPredio) setValue("rol_predio", p);
    }
  }, [rol, rolManzana, rolPredio, setValue]);

  React.useEffect(() => {
    // If manzana or predio changes individually (e.g. from AI fetch), update the unique field
    if (rolManzana || rolPredio) {
      const combined = `${rolManzana || ""}-${rolPredio || ""}`;
      if (combined !== rol) setValue("rol_sii", combined);
    }
  }, [rolManzana, rolPredio, rol, setValue]);

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
      const cornerStreet = watch("corner_street");
      const streetClass = watch("street_classification");
      const cornerStreetClass = watch("corner_street_classification");
      const data = await getRegulatoryData(commune, sector || "", rol || "", street || "", number || "", rolManzana, rolPredio, currentZoningCode, m2Total, isCorner, cornerStreet, streetClass, cornerStreetClass);
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
      setValue("verified_land_surface", data.verified_land_surface);
      setValue("surface_verification_notes", data.surface_verification_notes);
      setValue("min_lot_size", data.min_lot_size);
      setValue("upper_floor_occupancy_coefficient", data.upper_floor_occupancy_coefficient);
      setValue("max_height_continuous", data.max_height_continuous);
      setValue("max_depth_continuous", data.max_depth_continuous);
      setValue("max_height_isolated_over_continuous", data.max_height_isolated_over_continuous);
      if (data.grouping) setValue("grouping", data.grouping as any);
      if (data.street_classification) setValue("street_classification", data.street_classification);
      if (data.corner_street_classification) setValue("corner_street_classification", data.corner_street_classification);
      setUsageSearch(data.property_usage);
    } catch (error: any) {
      console.error("Error fetching norms:", error);
      const errorMessage = error?.message || "Error desconocido";
      setFetchError(`No se pudo obtener la normativa automáticamente: ${errorMessage}.`);
    } finally {
      setIsFetchingNorms(false);
    }
  };

  const heightBySurface = watch("height_by_surface");
  const allowedSurface = watch("allowed_buildable_surface");

  React.useEffect(() => {
    // Auto-resize textareas when values change (e.g. from IA fetch)
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [heightBySurface, allowedSurface]);

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
        className="max-w-7xl mx-auto px-4 md:px-6 pb-6 space-y-4"
      >
        {/* Valuation Type Selection */}
        <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
            <label className="text-lg font-bold text-slate-800 uppercase tracking-widest">Tipo de Tasación</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue('valuation_type', 'professional');
                  setValue('client_name', 'SOCIEDAD DE INVERSIONES CHILE SPA');
                  setValue('property_type', 'Local Comercial');
                  setValue('commune', 'Concepción');
                  setValue('address_street', 'Aníbal Pinto');
                  setValue('address_number', '343');
                  setValue('gis_reference_id', '11791');
                  setValue('height_by_surface', '15 metros (Aprox. 5 pisos)');
                  setValue('continuous_building_details', '9m de altura máxima para edificación continua');
                  setValue('allowed_buildable_surface', '1.250 m² totales');
                  setValue('parking_quota', '1 cada 50 m2');
                  setValue('year_built', 2015);
                  setValue('floors', 1);
                  setValue('materiality_walls', 'Albañilería Reforzada');
                  setValue('kitchen_description', 'Kitchenette integrada');
                  setValue('bathrooms_description', 'Baño universal accesible');
                  setValue('rtv_status', 'Recepción Parcial');
                  setValue('street_classification', 'Troncal');
                  setValue('is_corner', true);
                  setValue('corner_street', 'San Martín');
                  setValue('corner_street_classification', 'Servicio');
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
                  setValue('year_built', 1961);
                  setValue('floors', 2);
                  setValue('materiality_walls', 'Hormigón Armado y Albañilería');
                  setValue('kitchen_description', 'Cocina equipada, muebles de madera');
                  setValue('bathrooms_description', 'Porcelanato, grifería de alta calidad');
                  setValue('rtv_status', 'Recepción Total');
                  setValue('view_quality', 'Despejada');
                  setValue('zoning_code', 'CPH (Centro y Plazas Históricas)');
                  setValue('height_by_surface', '27 metros (Aprox. 9 pisos)');
                  setValue('continuous_building_details', '15m de altura máxima para edificación continua (Art. 40)');
                  setValue('allowed_buildable_surface', '4.795 m² totales');
                  setValue('max_height', 11);
                  setValue('parking_quota', '1 cada 40 m2 útiles');
                  setValue('constructability_index', 5.0);
                  setValue('land_use_coefficient', 0.6);
                  setValue('min_lot_size', 400);
                  setValue('min_frontage', 15);
                  setValue('density', "Libre");
                  setValue('setback', "No aplica");
                  setValue('antejardin', "5m (Prod/Infra) / 4m (Otros)");
                  setValue('retranqueo', "No aplica");
                  setValue('adosamiento', "Permitido (excepto Prod/Infra)");
                  setValue('distanciamiento', "Según Art. 2.6.3 OGUC");
                  setValue('incentivos', "Art. 40: Altura cont. 15m / Prof. 80%");
                  setValue('condicion_incentivo', "Capa vegetal en cubierta o patio comunitario");
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
                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold hover:bg-blue-100 transition-colors border border-blue-200"
              >
                Ejemplo Concepción
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('valuation_type', 'professional');
                  setValue('client_name', 'INVERSIONES SAN PEDRO SPA');
                  setValue('property_type', 'Casa');
                  setValue('commune', 'San Pedro de la Paz');
                  setValue('address_street', 'Av. Michimalonco');
                  setValue('address_number', '1200');
                  setValue('sector', 'Andalué');
                  setValue('zoning_code', 'ZM-1');
                  setValue('m2_total', 1200);
                  setValue('m2_useful', 250);
                  setValue('property_usage', 'Habitacional');
                  setValue('year_built', 2018);
                  setValue('floors', 2);
                  setValue('max_height', 45);
                  setValue('constructability_index', 2.5);
                  setValue('land_use_coefficient', 1.0);
                  setValue('min_lot_size', 1000);
                  setValue('max_height_continuous', 10.5);
                  setValue('grouping', 'Aislado');
                  setValue('parking_quota', '1 por unidad de vivienda');
                  setValue('conservation_state', 'Excelente');
                  setValue('construction_quality', 'Superior');
                  setValue('security_level', 'Alta');
                  setValue('noise_level', 'Silencioso');
                  setValue('sector_description', "Zona Mixta ZM-1 consolidada. Alta plusvalía y equipamiento completo.");
                }}
                className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold hover:bg-green-100 transition-colors border border-green-200"
              >
                Ejemplo San Pedro (ZM-1)
              </button>
            </div>
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

      {/* SECCIÓN: ANTECEDENTES CLIENTE */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Antecedentes del Cliente
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nombre / Razón Social</label>
            <input 
              {...register('client_name')}
              placeholder="Ej: Sociedad de Inversiones Chile SpA"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="text-[11px] font-bold text-gray-400 uppercase">RUT Cliente</label>
            <input 
              {...register('client_rut')}
              placeholder="Ej: 76.185.166-7"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-8">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Email de Contacto</label>
            <input 
              type="email"
              {...register('client_email')}
              placeholder="ejemplo@correo.com"
              className={`w-full py-1.5 px-3 rounded-md border focus:border-blue-600 focus:ring-0 transition-all text-sm ${errors.client_email ? 'border-red-500' : 'border-gray-200'}`}
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase">WhatsApp / Teléfono</label>
            <input 
              type="tel"
              {...register('client_phone')}
              placeholder="+56 9 ..."
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: ANTECEDENTES PROPIETARIO */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Antecedentes del Propietario
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nombre Propietario</label>
            <input 
              {...register('owner_name')}
              placeholder="Nombre completo"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase">RUT</label>
            <input 
              {...register('owner_rut')}
              placeholder="12.345.678-9"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Correo</label>
            <input 
              type="email"
              {...register('owner_email')}
              placeholder="correo@ejemplo.com"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Teléfono</label>
            <input 
              type="tel"
              {...register('owner_phone')}
              placeholder="+56 9 ..."
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: ANTECEDENTES PROPIEDAD - GRID SISTEMA CIP */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:shadow-md mb-4">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
          <Home className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Identificación de la Propiedad (Formato CIP/SII)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          {/* FILA 1: DIRECCIÓN (8+2+2 = 12) */}
          <div className="md:col-span-8 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Dirección (Calle / Av.)</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Ej: Av. Aníbal Pinto"
                {...register("address_street")}
                className="w-full h-10 px-3 pr-10 border-2 border-slate-50 bg-slate-50/30 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-sm font-medium transition-all shadow-inner"
              />
              <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Número</label>
            <input 
              type="text" 
              placeholder="343"
              {...register("address_number")}
              className="w-full h-10 px-2 border-2 border-slate-50 bg-slate-50/30 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-sm font-black text-center transition-all shadow-inner"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-orange-600 uppercase tracking-tight flex items-center gap-1">
              ¿Es Esquina?
              <Sparkles className="w-3 h-3" />
            </label>
            <div className={`flex items-center justify-center h-10 border-2 rounded-lg transition-all cursor-pointer ${watch("is_corner") ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-slate-50/30'}`}
                 onClick={() => setValue("is_corner", !watch("is_corner"))}>
              <input type="checkbox" {...register("is_corner")} className="sr-only" />
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${watch("is_corner") ? 'bg-orange-500' : 'bg-gray-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${watch("is_corner") ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className={`ml-2 text-[10px] font-black uppercase ${watch("is_corner") ? 'text-orange-700' : 'text-gray-400'}`}>
                {watch("is_corner") ? 'SÍ' : 'NO'}
              </span>
            </div>
          </div>

          {/* FILA 2: ROL IDENTIFICACIÓN (4+4+4 = 12) */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-tight flex items-center gap-1">
              ROL Avalúo (Manzana-Predio)
              <Search className="w-3 h-3" />
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ej: 1234-56"
                {...register("rol_sii")}
                className="w-full h-10 px-3 bg-blue-50/30 border-2 border-blue-100 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-sm font-black text-blue-900 placeholder:text-blue-200 transition-all"
              />
              <div className="absolute right-3 top-2.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded uppercase">SII</div>
            </div>
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-transparent select-none uppercase">Validación</label>
            <button 
              type="button"
              onClick={() => {
                const url = `https://www4.sii.cl/cartografiaui/`;
                window.open(url, '_blank');
              }}
              className="w-full h-10 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]"
            >
              <Search className="w-3.5 h-3.5" />
              Validar en Cartografía SII
            </button>
          </div>
          <div className="md:col-span-4 self-center pt-4">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-[1px] flex-1 bg-slate-100" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Identificación Oficial CIP</span>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>
          </div>

          {/* FILA 3: DATOS TÉCNICOS Y SUPERFICIES (2+2+2+3+3 = 12) */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Comuna</label>
            <input 
              type="text" 
              placeholder="Comuna"
              {...register("commune")}
              className={`w-full h-10 px-3 border-2 rounded-lg outline-none focus:border-blue-500 text-sm font-medium bg-white ${errors.commune ? 'border-red-500' : 'border-slate-50'}`}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Tipo</label>
            <select 
              {...register("property_type")}
              className="w-full h-10 px-2 border-2 border-slate-50 rounded-lg outline-none focus:border-blue-500 text-sm font-medium bg-white appearance-none cursor-pointer"
            >
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Destino</label>
            <select 
              {...register("property_usage")}
              className="w-full h-10 px-2 border-2 border-slate-50 rounded-lg outline-none focus:border-blue-500 text-sm font-medium bg-white appearance-none cursor-pointer"
            >
              {usageOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-tight bg-blue-50/50 px-2 py-0.5 rounded-t-md inline-block">Terreno m²</label>
            <div className="relative">
              <input 
                type="number" 
                {...register("m2_total", { valueAsNumber: true })} 
                className="w-full h-10 px-3 border-2 border-blue-50 bg-blue-50/20 rounded-lg outline-none focus:border-blue-500 text-sm font-black text-blue-700" 
              />
              <span className="absolute right-3 top-3 text-[10px] font-bold text-blue-300">m²</span>
            </div>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-green-900 uppercase tracking-tight bg-green-50/50 px-2 py-0.5 rounded-t-md inline-block">Edificado m²</label>
            <div className="relative">
              <input 
                type="number" 
                {...register("m2_useful", { valueAsNumber: true })} 
                className="w-full h-10 px-3 border-2 border-green-50 bg-green-50/20 rounded-lg outline-none focus:border-green-500 text-sm font-black text-green-700" 
              />
              <span className="absolute right-3 top-3 text-[10px] font-bold text-green-300">m²</span>
            </div>
          </div>
        </div>

        {/* Campo condicional para calle transversal si es esquina */}
        {watch("is_corner") && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 space-y-0.5">
              <label className="text-[10px] font-bold text-orange-700 uppercase tracking-tighter">Nombre Calle Transversal</label>
              <input 
                type="text"
                placeholder="Ej: Calle Los Olmos"
                {...register("corner_street")}
                className="w-full h-10 px-3 border-2 border-orange-200 rounded-lg outline-none focus:border-orange-500 text-sm font-medium transition-all"
              />
            </div>
            <div className="w-32 flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-orange-700 uppercase tracking-tighter">Clasificación</label>
              <select 
                {...register("corner_street_classification")}
                className="w-full h-10 px-2 border-2 border-orange-200 rounded-lg outline-none focus:border-orange-500 text-xs font-black bg-white"
              >
                {streetClassifications.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* SECCIÓN: NORMATIVA Y LOCALIZACIÓN TÉCNICA */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Normativa y Localización Técnica
            </h3>
          </div>
          <button
            type="button"
            onClick={handleFetchNorms}
            disabled={isFetchingNorms || !commune}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${
              isFetchingNorms 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95'
            }`}
          >
            {isFetchingNorms ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isFetchingNorms ? "Consultando..." : "Consultar Normativa (AI)"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="space-y-0.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">ZONIFICACIÓN PRC</label>
            <input 
              type="text" 
              placeholder="Ej: ZH-1"
              {...register("zoning_code")}
              className="w-full h-8 px-2 border-2 border-slate-50 bg-slate-50/20 rounded-md outline-none focus:border-blue-500 text-sm font-black text-blue-700"
            />
          </div>

          <div className="space-y-0.5 md:col-span-2">
            <label className="text-[11px] font-bold text-blue-700 uppercase flex items-center gap-1 tracking-tighter">
              Referencia Mapa Plano Regulador (PRMC)
              <MapPin className="w-3 h-3" />
            </label>
            <button 
              type="button"
              onClick={() => setIsPRCModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-1 px-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-100 transition-all uppercase tracking-widest h-8"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Cartografía Oficial MINVU
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Sector / Barrio</label>
            <input 
              type="text" 
              placeholder="Ej: Andalué"
              {...register("sector")}
              className="w-full h-8 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Ciudad / Región (Ref)</label>
            <div className="w-full h-8 px-2 border border-gray-200 rounded-md bg-slate-50 text-[10px] flex items-center font-bold text-slate-500 leading-none">
              Concepción / Biobío
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Ubicación</label>
            <select 
              {...register("location_type")}
              className="w-full h-8 px-1 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-xs bg-white"
            >
              <option value="Urbana">Urbana</option>
              <option value="Rural">Rural</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between px-3 bg-slate-50 rounded-lg border border-slate-100 h-8 mt-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Validación Normativa BCN / MINVU</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => window.open('https://www.leychile.cl', '_blank')} className="text-[9px] font-bold text-blue-600 hover:underline">BCN</button>
              <button type="button" onClick={() => window.open('https://www.viviendaabierta.minvu.cl', '_blank')} className="text-[9px] font-bold text-blue-600 hover:underline">MINVU</button>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[11px] font-bold text-red-600 uppercase tracking-tighter">Deuda Tesorería</label>
            <input type="number" {...register("treasury_debt", { valueAsNumber: true })} className="w-full h-8 px-2 border border-red-500/20 rounded-md outline-none text-sm bg-red-50/10 font-bold" />
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 pt-4 border-t border-gray-50">
          <div className="space-y-1">
            <label className="text-sm font-bold text-blue-800">Altura máxima según superficie</label>
            <textarea 
              placeholder="Ej: 5 pisos (Ajustado por superficie y ubicación)"
              {...register("height_by_surface")}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full p-2 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30 resize-none overflow-hidden min-h-[38px]"
            />
            <div className="mt-1">
              <input 
                type="text"
                placeholder="Detalles edificación continua (ej: 9m de altura)"
                {...register("continuous_building_details")}
                className="w-full p-1.5 border border-blue-100 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-[10px] bg-white/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-green-800">Superficie permitida</label>
            <textarea 
              placeholder="Ej: 1.500 m2"
              {...register("allowed_buildable_surface")}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full p-2 border border-green-100 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm bg-green-50/30 resize-none overflow-hidden min-h-[38px]"
            />
          </div>
        </div>

      {/* Contenedor 3: CONDICIONES DE EDIFICACION */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Condiciones de Edificación
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Sup. Predial Mínima</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="Ej: 400"
                {...register("min_lot_size", { valueAsNumber: true })}
                className="w-full py-1 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm pr-8"
              />
              <span className="absolute right-2 top-1.5 text-[9px] font-bold text-gray-400">m²</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Coef. Suelo</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Ej: 0.6"
              {...register("land_use_coefficient", { valueAsNumber: true })}
              className="w-full py-1 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Constructibilidad</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Ej: 4.0"
              {...register("constructability_index", { valueAsNumber: true })}
              className="w-full py-1 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Coef. Pisos Sup.</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Ej: 0.4"
              {...register("upper_floor_occupancy_coefficient", { valueAsNumber: true })}
              className="w-full py-1 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Alt. Máx. Edificación</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                placeholder="Ej: 27"
                {...register("max_height", { valueAsNumber: true })}
                className="w-full py-1 px-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm pr-8"
              />
              <span className="absolute right-2 top-1.5 text-[9px] font-bold text-gray-400">m</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Sistema de Agrupamiento</label>
            <select 
              {...register("grouping")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">Seleccionar...</option>
              <option value="Continuo">Continuo</option>
              <option value="Aislado">Aislado</option>
              <option value="Pareado">Pareado</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Alt. Máx. Edificación Continua</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                placeholder="Ej: 9"
                {...register("max_height_continuous", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
              />
              <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400">m</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Prof. Máx. Edif. Continua</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                placeholder="Ej: 15"
                {...register("max_depth_continuous", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
              />
              <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400">m</span>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Alt. Máx. Edif. Aislado sobre Continuo</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                placeholder="Ej: 18"
                {...register("max_height_isolated_over_continuous", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
              />
              <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400">m</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Retranqueo</label>
            <input 
              type="text" 
              placeholder="Ej: No aplica"
              {...register("retranqueo")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Adosamiento</label>
            <input 
              type="text" 
              placeholder="Ej: Permitido"
              {...register("adosamiento")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Distanciamiento</label>
            <input 
              type="text" 
              placeholder="Ej: Art. 2.6.3 OGUC"
              {...register("distanciamiento")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Antejardín</label>
            <input 
              type="text" 
              placeholder="Ej: 4m"
              {...register("antejardin")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-tight">Incentivos (Art. 40)</label>
            <textarea 
              placeholder="Ej: Aumento altura continua a 15m..."
              {...register("incentivos")}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full p-2 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30 resize-none overflow-hidden min-h-[38px]"
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-tight">Condición para Incentivo</label>
            <textarea 
              placeholder="Ej: Capa vegetal en cubierta..."
              {...register("condicion_incentivo")}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full p-2 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/30 resize-none overflow-hidden min-h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* Contenedor 2: Edificación y Atributos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 items-start">
          {propertyType !== 'Sitio Eriazo' && (
            <React.Fragment key="building-basic-fields">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Estado Proyecto</label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Año Construcción</label>
            <input 
              type="number" 
              {...register("year_built", { valueAsNumber: true })}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: 2010"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Niveles / Pisos</label>
            <input 
              type="number" 
              {...register("floors", { valueAsNumber: true })}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: 2"
            />
          </div>
          <div className="space-y-1 md:col-span-full">
            <label className="text-sm font-medium text-gray-600">Materiales Usados</label>
            <input 
              type="text" 
              {...register("materiality_walls")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: Hormigón, Madera"
            />
          </div>
          <div className="space-y-1 md:col-span-full">
            <label className="text-sm font-medium text-gray-600">Cocina</label>
            <input 
              type="text" 
              {...register("kitchen_description")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: Americana, Equipada"
            />
          </div>
          <div className="space-y-1 md:col-span-full">
            <label className="text-sm font-medium text-gray-600">Baño</label>
            <input 
              type="text" 
              {...register("bathrooms_description")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: Porcelanato, Vanitorio"
            />
          </div>
          <div className="space-y-1 md:col-span-full">
            <label className="text-sm font-medium text-gray-600">RTV / Recepción</label>
            <input 
              type="text" 
              {...register("rtv_status")}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="Ej: Recepción Total"
            />
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
        <div key="premium-normative-section" className="max-w-7xl mx-auto px-6 mb-4 mt-2">
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest border-b border-blue-50 pb-1">Normativa Regional PRC</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Frente Mín.</label>
                <input type="number" {...register('min_frontage', { valueAsNumber: true })} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Densidad</label>
                <input type="text" {...register('density')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Retiro/Setback</label>
                <input type="text" {...register('setback')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">CIP Status</label>
                <input type="text" {...register('cip_status')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Expropiación</label>
                <input type="text" {...register('expropriation_status')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Zona (Ref)</label>
                <div className="w-full py-0.5 px-2 rounded-md border border-slate-50 bg-slate-100 text-slate-500 text-[10px] font-bold leading-tight line-clamp-1 h-[30px] flex items-center">
                  {watch("zoning_code") || "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-blue-50 pt-4">
              <div className="space-y-2">
                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                  <label className="block text-[9px] font-bold text-blue-800 uppercase mb-0.5">Ocupación Suelo (Detalles)</label>
                  <textarea 
                    {...register('occupancy_calculation')} 
                    className="w-full bg-transparent text-[11px] text-blue-900 border-none focus:ring-0 p-0 resize-none h-12"
                    placeholder="Escribir detalles del cálculo..."
                  />
                </div>
                <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                  <label className="block text-[9px] font-bold text-green-800 uppercase mb-0.5">Constructibilidad (Detalles)</label>
                  <textarea 
                    {...register('constructability_calculation')} 
                    className="w-full bg-transparent text-[11px] text-green-900 border-none focus:ring-0 p-0 resize-none h-12"
                    placeholder="Escribir detalles del cálculo..."
                  />
                </div>
              </div>
              <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                <label className="block text-[9px] font-bold text-purple-800 uppercase mb-0.5">Enmiendas y Modificaciones (2024+)</label>
                <textarea 
                  {...register('recent_amendments')} 
                  className="w-full bg-transparent text-[11px] text-purple-900 border-none focus:ring-0 p-0 resize-none h-24"
                  placeholder="Insertar información sobre cambios recientes en el PRC..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Specifications Section */}
      {isPremium && (
        <div key="premium-technical-section" className="max-w-7xl mx-auto px-6 mb-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-widest">Especificaciones Técnicas</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Muros</label>
                    <input type="text" {...register('structure_muros')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Entrepiso</label>
                    <input type="text" {...register('structure_entrepiso')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Escaleras</label>
                    <input type="text" {...register('structure_escalera')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Techumbre</label>
                    <input type="text" {...register('structure_techumbre')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Topografía / Forma</label>
                <div className="flex gap-1">
                  <input type="text" {...register('land_topography')} placeholder="Topo" className="flex-1 py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  <input type="text" {...register('land_shape')} placeholder="Forma" className="flex-1 py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Sanitarios / Relación F-B</label>
                <div className="flex gap-1">
                  <input type="text" {...register('sanitary_artifacts')} placeholder="San" className="flex-1 py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                  <input type="text" {...register('front_depth_ratio')} placeholder="F/B" className="flex-1 py-0.5 px-2 rounded-md border border-gray-200 text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Municipal Status Section */}
      {isPremium && (
        <div key="premium-municipal-section" className="max-w-7xl mx-auto px-6 mb-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-widest">Situación Municipal</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Permiso N°</label>
                <input type="text" {...register('permit_number')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha Perm.</label>
                <input type="date" {...register('permit_date')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Recepción N°</label>
                <input type="text" {...register('reception_number')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha Rec.</label>
                <input type="date" {...register('reception_date')} className="w-full py-0.5 px-2 rounded-md border border-gray-200 text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-green-100 shadow-sm">
          <label className="block text-[11px] font-bold text-green-800 mb-1.5 uppercase tracking-widest">Ventajas</label>
          <textarea 
            {...register('advantages')}
            className="w-full h-16 p-2 rounded-md border border-gray-100 focus:border-green-600 focus:ring-0 transition-all text-xs resize-none"
          />
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm">
          <label className="block text-[11px] font-bold text-red-800 mb-1.5 uppercase tracking-widest">Desventajas</label>
          <textarea 
            {...register('disadvantages')}
            className="w-full h-16 p-2 rounded-md border border-gray-100 focus:border-red-600 focus:ring-0 transition-all text-xs resize-none"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm">
          <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-widest">Descripción del Sector / Entorno</label>
          <textarea 
            {...register('sector_description')}
            placeholder="Ej: Barrio centro consolidado, tipología CPH, densidad alta, nivel socioeconómico medio-alto..."
            className="w-full h-32 p-2 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all text-sm resize-none"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm">
          <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-widest">Notas Adicionales / Observaciones</label>
          <textarea 
            {...register('notes')}
            placeholder="Ej: Propiedad subutilizada, potencial de desarrollo comercial, cercanía a hitos urbanos, etc."
            className="w-full h-32 p-2 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 transition-all text-sm resize-none"
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
