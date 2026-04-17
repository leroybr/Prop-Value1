import { GoogleGenAI, Type } from "@google/genai";
import { PropertyData, ValuationResult } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    // Buscamos la clave en todas las fuentes posibles (Vercel y AI Studio)
    // Vite expondrá VITE_GEMINI_API_KEY automáticamente si existe.
    // También la definimos en vite.config.ts para mayor seguridad.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) ||
                   (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : null);
    
    console.log("Verificando Clave Gemini:", apiKey ? "Detectada (OK)" : "No detectada (FALTA)");

    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      console.error("ERROR CRÍTICO: No se encuentra la clave VITE_GEMINI_API_KEY.");
      throw new Error("Falta la clave de API de Gemini. Asegúrate de que VITE_GEMINI_API_KEY esté configurada en las variables de entorno de Vercel.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getRegulatoryData(
  commune: string, 
  sector: string, 
  rol: string, 
  street?: string, 
  number?: string,
  rolManzana?: string,
  rolPredio?: string,
  currentZoningCode?: string,
  m2_total?: number,
  is_corner?: boolean,
  corner_street?: string,
  street_classification?: string,
  corner_street_classification?: string
): Promise<{
  zoning_code: string;
  max_height: number;
  constructability_index: number;
  land_use_coefficient: number;
  property_usage: string;
  setback: string;
  parking_quota: string;
  recent_amendments: string;
  occupancy_calculation: string;
  constructability_calculation: string;
  height_by_surface: string;
  allowed_buildable_surface: string;
  verified_land_surface?: number;
  surface_verification_notes?: string;
  street_classification?: string;
  corner_street_classification?: string;
  min_lot_size?: number;
  upper_floor_occupancy_coefficient?: number;
  max_height_continuous?: number;
  max_depth_continuous?: number;
  max_height_isolated_over_continuous?: number;
  grouping?: string;
  retranqueo?: string;
  adosamiento?: string;
  distanciamiento?: string;
  antejardin?: string;
  incentivos?: string;
  condicion_incentivo?: string;
}> {
  console.log("Consultando normativa detallada para:", { commune, sector, rol, street, number, rolManzana, rolPredio, currentZoningCode, m2_total, corner_street, street_classification, corner_street_classification });
  const ai = getAi();
  const prompt = `
    Act as a Senior Chilean Urban Planning Expert (Arquitecto Revisor DOM). 
    Your task is to provide the urban norms (normas urbanísticas) from the "Plano Regulador Comunal" (PRC) and "Ordenanza General de Urbanismo y Construcciones" (OGUC) for the following location.
    
    Location:
    - Commune: ${commune}
    - Sector/Neighborhood: ${sector}
    - Address: ${street || ""} ${number || ""} (Clasificación: ${street_classification || "Desconocida"})
    - Rol SII (Combined): ${rol}
    - Rol SII (Manzana): ${rolManzana || "Not specified"}
    - Rol SII (Predio): ${rolPredio || "Not specified"}
    - User-Provided Zoning Code (Zona PRC): ${currentZoningCode || "Not specified"}
    - Total Land Surface (Superficie Predial proporcionada por usuario): ${m2_total || "Not specified"} m2
    - Es Esquina (Is Corner Lot): ${is_corner ? "SÍ" : "NO"}
    - Calle Esquina (Corner Street): ${corner_street || "Not specified"} (Clasificación: ${corner_street_classification || "Desconocida"})
    
    Reference Document Search & Sources:
    - Use Google Search to find the official "Ordenanza del Plano Regulador Comunal" (PRC) or "Plan Regulador Metropolitano" (PRM) for ${commune}.
    - Primary Source: Official Municipal PRC documents and Zoning Maps.
    - Secondary Source: OGUC (Ordenanza General de Urbanismo y Construcciones) for national standards.
    - If the commune is "Concepción", you may also reference: http://www.concepcion.cl/Obras/instru-plan-regulador/prcc.pdf
    
    Deep Analysis Requirements:
    1. SURFACE VERIFICATION (CRITICAL): Verify the land surface using the ROL SII and Address. 
       - Compare the user-provided surface (${m2_total} m2) with official records if found.
       - Identify if there are mandatory discounts (e.g., proximity to railways, public utility strips, or expropriations).
    2. CORNER ANALYSIS: If it is a corner lot (${is_corner ? "SÍ" : "NO"}), identify specific benefits or restrictions (e.g., higher constructability, different setbacks, or mandatory chamfers/ochavos).
       - IMPORTANT: Distinguish the streets forming the corner. Identify if they are "Troncal", "Colectora", "Servicio" or "Local". This classification affects the "Línea Oficial" and "Antejardín".
    3. BOUNDARY & LIMITS (DESLINDES): Analyze the zoning map and ordinance for specific boundary constraints. 
       - Check for proximity to RAILWAYS (Vías férreas), HIGHWAYS, or WATERCOURSES.
       - Identify mandatory buffer zones (franjas de protección/restricción). Example: Proximity to a train track often requires a 20m+ non-buildable strip.
    4. SITE-SPECIFIC CONSTRAINTS: Look for "Zonas de Riesgo" (Flood, Landslide) or "Zonas de Conservación Histórica" that apply specifically to this ROL or block.
    
    Context for PRC Structure:
    The regulatory ordinance (Ordenanza del Plano Regulador) defines zones and for each zone, it specifies:
    - USOS DE SUELO (Permitted, Conditioned, Prohibited).
    - CONDICIONES DE SUBDIVISIÓN Y EDIFICACIÓN:
        - Superficie Predial Mínima.
        - Coeficiente Máximo de Ocupación de Suelo.
        - Coeficiente Máximo de Constructibilidad.
        - Altura Máxima de Edificación.
        - Sistema de Agrupamiento (Aislado, Pareado, Continuo).
        - Antejardín Mínimo.
        - Densidad Habitacional Máxima.

    Specific Knowledge for Concepción (Reference from Official CIP):
    - For high-density zones (like ZM-1, CC, or similar in the center):
        - Superficie Predial Mínima: 400 m2.
        - Coeficiente de Ocupación de Suelo: 0.6 (general).
        - Coeficiente de Constructibilidad: 4.0.
        - Altura Máxima de Edificación: 27m (equivalente a 9 pisos).
        - Altura Máxima de Edificación Continua: 9m.
        - Antejardín Mínimo: 4m (general).
        - Densidad Bruta Máxima: Libre.
        - Incentivos (Art 40 O.L.P.R.C.C.): Permiten aumentar altura continua a 15m (5 pisos) y ocupación al 80% bajo ciertas condiciones (ej: capa vegetal en cubierta).
    
    Specific Knowledge for San Pedro de la Paz (Parking Standards):
    - Vivienda (Unifamiliar y Colectiva): 1 por unidad de vivienda.
    - Industrias y bodegas: 2, con incremento de 1 cada 30 m2 construidos.
    - Talleres Mecánicos: 2 por cada 50 m2 construidos.
    - Comercio (Supermercado, Grandes Tiendas, Centros Comerciales): 1 cada 30 m2 construidos.
    - Estaciones de Servicios Automotor: 1 por cada 50 m2 construidos.
    - Centros de Servicio Automotor: 1 cada 25 m2 construidos.
    - Discotecas y clubes nocturnos: 1 cada 4 personas (carga > 40 pers).
    - Cafeterías, pub, restoranes: 1 cada 6 personas (carga > 40 pers).
    - Cines, teatro, auditorios: 1 cada 15 personas.
    - Recintos religiosos: 1 cada 20 personas.
    - Bibliotecas, galerías: 1 cada 60 m2 construidos.
    - Gimnasios: 1 cada 15 m2 construidos (mínimo 4).
    - Educación (Básica/Media): 1 cada 45 alumnos + 1 cada 4 docentes.
    - Educación (Técnica/Superior): 2 cada 30 alumnos + 2 cada 4 docentes.
    - Clínicas y hospitales: 3 cada 5 camas (mínimo 5).
    - Consultorios: 2 cada 60 m2 construidos (mínimo 5).
    - Oficinas en general, bancos: 2 cada 50 m2 construidos.
    - Clubes Sociales, juntas de vecino: 1 cada 50 m2 construidos.
    
    Specific Knowledge for San Pedro de la Paz (Zona ZM-1):
    - Usos Permitidos: Residencial, Equipamiento (Científico, Comercio -excepto discotecas-, Culto y Cultura, Deporte -excepto estadios-, Educación -excepto rehabilitación-, Esparcimiento -excepto zoológicos-, Salud -excepto cementerios-, Seguridad -excepto cárceles-, Servicios, Social), Actividades Productivas (solo talleres inofensivos/molestos).
    - Superficie Predial Mínima: 1.000 m2.
    - Coef. Ocupación Suelo: 1.0 (vivienda extensión), 0.8 (vivienda altura y otros).
    - Coef. Constructibilidad: 2.5 (vivienda extensión y otros), 12.0 (vivienda altura).
    - Altura Máxima: 45 m.
    - Sistema Agrupamiento: Aislado, Pareado y Continuo.
    - Altura Máxima Continuidad: 10.5 metros.
    - Porcentaje Máximo Pareo: 100% (vivienda extensión), 50% (otros).
    - Porcentaje Máximo Continuidad: 100% (vivienda extensión), 60% (otros).
    - Adosamiento: Se permite.
    - Distanciamiento: Según OGUC y 4m para edificación en altura en 1° y 2° piso.
    
    CRITICAL CORNER CONSTRAINT (San Pedro de la Paz):
    - En el caso de propiedades en ESQUINA, la superficie total construida NO puede exceder la capacidad permitida por la dotación de estacionamientos exigida. Este límite es mandatorio y debe prevalecer sobre el coeficiente de constructibilidad si este último permitiera una superficie mayor.
    
    Instructions:
    1. Extract the specific values for the identified zone from the PRC of ${commune}.
    2. If a User-Provided Zoning Code is present and valid, prioritize using it.
    3. Use the ROL and Address to pinpoint the property on the zoning map if possible.
    
    Provide the following data in JSON format:
    - zoning_code: The specific zone code (e.g., ZH-1, RM-2, CPH, CC, H-1, ESC1, ZM-1).
    - max_height: Maximum built height allowed in meters (number).
    - constructability_index: Coefficient of constructability (number).
    - land_use_coefficient: Land occupation coefficient (number, e.g., 0.6). Reference the OGUC and local PRC.
    - property_usage: Primary allowed usage (Habitacional, Comercial, Agrícola, or Esparcimiento o Cultura).
    - setback: Minimum setback (Antejardín) in meters or description (string). Include corner-specific setbacks if applicable.
    - parking_quota: Specific parking quotas for the commune and zone (string).
    - recent_amendments: Any recent modifications or amendments (Enmiendas) to the PRC (2024-2025) (string).
    - occupancy_calculation: A brief explanation of the ground floor occupancy based on the lot size (${m2_total || "unknown"} m2) and if it is a corner lot (${is_corner ? "SÍ" : "NO"}). Include any boundary restrictions found (e.g., "Se debe descontar franja de protección de ferrocarriles").
    - constructability_calculation: A brief explanation of the total buildable area based on the lot size (${m2_total || "unknown"} m2).
    - height_by_surface: The maximum number of floors allowed specifically based on the surface area of this lot (${m2_total || "unknown"} m2) and if it is a corner lot (${is_corner ? "SÍ" : "NO"}).
    - allowed_buildable_surface: The total surface area (m2) that can be built on this lot based on the constructability index and lot size (${m2_total || "unknown"} m2). Adjust for corner benefits or boundary restrictions.
    - verified_land_surface: The official land surface (m2) found in records (SII/PRC) for this ROL/Address. If not found, use the provided value but explain in notes.
    - surface_verification_notes: Observations about the surface (e.g., "Coincide con SII", "Se detecta diferencia con plano regulador", "Franja de ferrocarril descuenta 50m2").
    - min_lot_size: Superficie predial mínima (number).
    - upper_floor_occupancy_coefficient: Coeficiente de ocupación de los pisos superiores (number).
    - max_height_continuous: Altura máxima de edificación continua en metros (number).
    - max_depth_continuous: Profundidad máxima de edificación continua en metros (number).
    - max_height_isolated_over_continuous: Altura máxima de edificación aislada sobre la continua en metros (number).
    - grouping: Sistema de agrupamiento (Aislado, Pareado, Continuo).
    - retranqueo: Retranqueo (string).
    - adosamiento: Adosamiento (string).
    - distanciamiento: Distanciamiento (string).
    - antejardin: Antejardín (string).
    - incentivos: Incentivos (Art 40 O.L.P.R.C.C.) (string).
    - condicion_incentivo: Condición para acceder al incentivo (string).
    - street_classification: The official classification of the main street (Troncal, Colectora, Servicio, Local).
    - corner_street_classification: The official classification of the corner street if applicable.
    
    Important: If you find multiple sub-zones, provide the data for the most restrictive or most common one in that specific sector.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            zoning_code: { type: Type.STRING },
            max_height: { type: Type.NUMBER },
            constructability_index: { type: Type.NUMBER },
            land_use_coefficient: { type: Type.NUMBER },
            property_usage: { type: Type.STRING },
            setback: { type: Type.STRING },
            parking_quota: { type: Type.STRING },
            recent_amendments: { type: Type.STRING },
            occupancy_calculation: { type: Type.STRING },
            constructability_calculation: { type: Type.STRING },
            height_by_surface: { type: Type.STRING },
            allowed_buildable_surface: { type: Type.STRING },
            verified_land_surface: { type: Type.NUMBER },
            surface_verification_notes: { type: Type.STRING },
            street_classification: { type: Type.STRING },
            corner_street_classification: { type: Type.STRING },
            min_lot_size: { type: Type.NUMBER },
            upper_floor_occupancy_coefficient: { type: Type.NUMBER },
            max_height_continuous: { type: Type.NUMBER },
            max_depth_continuous: { type: Type.NUMBER },
            max_height_isolated_over_continuous: { type: Type.NUMBER },
            grouping: { type: Type.STRING },
            retranqueo: { type: Type.STRING },
            adosamiento: { type: Type.STRING },
            distanciamiento: { type: Type.STRING },
            antejardin: { type: Type.STRING },
            incentivos: { type: Type.STRING },
            condicion_incentivo: { type: Type.STRING }
          },
          required: ["zoning_code", "max_height", "constructability_index", "land_use_coefficient", "property_usage", "setback", "parking_quota", "recent_amendments", "occupancy_calculation", "constructability_calculation", "height_by_surface", "allowed_buildable_surface", "verified_land_surface", "surface_verification_notes", "min_lot_size", "upper_floor_occupancy_coefficient", "max_height_continuous", "max_depth_continuous", "max_height_isolated_over_continuous", "grouping", "retranqueo", "adosamiento", "distanciamiento", "antejardin", "incentivos", "condicion_incentivo"]
        },
        tools: [
          { urlContext: {} },
          { googleSearch: {} }
        ]
      }
    });

    if (!response.text) {
      throw new Error("La IA no devolvió texto para la normativa.");
    }

    console.log("Regulatory data response:", response.text);
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching regulatory data:", error);
    throw error;
  }
}

export async function estimatePropertyValue(data: PropertyData, ufValue: number): Promise<ValuationResult> {
  const ai = getAi();
  const prompt = `
    Act as a Senior Real Estate Appraiser (Tasador Inmobiliario Senior) and Data Scientist for the Chilean market.
    Your goal is to provide a ${data.valuation_type === 'professional' ? 'PREMIUM professional valuation (AVM) report' : 'BASIC valuation estimate'}.
    ${data.valuation_type === 'professional' ? 'Include a detailed SWOT analysis, technical breakdown, and municipal analysis.' : 'Provide a quick, concise estimate.'}

    Reference Document for Urban Norms:
    - http://www.concepcion.cl/Obras/instru-plan-regulador/prcc.pdf


    Property Details:
    - Client: ${data.client_name || "Not specified"}
    - Type: ${data.property_type}
    - Address: ${data.address_street || ""} ${data.address_number || ""} (Clasificación: ${data.street_classification || "N/A"})
    - Is Corner: ${data.is_corner ? "Yes" : "No"}
    - Corner Street: ${data.corner_street || "N/A"} (Clasificación: ${data.corner_street_classification || "N/A"})
    - Commune: ${data.commune}
    - Sector/Neighborhood: ${data.sector || "Not specified"}
    - Sector Description: ${data.sector_description || "Not specified"}
    - Rol SII (Combined): ${data.rol_sii || "Not provided"}
    - Rol SII (Manzana): ${data.rol_manzana || "Not provided"}
    - Rol SII (Predio): ${data.rol_predio || "Not provided"}
    - Avalúo Fiscal (CLP): ${data.avaluo_fiscal || "Not provided"}
    - GIS Reference ID: ${data.gis_reference_id || "Not provided"}
    - Zoning Code (Plano Regulador): ${data.zoning_code || "Not specified"}
    - Destino (Usage): ${data.property_usage || "Not specified"}
    - Useful m2: ${data.m2_useful}
    - Total m2 (Land/Total): ${data.m2_total}
    - Bedrooms: ${data.bedrooms}
    - Bathrooms: ${data.bathrooms}
    - Parking: ${data.parking}
    - Storage: ${data.storage}
    - Year Built: ${data.year_built || "Unknown"}
    - Orientation: ${data.orientation || "Unknown"}
    - Floors in Building: ${data.floors || "Unknown"}
    - Amenities: ${data.amenities?.join(", ") || "None"}
    - Sustainability Features: ${data.sustainability_features?.join(", ") || "None"}
    - Project Status: ${data.project_status || "Unknown"}
    - Topography (for land): ${data.topography || "N/A"}
    - Frontage (meters): ${data.frontage_m || "N/A"}
    - Max Built Height (Altura Construida): ${data.max_height || "Not specified"}
    - Height by Surface (Altura según superficie): ${data.height_by_surface || "N/A"}
    - Continuous Building Details: ${data.continuous_building_details || "N/A"}
    - Allowed Buildable Surface: ${data.allowed_buildable_surface || "N/A"}
    - Constructability Index: ${data.constructability_index || "Not specified"}
    - Land Use Coefficient (Coef. Ocupación Suelo): ${data.land_use_coefficient || "Not specified"}
    - Min Lot Size: ${data.min_lot_size || "N/A"} m2
    - Min Frontage: ${data.min_frontage || "N/A"} m
    - Density: ${data.density || "N/A"}
    - Setback (Antejardín): ${data.setback || "N/A"}
    - Antejardín (Detalle): ${data.antejardin || "N/A"}
    - Retranqueo: ${data.retranqueo || "N/A"}
    - Adosamiento: ${data.adosamiento || "N/A"}
    - Distanciamiento: ${data.distanciamiento || "N/A"}
    - Incentivos: ${data.incentivos || "N/A"}
    - Condición Incentivo: ${data.condicion_incentivo || "N/A"}
    - Grouping (Agrupamiento): ${data.grouping || "N/A"}
    - CIP Status: ${data.cip_status || "N/A"}
    - Expropriation Status: ${data.expropriation_status || "N/A"}
    
    Instructions for Valuation:
    - Analyze the potential for higher construction (Height Potential) based on municipal ordinances as an additional valuation benefit (plusvalía/valor agregado).
    - When referring to height, always use "built height" (altura construida).
    
    Technical Specifications:
    - Access: ${data.access_description || "N/A"}
    - Distribution: ${data.distribution_description || "N/A"}
    - Structure (Muros): ${data.structure_muros || "N/A"}
    - Structure (Entrepiso): ${data.structure_entrepiso || "N/A"}
    - Structure (Escalera): ${data.structure_escalera || "N/A"}
    - Structure (Techumbre/Cubierta): ${data.structure_techumbre || "N/A"}
    - Finishes (Walls): ${data.finishes_walls || "N/A"}
    - Finishes (Floors): ${data.finishes_floors || "N/A"}
    - Finishes (Ceilings): ${data.finishes_ceilings || "N/A"}
    - Sanitary Artifacts: ${data.sanitary_artifacts || "N/A"}
    - Land Shape: ${data.land_shape || "N/A"}
    - Land Topography: ${data.land_topography || "N/A"}
    - Front/Depth Ratio: ${data.front_depth_ratio || "N/A"}
    
    Municipal Status:
    - Permit: ${data.permit_number || "N/A"} (${data.permit_date || "N/A"})
    - Reception: ${data.reception_number || "N/A"} (${data.reception_date || "N/A"})
    
    Valuation Factors:
    - State of Conservation: ${data.conservation_state || "Bueno"}
    - Construction Quality: ${data.construction_quality || "Media"}
    - View Quality: ${data.view_quality || "Parcial"}
    - Security Level: ${data.security_level || "Media"}
    - Noise Level: ${data.noise_level || "Moderado"}
    - Kitchen: ${data.kitchen_description || "N/A"}
    - Bathrooms: ${data.bathrooms_description || "N/A"}
    - RTV/Reception Status: ${data.rtv_status || "N/A"}
    - Proximity to Metro: ${data.proximity_to_metro ? "Yes" : "No"}
    - Proximity to Services: ${data.proximity_to_services?.join(", ") || "None"}
    
    Rural/Agricultural Specifics (if applicable):
    - Number of Lots: ${data.num_lots || "N/A"}
    - Water Availability: ${data.water_availability || "N/A"}
    - Electricity System: ${data.electricity_system || "N/A"}
    - Materiality (Walls): ${data.materiality_walls || "N/A"}
    - Materiality (Roof): ${data.materiality_roof || "N/A"}
    - Heating System: ${data.heating_system || "N/A"}
    - Complementary Works: ${data.complementary_works?.join(", ") || "None"}
    - Additional Notes/Context: ${data.notes || "None"}
    - Advantages (Fortalezas): ${data.advantages || "None"}
    - Disadvantages (Debilidades): ${data.disadvantages || "None"}

    Valuation Methodology (Inspired by Chilean Standards):
    1. Market Comparison (Metodología de Comparación): Analyze recent transactions and listings in ${data.commune} for ${data.property_type}.
    2. Replacement Cost (Coste de Reposición): For buildings, estimate construction cost minus depreciation.
    3. Residual Method (Metodología Residual) / Highest and Best Use (HBU): CRITICAL when land potential is high. If the land value (based on maximum potential development allowed by the "Plano Regulador Comunal" (PRC) and "OGUC") is higher than the value of the existing building + land as a single unit, the valuation MUST prioritize the land potential. This is especially relevant for houses on large lots with high constructability.
    4. Urban Norms Analysis: Consider specific constraints like:
       - Coefficient of Constructability (Coeficiente de Constructibilidad).
       - Land Occupation Coefficient (Coeficiente de Ocupación de Suelo).
       - Maximum Height (Altura Máxima).
       - Density (Densidad Máxima).
       - Setbacks and Separations (Rasantes y Distanciamientos).

    Regulatory & Market Context:
    - Current UF Value: ${ufValue} CLP.
    - Consider the "Plano Regulador Comunal" (PRC) constraints for ${data.commune}${data.sector ? ` in ${data.sector}` : ""}.
    - Specific Knowledge for Concepción (Reference from Official CIP):
        - For high-density zones: Constructability 4.0, Max Height 27m (9 floors), Continuous Height 9m, Land Occupancy 0.6.
        - Article 40 Incentives: Can increase continuous height to 15m and occupancy to 80% with green roofs.
    - Specific Knowledge for San Pedro de la Paz (Parking Standards):
        - Vivienda: 1 por unidad.
        - Comercio: 1 cada 30 m2.
        - Oficinas: 2 cada 50 m2.
        - Educación (Básica/Media): 1 cada 45 alumnos + 1 cada 4 docentes.
        - Salud (Clínicas): 3 cada 5 camas.
        - CRITICAL CORNER CONSTRAINT: En esquinas, la superficie construida está limitada por la capacidad de estacionamientos permitidos.
    - If Rol SII is provided, consider its impact on tax assessment and specific location.
    - Specific Knowledge for Concepción: Manzana 1172 corresponds to zone "ESC1". CPH is the most common zone in the "Centro" sector.
    - Analyze the development potential based on the zoning code (${data.zoning_code || "Not specified"}).
    - Use the user-provided urban norms if available: 
        - Max Height (${data.max_height || "Not specified"})
        - Constructability Index (${data.constructability_index || "Not specified"})
        - Land Use Coefficient (${data.land_use_coefficient || "Not specified"})
        - Parking Quota (${data.parking_quota || "Not specified"})
        - Recent Amendments (${data.recent_amendments || "Not specified"})
        - Occupancy Calculation (${data.occupancy_calculation || "Not specified"})
        - Constructability Calculation (${data.constructability_calculation || "Not specified"})
    - Focus on the specific dynamics of ${data.commune} (e.g., proximity to Metro, security trends, new developments).
    - Especial énfasis en Biobío (Concepción, San Pedro de la Paz) y Santiago (Región Metropolitana).

    Provide a professional valuation in JSON format. 
    The "market_context" MUST explicitly mention how the urban norms (normas urbanísticas) or the zoning code influenced the final value.
    The "regulatory_analysis" MUST verify if the provided Zoning Code (${data.zoning_code || "Not specified"}), Max Height (${data.max_height || "Not specified"}), and Constructability Index (${data.constructability_index || "Not specified"}) are consistent with the known "Plano Regulador Comunal" (PRC) of ${data.commune}.
    
    ADDITIONAL SECTIONS REQUIRED:
    1. "cabida_informe": Estimate the maximum buildable area (m²) and number of floors based on the zoning code (${data.zoning_code || "Not specified"}) and total land size (${data.m2_total} m²).
    2. "restricciones_analisis": Identify potential risk zones (flood, landslide), expropriations, or heritage protection in ${data.commune}${data.sector ? ` in ${data.sector}` : ""}.
    3. "plusvalia_calculo": Estimate the annual appreciation factor (%) and explain how the environment (new infrastructure, metro, etc.) will impact future value.

    Valuation Type: ${data.valuation_type}
    ${data.valuation_type === 'professional' ? `
    PROFESSIONAL MODE REQUIRED:
    - Provide a detailed SWOT (FODA) analysis of the property.
    - Provide 3 realistic comparable properties in the area with estimated prices, m2, and distances.
    - Provide a final strategic recommendation for the owner/investor.
    - Provide a detailed "valuation_breakdown" (Desglose de Tasación) including:
        - Land (Terreno): m2, UF/m2, Total UF, and description.
        - Buildings (Construcciones): Total m2, Average UF/m2, Total UF, and a list of details per floor or structure (e.g., Piso 1, Piso 2).
        - Complementary Works (Obras Complementarias): Total UF and description.
        - The sum of these must equal the "estimated_price_uf".
    ` : 'BASIC MODE: Provide a concise valuation with market context and 3 basic comparables (price_uf, m2, distance_km, source).'}

    If they are inconsistent (e.g., a height of 50 floors in a low-density residential zone), mark "is_consistent" as false and explain why in "observations".
  `;

  console.log("Iniciando tasación para:", data.commune);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimated_price_uf: { type: Type.NUMBER },
            confidence_score: { type: Type.NUMBER },
            market_context: { type: Type.STRING },
            regulatory_analysis: {
              type: Type.OBJECT,
              properties: {
                compliance_score: { type: Type.NUMBER },
                observations: { type: Type.STRING },
                is_consistent: { type: Type.BOOLEAN }
              },
              required: ["compliance_score", "observations", "is_consistent"]
            },
            cabida_informe: {
              type: Type.OBJECT,
              properties: {
                max_floors: { type: Type.NUMBER },
                max_m2_buildable: { type: Type.NUMBER },
                observations: { type: Type.STRING }
              },
              required: ["max_floors", "max_m2_buildable", "observations"]
            },
            restricciones_analisis: {
              type: Type.OBJECT,
              properties: {
                risk_zones: { type: Type.STRING },
                expropriations: { type: Type.STRING },
                heritage_protection: { type: Type.STRING },
                observations: { type: Type.STRING }
              },
              required: ["risk_zones", "expropriations", "heritage_protection", "observations"]
            },
            plusvalia_calculo: {
              type: Type.OBJECT,
              properties: {
                estimated_annual_appreciation: { type: Type.NUMBER },
                future_factors: { type: Type.STRING },
                market_projection: { type: Type.STRING }
              },
              required: ["estimated_annual_appreciation", "future_factors", "market_projection"]
            },
            comparables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  price_uf: { type: Type.NUMBER },
                  m2: { type: Type.NUMBER },
                  distance_km: { type: Type.NUMBER },
                  source: { type: Type.STRING }
                },
                required: ["price_uf", "m2", "distance_km", "source"]
              }
            },
            professional_analysis: {
              type: Type.OBJECT,
              properties: {
                swot: {
                  type: Type.OBJECT,
                  properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["strengths", "weaknesses", "opportunities", "threats"]
                },
                comparables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      address: { type: Type.STRING },
                      price_uf: { type: Type.NUMBER },
                      m2: { type: Type.NUMBER },
                      distance_km: { type: Type.NUMBER }
                    },
                    required: ["address", "price_uf", "m2", "distance_km"]
                  }
                },
                final_recommendation: { type: Type.STRING }
              }
            },
            valuation_breakdown: {
              type: Type.OBJECT,
              properties: {
                land: {
                  type: Type.OBJECT,
                  properties: {
                    m2: { type: Type.NUMBER },
                    uf_m2: { type: Type.NUMBER },
                    total_uf: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    form_factor: { type: Type.NUMBER },
                    location_factor: { type: Type.NUMBER }
                  },
                  required: ["m2", "uf_m2", "total_uf", "description"]
                },
                buildings: {
                  type: Type.OBJECT,
                  properties: {
                    m2: { type: Type.NUMBER },
                    uf_m2_avg: { type: Type.NUMBER },
                    total_uf: { type: Type.NUMBER },
                    details: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          m2: { type: Type.NUMBER },
                          uf_m2: { type: Type.NUMBER },
                          total_uf: { type: Type.NUMBER }
                        },
                        required: ["description", "m2", "uf_m2", "total_uf"]
                      }
                    }
                  },
                  required: ["m2", "uf_m2_avg", "total_uf", "details"]
                },
                complementary_works: {
                  type: Type.OBJECT,
                  properties: {
                    total_uf: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                  },
                  required: ["total_uf", "description"]
                },
                total_uf: { type: Type.NUMBER }
              }
            }
          },
          required: ["estimated_price_uf", "confidence_score", "market_context", "regulatory_analysis", "cabida_informe", "restricciones_analisis", "plusvalia_calculo", "comparables"]
        },
        tools: [
          { urlContext: {} },
          { googleSearch: {} }
        ]
      },
    });

    if (!response.text) {
      console.error("Empty response from Gemini");
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    console.log("Gemini raw response text:", response.text);
    
    let result;
    try {
      result = JSON.parse(response.text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw text:", response.text);
      throw new Error("Error al procesar la respuesta de la IA. Por favor, intenta de nuevo.");
    }

    const estimated_price_uf = Number(result.estimated_price_uf);
    
    if (isNaN(estimated_price_uf) || estimated_price_uf <= 0) {
      console.error("Invalid price from Gemini result:", result);
      throw new Error("La IA no pudo calcular un precio válido. Por favor, intenta de nuevo con más detalles.");
    }
    
    return {
      ...result,
      estimated_price_uf,
      estimated_price_clp: Math.round(estimated_price_uf * ufValue),
      valuation_type: data.valuation_type,
      property_data: data
    };
  } catch (error) {
    console.error("Detailed Gemini API error:", error);
    throw error;
  }
}
