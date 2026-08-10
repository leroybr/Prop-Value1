import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Building2, Search, Loader2, AlertCircle } from "lucide-react";
import { COMUNA_CODES_VALUATION } from "./ValuationForm";
import { buscarPropiedadPorRUP, DestinoCatastral } from "../firebase";

interface FormularioYVisorIntegralProps {
  onRolValidado?: (comuna: string, manzana: string, predio: string) => void;
  onPredioEncontrado: (destino: DestinoCatastral) => void;
}

export const FormularioYVisorIntegral: React.FC<FormularioYVisorIntegralProps> = ({
  onRolValidado,
  onPredioEncontrado
}) => {
  const { register, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      commune: "San Pedro de la Paz",
      rol_manzana: "",
      rol_predio: "",
      rol_sii: ""
    }
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchedManzana = watch("rol_manzana");
  const watchedPredio = watch("rol_predio");
  const watchedCommune = watch("commune");
  const watchedRolSii = watch("rol_sii");

  useEffect(() => {
    if (!watchedManzana && !watchedPredio) {
      setValue("rol_sii", "");
      return;
    }

    const codigoComuna = COMUNA_CODES_VALUATION[watchedCommune] || "08101";
    const m5 = (watchedManzana || "").trim().padStart(5, "0");
    const p5 = (watchedPredio || "").trim().padStart(5, "0");
    
    setValue("rol_sii", `${codigoComuna}-${m5}-${p5}`);
  }, [watchedManzana, watchedPredio, watchedCommune, setValue]);

  const handleBuscar = async () => {
    if (!watchedRolSii || !watchedCommune) {
      setError("Por favor, ingrese el número de manzana y predio.");
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const destino = await buscarPropiedadPorRUP(watchedRolSii.trim());

      if (!destino) {
        throw new Error("Predio no registrado en el catastro actual.");
      }

      onPredioEncontrado(destino);

      if (onRolValidado) {
        const m5 = (watchedManzana || "").trim().padStart(5, "0");
        const p5 = (watchedPredio || "").trim().padStart(5, "0");
        onRolValidado(watchedCommune, m5, p5);
      }

    } catch (err: any) {
      console.error("Error buscando predio:", err);
      setError(`Información detallada no encontrada para el Rol ${watchedRolSii} en ${watchedCommune}.`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comuna del Bien Raíz</label>
        <select 
          {...register("commune")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {Object.keys(COMUNA_CODES_VALUATION).map(comuna => (
            <option key={comuna} value={comuna}>{comuna}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            1. Código Comuna
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-200 border border-slate-300 text-slate-600 rounded-lg font-mono text-sm shadow-inner select-none">
            <Building2 size={16} className="text-slate-400" />
            <span>{COMUNA_CODES_VALUATION[watchedCommune] || "08101"}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            2. N° Manzana
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="Ej: 12030"
            spellCheck={false}
            autoComplete="off"
            {...register("rol_manzana", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            3. N° Predio / Lote
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="Ej: 2"
            spellCheck={false}
            autoComplete="off"
            {...register("rol_predio", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleBuscar}
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 disabled:bg-blue-400"
        >
          {cargando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Buscando en Catastro Nacional...
            </>
          ) : (
            <>
              <Search size={16} />
              Georreferenciar Inmueble
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-700 font-sans mt-1">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>{error}</div>
          </div>
        )}

        <span className="text-[11px] text-slate-400 font-mono block text-center mt-1">
          RUP Estructurado: {watchedRolSii || "08115-00000-00000"}
        </span>
      </div>
    </div>
  );
};
