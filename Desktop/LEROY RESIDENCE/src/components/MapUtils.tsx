import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export interface RolDescompuesto {
  comunaCode: string;
  manzana: string;
  predio: string;
  formatoSii: string; // Formato estándar: "08101-01172-00004"
  valido: boolean;
}

// 🗺️ Diccionario Oficial Unificado según la codificación de Impuestos Internos (SII)
// Corregido milimétricamente para evitar solapamientos en el Gran Biobío y Santiago
export const COMUNA_CODES_VALUATION: Record<string, string> = {
  // 📍 Circuito Prioritario Gran Biobío
  "Concepción": "08101",
  "Coronel": "08105",
  "Chiguayante": "08103",
  "Penco": "08107",
  "Talcahuano": "08110",
  "Hualpén": "08112",
  "San Pedro de la Paz": "08115",

  // 📍 Región Metropolitana (Prefijo 13 de SUBDERE/SII para regularización)
  "Santiago": "13101",
  "Lo Barnechea": "13115",
  "Las Condes": "13114",
  "Ñuñoa": "13120",
  "Providencia": "13123",
  "Vitacura": "13132"
};

/**
 * Normaliza textos complejos eliminando diacríticos, acentos y espacios huérfanos.
 * Pensado para que la IA y las entradas de usuario no fallen por un tilde (ej: "Concepción" o "Hualpén")
 */
const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos de forma nativa
    .trim();
};

export const getComunaCodeForRol = (communeName: string): string => {
  if (!communeName) return "08101"; // Fallback predeterminado a Concepción Centro
  
  const nombreBuscado = normalizarTexto(communeName);
  if (nombreBuscado.includes("san pedro")) return "08115"; // Código oficial de San Pedro de la Paz (08115)
  
  const matched = Object.keys(COMUNA_CODES_VALUATION).find(k => {
    const llaveNormalizada = normalizarTexto(k);
    return llaveNormalizada === nombreBuscado || 
           nombreBuscado.includes(llaveNormalizada) ||
           llaveNormalizada.includes(nombreBuscado);
  });
  
  return matched ? COMUNA_CODES_VALUATION[matched] : "08101"; 
};

/**
 * 📐 Sanitiza y descompone un string de Rol chileno.
 * Garantiza de forma estricta que Manzana y Predio tengan 5 dígitos rellenados con ceros a la izquierda,
 * independientemente de cómo lo ingrese el usuario para calzar con las capas del SII.
 */
export const sanitizarYDescomponerRol = (
  rolRaw: string,
  codigoComunaPredeterminado: string = "08101"
): RolDescompuesto => {
  const limpio = rolRaw.replace(/[^0-9-]/g, "");
  const partes = limpio.split("-").filter(part => part.length > 0);

  const resultadoInvalido: RolDescompuesto = {
    comunaCode: "",
    manzana: "",
    predio: "",
    formatoSii: "",
    valido: false
  };

  if (partes.length === 2) {
    // Caso: "Manzana-Predio" (ej: "1172-4") -> Forzamos estandarización estructural
    const mzn = partes[0].trim().padStart(5, '0');
    const prd = partes[1].trim().padStart(5, '0');
    
    return {
      comunaCode: codigoComunaPredeterminado,
      manzana: mzn,
      predio: prd,
      formatoSii: `${codigoComunaPredeterminado}-${mzn}-${prd}`,
      valido: true
    };
  } else if (partes.length === 3) {
    // Caso: "Comuna-Manzana-Predio" (ej: "08101-1172-4") -> Aquí también se obliga el padStart
    const com = partes[0].trim().padStart(5, '0');
    const mzn = partes[1].trim().padStart(5, '0');
    const prd = partes[2].trim().padStart(5, '0');

    return {
      comunaCode: com,
      manzana: mzn,
      predio: prd,
      formatoSii: `${com}-${mzn}-${prd}`,
      valido: true
    };
  }

  return resultadoInvalido;
};

/**
 * 📐 Calcula el centroide geográfico de un conjunto de polígonos devueltos por el WFS.
 * Integra validaciones geométricas avanzadas para soportar polígonos simples y complejos (MultiPolygon).
 */
export const extraerCentroideDeFeatures = (features: any[]): [number, number] | null => {
  try {
    if (!features || features.length === 0) return null;
    
    let latSum = 0;
    let lngSum = 0;
    let totalPuntos = 0;

    const geom = features[0].geometry;
    if (!geom) return null;

    // Manejo inteligente de la profundidad de matrices según el estándar de geometría OGC
    let poligonos = [];
    if (geom.type === "MultiPolygon") {
      poligonos = geom.coordinates[0][0]; 
    } else if (geom.type === "Polygon") {
      poligonos = geom.coordinates[0];
    } else {
      return null;
    }

    poligonos.forEach((coord: number[]) => {
      if (coord && coord.length >= 2) {
        lngSum += coord[0]; // Estándar WFS GeoJSON: [Longitud, Latitud]
        latSum += coord[1];
        totalPuntos++;
      }
    });

    if (totalPuntos === 0) return null;
    return [latSum / totalPuntos, lngSum / totalPuntos];
  } catch (err) {
    console.error("Error crítico al calcular coordenadas de encuadre en el plano:", err);
    return null;
  }
};

// Componente para la transición fluida de la cámara con soporte de ajuste inteligente a polígonos (fitBounds)
export const ChangeView: React.FC<{
  center: [number, number];
  zoom: number;
  offsetPixels?: [number, number];
  polyCoords?: [number, number][];
}> = ({ center, zoom, offsetPixels, polyCoords }) => {
  const map = useMap();
  const [lat, lng] = center;
  
  React.useEffect(() => {
    let timeoutId: any;
    
    // Si existe geometría real de predio/polígono, ajustamos la cámara con fitBounds profesional
    if (polyCoords && polyCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(polyCoords);
        map.fitBounds(bounds, {
          padding: [80, 80], // Margen generoso para ver la calle completa, predios vecinos y media manzana
          maxZoom: 16.5,      // Zoom óptimo para no perder el contexto urbano en predios pequeños (ej: 60m²)
          animate: true,
          duration: 0.8
        });

        // Si hay desplazamiento lateral (offset) de barra lateral colapsable, lo aplicamos sobre el centro calculado
        if (offsetPixels) {
          timeoutId = setTimeout(() => {
            try {
              const currentCenter = map.getCenter();
              const currentZoom = map.getZoom();
              const projected = map.project(currentCenter, currentZoom);
              const offsetProjected = {
                x: projected.x + offsetPixels[0],
                y: projected.y + offsetPixels[1]
              };
              const unprojected = map.unproject(offsetProjected as any, currentZoom);
              map.setView([unprojected.lat, unprojected.lng], currentZoom, { animate: false });
              map.invalidateSize();
            } catch (e) {
              // Limpieza silenciosa
            }
          }, 850); // Pequeño delay para permitir que fitBounds se complete antes del offset
        } else {
          timeoutId = setTimeout(() => {
            try {
              map.invalidateSize();
            } catch (e) {}
          }, 400);
        }
        return () => {
          if (timeoutId) clearTimeout(timeoutId);
        };
      } catch (err) {
        console.warn("Error applying fitBounds in ChangeView:", err);
      }
    }

    // Fallback: Si no hay polígono trazado aún, usamos setView convencional
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      try {
        let targetCenter: [number, number] = [lat, lng];
        if (offsetPixels) {
          const projected = map.project([lat, lng], zoom);
          const offsetProjected = {
            x: projected.x + offsetPixels[0],
            y: projected.y + offsetPixels[1]
          };
          const unprojected = map.unproject(offsetProjected as any, zoom);
          targetCenter = [unprojected.lat, unprojected.lng];
        }
        map.setView(targetCenter, zoom);
        timeoutId = setTimeout(() => {
          try {
            if (map && (map as any)._container) {
              map.invalidateSize();
            }
          } catch (e) {
            // Silently allow post-unmount cleanup
          }
        }, 150);
      } catch (err) {
        console.warn("Leaflet setView error:", err);
      }
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lat, lng, zoom, map, polyCoords, offsetPixels ? offsetPixels.join(',') : undefined]);
  
  return null;
};

/**
 * Consulta la API cartográfica interna conectada a la capa base de catastro predial chileno.
 */
export const obtenerCartografiaManzana = async (comunaCode: string, manzana: string, predio?: string): Promise<any> => {
  try {
    // Robustez absoluta: Aseguramos limpieza y formato de 5 caracteres antes de subir el request a la API
    const comFormateada = String(comunaCode || "").trim().padStart(5, '0');
    const mznFormateada = String(manzana || "").trim().padStart(5, '0');
    const prdFormateada = predio ? String(predio || "").trim().padStart(5, '0') : "";
    
    let url = `/api/cartografia-manzana?comunaCode=${encodeURIComponent(comFormateada)}&manzana=${encodeURIComponent(mznFormateada)}`;
    if (prdFormateada) {
      url += `&predio=${encodeURIComponent(prdFormateada)}`;
    }
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);
    
    const rawText = await respuesta.text();
    if (!rawText || !rawText.trim().startsWith("{")) {
       throw new Error("El endpoint no retornó un GeoJSON estructurado.");
    }
    
    const data = JSON.parse(rawText);
    return data.features && data.features.length > 0 ? data.features : null;
  } catch (error: any) {
    console.warn("Info: Error en pasarela IDE/SII (conmutando a flujos locales de contingencia):", error.message || error);
    return null;
  }
};

/**
 * Consulta la zonificación oficial de Biobío mediante el FeatureServer del GeoIDE del MINVU.
 * Permite pasar de forma dinámica el nombre de la comuna para buscar su PRC particular.
 */
export const obtenerZonificacionMinvuBiobio = async (lat: number, lng: number, commune?: string): Promise<any> => {
  try {
    const communeQuery = commune ? `&commune=${encodeURIComponent(commune)}` : "";
    const url = `/api/minvu-zonificacion?lat=${lat}&lng=${lng}${communeQuery}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);
    const data = await respuesta.json();
    return data && data.features && data.features.length > 0 ? data.features : null;
  } catch (error: any) {
    console.warn("Error en pasarela client-side MINVU:", error.message || error);
    return null;
  }
};

