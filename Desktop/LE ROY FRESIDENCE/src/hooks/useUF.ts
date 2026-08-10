import { useState, useEffect, useCallback } from 'react';

export const useUF = () => {
  const [ufValue, setUfValue] = useState<number>(40820); // Valor real oficial chileno a junio 2026
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ufLastFetched, setUfLastFetched] = useState<string>("");

  const fetchUF = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem('propvalue_uf_data_cache');

    if (!force && cachedData) {
      try {
        const { value, date, lastFetchedStr } = JSON.parse(cachedData);
        if (date === today && typeof value === 'number' && value > 10000) {
          // Si el valor guardado es un fallback anterior obsoleto, forzamos la actualización
          if (value === 38420 || value === 37560) {
            console.log("Detectado caché con valor de respaldo antiguo. Forzando re-consulta.");
          } else {
            setUfValue(value);
            setUfLastFetched(lastFetchedStr || "Caché");
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Error parseando caché de UF, re-consultando...");
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      // Intentamos con nuestro endpoint del servidor seguro para evitar CORS y problemas de red
      const response = await fetch('/api/uf', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.serie && data.serie.length > 0) {
        const currentUF = data.serie[0].valor;
        if (typeof currentUF === 'number' && currentUF > 10000) {
          setUfValue(currentUF);
          const now = new Date();
          const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          setUfLastFetched(timeStr);
          
          localStorage.setItem(
            'propvalue_uf_data_cache', 
            JSON.stringify({ value: currentUF, date: today, lastFetchedStr: timeStr })
          );
          setLoading(false);
          return;
        }
      }
      throw new Error("Formato de respuesta de UF inválido");
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn("UF fetch timed out, using fallback.");
      } else {
        console.error("Error obteniendo la UF vía API, usando respaldo:", err.message || err);
      }
      setError(err.message || "Error al obtener UF");

      // Fallback: Si la API falla pero tenemos un valor antiguo en caché (de cualquier día), lo usamos
      if (cachedData) {
        try {
          const { value, lastFetchedStr } = JSON.parse(cachedData);
          if (typeof value === 'number' && value > 10000) {
            setUfValue(value);
            setUfLastFetched(lastFetchedStr || "Respaldo");
            setLoading(false);
            return;
          }
        } catch (_) {}
      }

      // Si no hay nada, queda el valor por defecto de 40820
      setUfValue(40820);
      setUfLastFetched("Defecto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUF(false);
  }, [fetchUF]);

  return { ufValue, setUfValue, loading, error, ufLastFetched, setUfLastFetched, fetchUF };
};
