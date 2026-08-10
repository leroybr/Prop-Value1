export interface SiiParsedData {
  comuna: string; // e.g., "San Pedro de la Paz"
  rol: string; // e.g., "12030-2"
  manzana: string; // e.g., "12030"
  predio: string; // e.g., "2"
  direccion: string; // e.g., "PEDRO AGUIRRE CERDA 871 SAN PEDRO VIEJO"
  calle: string; // "PEDRO AGUIRRE CERDA"
  numero: string; // "871"
  sector: string; // "SAN PEDRO VIEJO"
  lat: number | null; // -36.83914
  lng: number | null; // -73.093251
  avaluoFiscal: number | null; // 298813159
  avaluoAfecto: number | null; // 238782449
  avaluoExento: number | null; // 60030710
  valorUnitarioM2: number | null; // 213424.0
  rangoSuperficie: string; // " 150 - 7.000 "
  destino: string; // "HABITACIONAL"
  supTerreno: number; // 0.0
  supConsMt2: number; // 0.0
}

export function titleCaseComuna(name: string): string {
  if (!name) return "";
  const lowercase = name.toLowerCase().trim();
  if (lowercase === "concepcion" || lowercase === "concepción") return "Concepción";
  if (lowercase === "san pedro de la paz") return "San Pedro de la Paz";
  if (lowercase === "talcahuano") return "Talcahuano";
  if (lowercase === "chiguayante") return "Chiguayante";
  if (lowercase === "hualpen" || lowercase === "hualpén") return "Hualpén";
  if (lowercase === "coronel") return "Coronel";
  if (lowercase === "penco") return "Penco";
  if (lowercase === "tome" || lowercase === "tomé") return "Tomé";
  if (lowercase === "lota") return "Lota";
  
  return name.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

export function parseSiiAddress(direccion: string): { calle: string; numero: string; sector: string } {
  if (!direccion) return { calle: "", numero: "", sector: "" };
  
  // Busca una secuencia de números que represente la numeración de la calle
  const match = direccion.match(/(.*?)\b(\d+)\b(.*)/);
  if (match) {
    const calle = match[1].trim();
    const numero = match[2].trim();
    const sector = match[3].trim();
    return { calle, numero, sector };
  }
  return { calle: direccion, numero: "", sector: "" };
}

/**
 * Parsea el JSON copiado del SII maps (getPredioNacional)
 * @param jsonText El texto en formato JSON
 */
export function parseSiiJson(jsonText: string): SiiParsedData | null {
  try {
    const parsed = JSON.parse(jsonText.trim());
    
    // El payload puede estar directo o envuelto en "data"
    const dataObj = parsed.data || parsed;
    
    if (!dataObj || (!dataObj.rol && !dataObj.manzana)) {
      return null;
    }
    
    const rawDireccion = dataObj.direccion || "";
    const { calle, numero, sector } = parseSiiAddress(rawDireccion);
    
    const rawComuna = dataObj.nombreComuna || "";
    const comuna = titleCaseComuna(rawComuna);
    
    const rawRol = dataObj.rol || `${dataObj.manzana || ""}-${dataObj.predio || ""}`;
    const [manzana, predio] = rawRol.split('-');
    
    return {
      comuna,
      rol: rawRol,
      manzana: manzana || String(dataObj.manzana || ""),
      predio: predio || String(dataObj.predio || ""),
      direccion: rawDireccion,
      calle,
      numero,
      sector,
      lat: (() => {
        const x = dataObj.ubicacionX;
        const y = dataObj.ubicacionY;
        // En Chile, latitud está entre -56 y -17.
        if (typeof x === "number" && x >= -56 && x <= -17) return x;
        if (typeof y === "number" && y >= -56 && y <= -17) return y;
        return null;
      })(),
      lng: (() => {
        const x = dataObj.ubicacionX;
        const y = dataObj.ubicacionY;
        // En Chile, longitud está entre -76 y -66.
        if (typeof x === "number" && x >= -76 && x <= -66) return x;
        if (typeof y === "number" && y >= -76 && y <= -66) return y;
        return null;
      })(),
      // Nota: A veces ubicacionX / ubicacionY pueden venir invertidos o en coordenadas UTM. 
      // Si vienen con latitud chilena (ej. -36.xxxx), el de valor negativo es la latitud y el otro longitud.
      // Analicemos: ubicacionX: -36.83914, ubicacionY: -73.093251. Sí, en Chile lat es -36 (X) y lng es -73 (Y).
      // Por ende en el SII chileno, "ubicacionX" es la Latitud y "ubicacionY" es la Longitud.
      avaluoFiscal: dataObj.valorTotal || null,
      avaluoAfecto: dataObj.valorAfecto || null,
      avaluoExento: dataObj.valorExento || null,
      valorUnitarioM2: dataObj.datosAh?.valorUnitario || null,
      rangoSuperficie: dataObj.datosAh?.rangoSuperficie?.trim() || "",
      destino: dataObj.destinoDescripcion || "HABITACIONAL",
      supTerreno: typeof dataObj.supTerreno === "number" ? dataObj.supTerreno : 0,
      supConsMt2: typeof dataObj.supConsMt2 === "number" ? dataObj.supConsMt2 : 0,
    };
  } catch (error) {
    console.error("Error al parsear el JSON del SII:", error);
    return null;
  }
}
