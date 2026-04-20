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
  client_rut?: string;
  client_email?: string;
  client_phone?: string;
  owner_name?: string;
  owner_rut?: string;
  owner_email?: string;
  owner_phone?: string;
  // Technical & Administrative info from reference image
  location_type?: 'Urbana' | 'Rural';
  utms_coordinates?: string;
  has_construction?: boolean;
  block_info?: string;
  treasury_debt?: number;
  report_type?: 'Tasación' | 'Retasación' | 'Estudio de Título';
  dismountable_construction?: boolean;
  land_measures_source?: string;
  construction_measures_source?: string;
  sector_description?: string;
  min_lot_size?: number;
  upper_floor_occupancy_coefficient?: number;
  max_height_continuous?: number;
  max_depth_continuous?: number;
  max_height_isolated_over_continuous?: number;
  min_frontage?: number;
  density?: string;
  setback?: string;
  retranqueo?: string;
  adosamiento?: string;
  distanciamiento?: string;
  antejardin?: string;
  incentivos?: string;
  condicion_incentivo?: string;
  grouping?: 'Continuo' | 'Aislado' | 'Pareado';
  cip_status?: string;
  expropriation_status?: string;
  parking_quota?: string;
  recent_amendments?: string;
  occupancy_calculation?: string;
  constructability_calculation?: string;
  height_by_surface?: string;
  allowed_buildable_surface?: string;
  continuous_building_details?: string;
  verified_land_surface?: number;
  surface_verification_notes?: string;
  gis_reference_id?: string;
  is_corner?: boolean;
  corner_street?: string;
  street_classification?: string;
  corner_street_classification?: string;
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
  kitchen_description?: string;
  bathrooms_description?: string;
  rtv_status?: string;
  land_shape?: string;
  land_topography?: string;
  front_depth_ratio?: string;
  general_description?: string;
  emplacement_description?: string;
  doors_description?: string;
  windows_description?: string;
  dry_zone_lining?: string;
  wet_zone_lining?: string;
  dry_zone_floors?: string;
  furniture_quality?: string;
  partition_walls?: string;
  potable_water_status?: string;
  sewage_status?: string;
  electricity_status?: string;
  gas_status?: string;
  // Apartment specific fields
  apartment_floor?: number;
  total_building_floors?: number;
  units_per_floor?: number;
  total_building_units?: number;
  // Municipal Status
  permit_number?: string;
  permit_date?: string;
  reception_number?: string;
  reception_date?: string;
  // Legal & Technical Status (Image Ref Integration)
  is_expropiation_affected?: boolean;
  has_servidumbre?: boolean;
  is_adobe_construction?: boolean;
  is_unregularized?: boolean;
  has_regularization_feasibility?: boolean;
  is_verbal_data?: boolean;
  is_dfl2?: boolean;
  is_copropiedad?: boolean;
  is_ley_3516?: boolean;
  occupant_type?: 'Propietario' | 'Arrendatario' | 'Allegado' | 'Otro';
  rent_expiry?: string;
  has_rent_contract?: boolean;
  visit_date?: string;
  visit_type?: 'Interior' | 'Exterior';
  cbr_fojas?: string;
  cbr_numero?: string;
  cbr_year?: string;
  cbr_plano?: string;
  acquisition_value_uf?: number;
  previous_valuation_uf?: number;
  previous_valuation_date?: string;
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
    offers: DetailedComparableProperty[];
    effective_sales: DetailedComparableProperty[];
    market_summary?: {
      general_avg_uf: number;
      general_avg_uf_m2: number;
      similar_avg_uf: number;
      similar_avg_uf_m2: number;
      adjusted_avg_uf: number;
      adjusted_avg_uf_m2: number;
      subject_value_uf: number;
      subject_value_uf_m2: number;
    };
    final_recommendation: string;
  };
  valuation_breakdown?: {
    land: {
      m2: number;
      uf_m2: number;
      total_uf: number;
      description: string;
      form_factor?: number;
      location_factor?: number;
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
  sector_analysis?: {
    typology: string;
    market: {
      target_market: string;
      similar_goods_offer: 'ALTA' | 'MEDIA' | 'BAJA';
      value_trend: 'ALTA' | 'ESTABLE' | 'BAJA';
      market_transparency: 'ALTA' | 'MEDIA' | 'BAJA';
      similar_goods_demand: 'ALTA' | 'MEDIA' | 'BAJA';
      plusvalia_prospect: 'ALTA' | 'MEDIA' | 'BAJA';
      market_suitability: 'SI' | 'NO';
      low_value_risk: 'ALTO' | 'MEDIO' | 'BAJO';
    };
    sector: {
      environmental_quality: 'ALTA' | 'MEDIA' | 'BAJA';
      change_speed: 'ALTA' | 'MEDIA' | 'BAJA';
      consolidation_degree: 'ALTO' | 'MEDIO' | 'BAJO';
    };
    population: {
      socioeconomic_level: string;
      population_density: 'ALTA' | 'MEDIA' | 'BAJA';
      trend: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    };
    edificios: {
      quality: 'ALTA' | 'MEDIA' | 'BAJA';
      density: 'ALTA' | 'MEDIA' | 'BAJA';
      predominant_grouping: string;
      general_conservation: 'ALTA' | 'MEDIA' | 'BAJA';
      average_age: number;
      design_type: string;
      development_degree: 'ALTA' | 'MEDIA' | 'BAJA';
    };
    equipment: {
      educational_m: number;
      green_areas_m: number;
      shopping_center_m: number;
      mobilization_quality: 'ALTA' | 'MEDIA' | 'BAJA';
      mobilization_m: number;
    };
    urbanization: {
      completion: 'COMPLETA' | 'PARCIAL' | 'INEXISTENTE';
      quality: 'ALTA' | 'MEDIA' | 'BAJA';
      conservation: 'ALTA' | 'MEDIA' | 'BAJA';
      pavement: string;
      sidewalks: string;
    };
    services: {
      sewage: 'RED' | 'PARTICULAR' | 'NO';
      gas: 'RED' | 'PARTICULAR' | 'NO';
      electricity: 'RED' | 'NO';
      water: 'RED' | 'PARTICULAR' | 'NO';
      rain_water: 'RED' | 'NO';
      trees: 'ALTA' | 'MEDIA' | 'BAJA' | 'NULA';
    };
    observations: string;
    urbanization_observations: string;
  };
  property_data: PropertyData;
}

export interface ComparableProperty {
  price_uf: number;
  m2: number;
  distance_km: number;
  source: string;
}

export interface DetailedComparableProperty {
  id_nro: number;
  date: string;
  address: string;
  distance_km: number;
  norm_zone: string;
  m2_land: number | null;
  m2_built: number | null;
  price_uf: number;
  uf_m2_land: number | null;
  uf_m2_built: number | null;
  source_url: string;
  source_name: string; // e.g. "Portal Inmobiliario", "Instagram", "Facebook", "Red Corredores"
  relationship: 'SIMILAR' | 'INFERIOR' | 'SUPERIOR';
  cbr_data?: string; // Fojas / Nº / Rol
}

export interface MarketStat {
  commune: string;
  avgPriceUF: number;
  trend: string;
}
