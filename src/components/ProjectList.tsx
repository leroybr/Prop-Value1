import React from 'react';
import { Project } from '../types.ts';
import { Building2, MapPin, Layers, CheckCircle2, Leaf, Droplets } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [regionFilter, setRegionFilter] = React.useState<string>('Todas');
  
  const filteredProjects = regionFilter === 'Todas' 
    ? projects 
    : projects.filter(p => p.region === regionFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800">Nuevos Proyectos</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Todas', 'Biobío', 'Metropolitana'].map(region => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-colors ${
                  regionFilter === region 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs md:text-sm text-slate-500">{filteredProjects.length} proyectos encontrados</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                  <p className="text-sm text-blue-600 font-medium">{project.developer}</p>
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                  project.status === 'Entrega Inmediata' ? 'bg-green-100 text-green-700' : 
                  project.status === 'En Verde' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span>{project.commune}{project.sector ? `, ${project.sector}` : ""}, {project.region}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Layers className="w-4 h-4" />
                  <span>{project.property_type} • {project.floors} pisos • {project.total_units} unidades</span>
                </div>
                {project.zoning_code && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg w-fit">
                    <Building2 className="w-3 h-3" />
                    <span>Zona: {project.zoning_code}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.amenities.slice(0, 3).map((amenity, i) => (
                  <span key={i} className="bg-gray-50 text-slate-500 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {amenity}
                  </span>
                ))}
                {project.sustainability_features.length > 0 && (
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Sostenible
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-top border-gray-50">
                <div>
                  <p className="text-xs text-slate-500 tracking-wider">Precio Promedio</p>
                  <p className="text-lg font-bold text-slate-800">{project.avg_price_uf_m2} UF/m²</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
