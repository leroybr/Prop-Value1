import { GoogleGenAI, Type } from "@google/genai";
import { SearchFilters } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function interpretSearchQuery(query: string): Promise<SearchFilters> {
  if (!query || query.trim().length < 3) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Interpreta la siguiente búsqueda de propiedades de lujo y extrae filtros en formato JSON: "${query}". 
      Busca ubicación, precio mínimo, precio máximo y número de habitaciones.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            minPrice: { type: Type.NUMBER },
            maxPrice: { type: Type.NUMBER },
            beds: { type: Type.NUMBER },
          },
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini interpretation error:", error);
    return { location: query };
  }
}
