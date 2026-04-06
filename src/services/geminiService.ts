import { GoogleGenAI, Type } from "@google/genai";
import { PropertyData, ValuationResult } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    // Buscamos la clave en todas las fuentes posibles (Vercel y AI Studio)
    // Vite expondrá VITE_GEMINI_API_KEY automáticamente si existe.
    // También la definimos en vite.config.ts para mayor seguridad.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null);
    
    console.log("Verificando Clave Gemini:", apiKey ? "Detectada (OK)" : "No detectada (FALTA)");

    if (!apiKey || apiKey === "undefined") {
      console.error("ERROR CRÍTICO: No se encuentra la clave VITE_GEMINI_API_KEY.");
      throw new Error("Falta la clave de API. Si estás en Vercel, haz un 'Redeploy'. Si estás en AI Studio, agrégala en Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getRegulatoryData(commune: string, sector: string, rol: string): Promise<{
  zoning_code: string;
  max_height: number;
  constructability_index: number;
  land_use_coefficient: number;
  property_usage: string;
}> {
  console.log("Consultando normativa detallada para:", { commune, sector, rol });
  const ai = getAi();
  const prompt = `
    Act as a Senior Chilean Urban Planning Expert (Arquitecto Revisor DOM). 
    Your task is to provide the urban norms (normas urbanísticas) from the "Plano Regulador Comunal" (PRC) for the following location.
    
    Location:
    - Commune: ${commune}
    - Sector/Neighborhood: ${sector}
    - Rol SII: ${rol}
    
    Context for Concepción:
    - If the sector is "Centro", look for zones like "CPH" (Centro de Protección Histórica), "CC" (Centro Comercial), or "CU" (Centro Urbano).
    - CPH zones (Centro de Protección Histórica) are critical in Concepción Centro.
    
    Provide the following data in JSON format:
    - zoning_code: The specific zone code (e.g., ZH-1, RM-2, CPH, CC, H-1).
    - max_height: Maximum built height allowed in meters (number). If expressed in floors, assume 3 meters per floor.
    - constructability_index: Coefficient of constructability (number).
    - land_use_coefficient: Land occupation coefficient (number).
    - property_usage: Primary allowed usage (Habitacional, Comercial, Agrícola, or Esparcimiento o Cultura).
    
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
            property_usage: { type: Type.STRING }
          },
          required: ["zoning_code", "max_height", "constructability_index", "land_use_coefficient", "property_usage"]
        }
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


    Property Details:
    - Client: ${data.client_name || "Not specified"}
    - Type: ${data.property_type}
    - Commune: ${data.commune}
    - Sector/Neighborhood: ${data.sector || "Not specified"}
    - Sector Description: ${data.sector_description || "Not specified"}
    - Rol SII: ${data.rol_sii || "Not provided"}
    - Avalúo Fiscal (CLP): ${data.avaluo_fiscal || "Not provided"}
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
    - Constructability Index: ${data.constructability_index || "Not specified"}
    - Land Use Coefficient (Coef. Ocupación Suelo): ${data.land_use_coefficient || "Not specified"}
    - Min Lot Size: ${data.min_lot_size || "N/A"} m2
    - Min Frontage: ${data.min_frontage || "N/A"} m
    - Density: ${data.density || "N/A"}
    - Setback (Antejardín): ${data.setback || "N/A"}
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
    - If Rol SII is provided, consider its impact on tax assessment and specific location.
    - Analyze the development potential based on the zoning code (${data.zoning_code || "Not specified"}).
    - Use the user-provided urban norms if available: Max Height (${data.max_height || "Not specified"}), Constructability Index (${data.constructability_index || "Not specified"}).
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
                    description: { type: Type.STRING }
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
        }
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
