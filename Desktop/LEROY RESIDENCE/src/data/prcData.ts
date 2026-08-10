export interface ZonaDetalle {
  nombre: string;
  norma: string;
  permitidos: string[];
  prohibidos: string[];
  constructibilidad: string;
  ocupacion_suelo: string;
  altura_maxima: string;
  densidad_maxima: string;
}

export interface PRCData {
  manzanas_prc: Record<string, Record<string, string>>;
  detalles_zonas: Record<string, Record<string, ZonaDetalle>>;
}

export const prcData: PRCData = {
  "manzanas_prc": {
    "concepcion": {
      "50": "H2",
      "102": "C1",
      "103": "C1",
      "104": "H2",
      "105": "CPH",
      "106": "CPH1",
      "107": "CCC"
    },
    "san_pedro_de_la_paz": {
      "2101": "ZH-1",
      "2102": "ZH-2",
      "2103": "ZH-3",
      "2104": "ZH-4",
      "2105": "HE"
    }
  },
  "detalles_zonas": {
    "concepcion": {
      "C1": {
        "nombre": "Centro de servicios y equipamiento",
        "norma": "Decreto Alc. N°148 (PRC Concepción)",
        "permitidos": [
          "Residencial",
          "Equipamiento: comercio, salud, educación",
          "Actividades productivas"
        ],
        "prohibidos": [
          "Todos los usos no mencionados como permitidos"
        ],
        "constructibilidad": "2.5",
        "ocupacion_suelo": "60% (0.6)",
        "altura_maxima": "Según rasante y edificación continua",
        "densidad_maxima": "450 hab/ha"
      },
      "H2": {
        "nombre": "Zona Habitacional de Densidad Media Alta",
        "norma": "Plan Regulador Comunal Concepción",
        "permitidos": [
          "Residencial",
          "Equipamiento menor",
          "Áreas verdes"
        ],
        "prohibidos": [
          "Industrias y almacenamiento molesto"
        ],
        "constructibilidad": "1.8",
        "ocupacion_suelo": "60% (0.6)",
        "altura_maxima": "15 metros (5 pisos) o según rasante",
        "densidad_maxima": "320 hab/ha"
      },
      "CPH": {
        "nombre": "Zona Centro y Plazas Históricas",
        "norma": "Modificación PRC Concepción (Diario Oficial / BCN 2021)",
        "permitidos": [
          "Vivienda", "Residencial Hospedaje", "Hogares de acogida", "Científico", 
          "Comercio (excepto los excluidos)", "Culto y Cultura", 
          "Deporte (solo gimnasios y piscinas)", "Educación Superior, Técnica y Prebásica", 
          "Esparcimiento (solo casino)", "Salud (solo clínica y consultorio)", 
          "Seguridad (solo unidades policiales)", "Servicios", "Social", "Espacio Público", "Área Verde"
        ],
        "prohibidos": [
          "Centro comercial cerrado", "Grandes tiendas", "Supermercados", "Mercados", 
          "Estaciones o centros de servicio automotor", "Venta de combustible", 
          "Todos los no señalados como permitidos"
        ],
        "constructibilidad": "5.0",
        "ocupacion_suelo": "0.6",
        "altura_maxima": "15 metros (equivalente a 5 pisos)",
        "densidad_maxima": "Libre"
      },
      "CPH1": {
        "nombre": "Zona Centro y Plazas Históricas - Subzona 1",
        "norma": "Modificación PRC Concepción (Diario Oficial / BCN 2021)",
        "permitidos": [
          "Vivienda", "Residencial Hospedaje", "Hogares de acogida", "Científico", 
          "Comercio (solo locales comerciales)", "Culto y Cultura", 
          "Deporte (solo gimnasios y piscinas)", "Educación Superior, Técnica y Prebásica", 
          "Esparcimiento (solo casino)", "Salud (solo clínica y consultorio)", 
          "Seguridad (solo unidades policiales)", "Servicios", "Social", "Espacio Público", "Área Verde"
        ],
        "prohibidos": ["Todos los no señalados como permitidos"],
        "constructibilidad": "5.0",
        "ocupacion_suelo": "0.6",
        "altura_maxima": "15 metros (equivalente a 5 pisos)",
        "densidad_maxima": "Libre"
      },
      "CCC": {
        "nombre": "Zona Centro Cívico Comercial y de Servicios",
        "norma": "Modificación PRC Concepción (Diario Oficial / BCN 2021)",
        "permitidos": [
          "Vivienda", "Residencial Hospedaje", "Hogares de acogida", "Científico", 
          "Comercio (excepto centro comercial cerrado y discoteca)", "Culto y Cultura", 
          "Deporte (solo gimnasios y piscinas)", "Educación", "Esparcimiento (solo casino)", 
          "Salud (excepto crematorio y cementerio)", "Seguridad (unidades policiales y bomberos)", 
          "Servicios", "Social", "Actividad Productiva (solo talleres inofensivos)", 
          "Espacio Público", "Área Verde"
        ],
        "prohibidos": [
          "Centro comercial cerrado", "Discotecas", "Crematorios", "Cementerios", 
          "Todos los no señalados como permitidos"
        ],
        "constructibilidad": "5.0",
        "ocupacion_suelo": "0.8 (0.4 para educación básica y media)",
        "altura_maxima": "27 metros (equivalente a 9 pisos)",
        "densidad_maxima": "Libre"
      }
    },
    "san_pedro_de_la_paz": {
      "ZH-1": {
        "nombre": "Zona Habitacional Consolidada",
        "norma": "Plan Regulador Comunal San Pedro de la Paz (Decreto Alc. N°1023949)",
        "permitidos": [
          "Residencial (Vivienda)",
          "Equipamiento de escala vecinal y comunal de Salud, Educación, Culto",
          "Áreas Verdes y Espacios Públicos"
        ],
        "prohibidos": [
          "Actividades productivas molesas o insalubres",
          "Comercio industrial",
          "Talleres mecánicos pesados"
        ],
        "constructibilidad": "1.2",
        "ocupacion_suelo": "0.5 (50%)",
        "altura_maxima": "4 pisos (12 metros)",
        "densidad_maxima": "200 hab/ha"
      },
      "ZH-2": {
        "nombre": "Zona Habitacional de Densidad Media Alta",
        "norma": "Plan Regulador Comunal San Pedro de la Paz (Decreto Alc. N°1023949)",
        "permitidos": [
          "Vivienda residencial unifamiliar y colectiva",
          "Equipamiento menor comercial",
          "Áreas recreativas y deportivas de bajo impacto"
        ],
        "prohibidos": [
          "Comercio mayorista de alto tráfico",
          "Estaciones de servicio de combustible",
          "Talleres de mantenimiento vehicular",
          "Hospedajes masivos sin autorización expresa"
        ],
        "constructibilidad": "1.0",
        "ocupacion_suelo": "0.4 (40%)",
        "altura_maxima": "3 pisos (10.5 metros)",
        "densidad_maxima": "120 hab/ha"
      },
      "ZH-3": {
        "nombre": "Zona Habitacional Laguna Grande / Andalué",
        "norma": "Plan Regulador Comunal San Pedro de la Paz (Decreto Alc. N°1023949)",
        "permitidos": [
          "Vivienda en edificación aislada",
          "Equipamiento de escala de servicio, deporte y esparcimiento",
          "Hospedaje turístico selectivo"
        ],
        "prohibidos": [
          "Industrias de cualquier clasificación",
          "Depósitos y bodegas generales",
          "Talleres de carpintería y metalúrgica"
        ],
        "constructibilidad": "1.6",
        "ocupacion_suelo": "0.4 (40%)",
        "altura_maxima": "15 metros (5 pisos)",
        "densidad_maxima": "250 hab/ha"
      },
      "ZH-4": {
        "nombre": "Zona Habitacional de Expansión Costa",
        "norma": "Plan Regulador Comunal San Pedro de la Paz (Decreto Alc. N°1023949)",
        "permitidos": [
          "Vivienda de media densidad unifamiliar/colectiva",
          "Equipamiento de escala barrial y deporte al aire libre",
          "Servicios profesionales y comerciales"
        ],
        "prohibidos": [
          "Discotecas y centros de eventos ruidosos",
          "Actividades productivas peligrosas o molestas"
        ],
        "constructibilidad": "2.0",
        "ocupacion_suelo": "0.6 (60%)",
        "altura_maxima": "18 metros (6 pisos)",
        "densidad_maxima": "350 hab/ha"
      },
      "HE": {
        "nombre": "Equipamiento Especial y Servicios Generales",
        "norma": "Plan Regulador Comunal San Pedro de la Paz (Decreto Alc. N°1023949)",
        "permitidos": [
          "Oficinas de corporaciones gubernamentales y privadas",
          "Servicios médicos especializados",
          "Comercio minorista de mediana escala",
          "Gimnasios y campos recreativos"
        ],
        "prohibidos": [
          "Vivienda exclusiva (salvo vivienda de cuidador)",
          "Industrias y almacenamiento molesto"
        ],
        "constructibilidad": "1.5",
        "ocupacion_suelo": "0.5 (50%)",
        "altura_maxima": "12 metros (4 pisos)",
        "densidad_maxima": "150 hab/ha"
      }
    }
  }
};
