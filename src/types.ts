export interface Project {
  id?: string;
  name: string;
  developer: string;
  property_type: 'Departamento' | 'Casa' | 'Sitio Eriazo' | 'Oficina' | 'Local Comercial' | 'Agrícola / Parcela' | 'Teatro';
  region: 'Biobío' | 'Metropolitana';
  commune: string;
  sector?: string;
  zoning_code?: string;
  address: string;
  status: 'En Venta' | 'En Verde' | 'Entrega Inmediata';
  floors: number;
  total_units: number;
  amenities: string[];
  sustainability_features: string[];
  avg_price_uf_m2: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PropertyData {
  valuation_type: 'basic' | 'professional';
  property_type: 'Departamento' | 'Casa' | 'Sitio Eriazo' | 'Oficina' | 'Local Comercial' | 'Agrícola / Parcela' | 'Teatro';
  rol_sii?: string;
  rol_manzana?: string;
  rol_predio?: string;
  avaluo_fiscal?: number;
  address_street?: string;
  address_number?: string;
  commune: string;
  sector?: string;
  zoning_code?: string;
  property_usage?: 'Habitacional' | 'Comercial' | 'Agrícola' | 'Esparcimiento o Cultura';
  m2_useful?: number;
  m2_total: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  storage?: number;
  year_built?: number;
  orientation?: string;
  gastos_comunes?: number;
  floors?: number;
  amenities?: string[];
  sustainability_features?: string[];
  project_status?: string;
  topography?: 'Plano' | 'Pendiente Suave' | 'Pendiente Fuerte';
  frontage_m?: number;
  max_height?: number; // Altura máxima permitida en pisos o metros
  constructability_index?: number; // Coeficiente de constructibilidad
  land_use_coefficient?: number; // Coeficiente de ocupación de suelo
  // New Factors that influence price
  conservation_state?: 'Excelente' | 'Bueno' | 'Regular' | 'Malo';
  construction_quality?: 'Superior' | 'Media' | 'Económica';
  proximity_to_metro?: boolean;
  proximity_to_services?: string[]; // e.g., ["Colegios", "Hospitales", "Comercio"]
  view_quality?: 'Despejada' | 'Parcial' | 'Obstruida';
  security_level?: 'Alta' | 'Media' | 'Baja';
  noise_level?: 'Silencioso' | 'Moderado' | 'Ruidoso';
  // Rural/Agricultural specific fields
  num_lots?: number;
  water_availability?: 'Abundante' | 'Suficiente' | 'Escasa';
  electricity_system?: 'Público' | 'Privado' | 'Generador';
  materiality_walls?: string;
  materiality_roof?: string;
  heating_system?: string;
  complementary_works?: string[]; // e.g., ["Piscina de Hormigón", "Bodegas"]
  notes?: string; // Additional observations or context
  advantages?: string;
  disadvantages?: string;
  client_name?: string;
  sector_description?: string;
  min_lot_size?: number;
  min_frontage?: number;
  density?: string;
  setback?: string;
  grouping?: 'Continuo' | 'Aislado' | 'Pareado';
  cip_status?: string;
  expropriation_status?: string;
  // Technical Specifications
  access_description?: string;
  distribution_description?: string;
  structure_muros?: string;
  structure_entrepiso?: string;
  structure_escalera?: string;
  structure_techumbre?: string;
  structure_cubierta?: string;
  finishes_walls?: string;
  finishes_floors?: string;
  finishes_ceilings?: string;
  sanitary_artifacts?: string;
  land_shape?: string;
  land_topography?: string;
  front_depth_ratio?: string;
  // Municipal Status
  permit_number?: string;
  permit_date?: string;
  reception_number?: string;
  reception_date?: string;
}

export interface ValuationResult {
  id?: string;
  estimated_price_uf: number;
  estimated_price_clp: number;
  confidence_score: number;
  comparables: ComparableProperty[];
  market_context: string;
  regulatory_analysis?: {
    compliance_score: number;
    observations: string;
    is_consistent: boolean;
  };
  cabida_informe?: {
    max_floors: number;
    max_m2_buildable: number;
    observations: string;
  };
  restricciones_analisis?: {
    risk_zones: string;
    expropriations: string;
    heritage_protection: string;
    observations: string;
  };
  plusvalia_calculo?: {
    estimated_annual_appreciation: number;
    future_factors: string;
    market_projection: string;
  };
  createdAt?: { seconds: number; nanoseconds: number };
  valuation_type?: 'basic' | 'professional';
  professional_analysis?: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    comparables: {
      address: string;
      price_uf: number;
      m2: number;
      distance_km: number;
    }[];
    final_recommendation: string;
  };
  valuation_breakdown?: {
    land: {
      m2: number;
      uf_m2: number;
      total_uf: number;
      description: string;
    };
    buildings: {
      m2: number;
      uf_m2_avg: number;
      total_uf: number;
      details: {
        description: string;
        m2: number;
        uf_m2: number;
        total_uf: number;
      }[];
    };
    complementary_works: {
      total_uf: number;
      description: string;
    };
    total_uf: number;
  };
  property_data: PropertyData;
}

export interface ComparableProperty {
  price_uf: number;
  m2: number;
  distance_km: number;
  source: string;
}

export interface MarketStat {
  commune: string;
  avgPriceUF: number;
  trend: string;
}

