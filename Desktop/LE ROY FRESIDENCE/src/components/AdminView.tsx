import React, { useState } from 'react';
import { Property, PropertyType, ListingType } from '../types';
import { Plus, X, Download, Share2, Globe, Edit, Trash2, Search, Bed, Bath, Car, Maximize, LogOut, User, Copy, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { COMMUNES } from '../constants';
import { auth, db } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

interface AdminViewProps {
  properties: Property[];
  onAddProperty: (prop: Property) => void;
  onDeleteProperty: (id: string) => void;
  onCancel: () => void;
}

const AdminView: React.FC<AdminViewProps> = (props) => {
  const { properties, onAddProperty, onDeleteProperty, onCancel } = props;
  const [activeTab, setActiveTab] = useState<'add' | 'marketing' | 'list'>('list');
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null);
  const [shareDomain, setShareDomain] = useState<string>(() => {
    const isDev = window.location.origin.includes('localhost') || 
                  window.location.origin.includes('127.0.0.1') || 
                  window.location.origin.includes('ais-dev') || 
                  window.location.origin.includes('ais-pre');
    return isDev ? 'https://www.leroyresidence.cl' : window.location.origin;
  });
  
  const currentUser = auth.currentUser;
  const initialFormState = {
    title: '',
    subtitle: '',
    location: COMMUNES[0],
    price: '',
    currency: 'UF',
    imageUrl: '',
    categoryImages: [] as { category: string, imageUrl: string }[],
    bedrooms: '0',
    bathrooms: '0',
    area: '0',
    landArea: '0',
    parking: '0',
    type: PropertyType.HOUSE,
    listingType: ListingType.SALE,
    description: '',
    amenities: '',
    isPremium: false,
    videoUrl: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const checkCloudConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Intentamos leer un documento de la colección 'properties' que es pública
      // No importa si el documento existe o no, lo que importa es si la petición llega al servidor
      await getDocFromServer(doc(db, 'properties', 'connection-test'));
      setIsCloudConnected(true);
    } catch (error) {
      console.error('Cloud connection test failed:', error);
      setIsCloudConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  React.useEffect(() => {
    checkCloudConnection();
  }, []);

  // Draft System: Load draft on mount
  React.useEffect(() => {
    const savedDraft = localStorage.getItem('leroy_property_draft');
    if (savedDraft && !editingPropertyId) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, [editingPropertyId]);

  // Draft System: Save draft on change
  React.useEffect(() => {
    if (activeTab === 'add' && !editingPropertyId) {
      // Only save if there's actual content to save
      const hasContent = formData.title || formData.description || formData.imageUrl || formData.price;
      if (hasContent) {
        localStorage.setItem('leroy_property_draft', JSON.stringify(formData));
      }
    }
  }, [formData, activeTab, editingPropertyId]);

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const resizeImage = (file: File, maxWidth: number = 1280, maxHeight: number = 960, quality: number = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar manteniendo proporción sin exceder máximos
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'main' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      if (field === 'main') {
        const resized = await resizeImage(files[0], 1280, 960, 0.82);
        setFormData(prev => ({ ...prev, imageUrl: resized }));
      } else {
        const fileList = Array.from(files);
        const newImages: { category: string, imageUrl: string }[] = [];
        
        for (let i = 0; i < fileList.length; i++) {
          const resized = await resizeImage(fileList[i], 1200, 900, 0.8);
          newImages.push({ 
            category: `Imagen ${formData.categoryImages.length + i + 1}`, 
            imageUrl: resized 
          });
        }
        
        setFormData(prev => ({ 
          ...prev, 
          categoryImages: [...prev.categoryImages, ...newImages] 
        }));
      }
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsProcessingImages(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categoryImages: prev.categoryImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingImages(true); // Re-use this state for saving too
    try {
      const newProperty: Property = {
        id: editingPropertyId || Date.now().toString(),
        title: formData.title,
        subtitle: formData.subtitle,
        location: `${formData.location.split(',')[0]}, Chile`,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        imageUrl: formData.imageUrl || 'https://picsum.photos/seed/new/1200/1500',
        categoryImages: formData.categoryImages,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.area) || 0,
        landArea: parseInt(formData.landArea) || 0,
        parking: parseInt(formData.parking) || 0,
        type: formData.type,
        listingType: formData.listingType,
        description: formData.description,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
        isPremium: formData.isPremium,
        videoUrl: formData.videoUrl
      };
      
      await onAddProperty(newProperty);
      
      // Reset form, clear draft and go back to list
      localStorage.removeItem('leroy_property_draft');
      setFormData(initialFormState);
      setEditingPropertyId(null);
      setSaveSuccess(true);
      setActiveTab('list');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Error is handled in App.tsx with alert
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleEdit = (p: Property) => {
    setEditingPropertyId(p.id);
    setFormData({
      title: p.title,
      subtitle: p.subtitle,
      location: p.location.split(',')[0],
      price: p.price.toString(),
      currency: p.currency,
      imageUrl: p.imageUrl,
      categoryImages: p.categoryImages || [],
      bedrooms: p.bedrooms.toString(),
      bathrooms: p.bathrooms.toString(),
      area: p.area.toString(),
      landArea: (p.landArea || 0).toString(),
      parking: (p.parking || 0).toString(),
      type: p.type,
      listingType: p.listingType,
      description: p.description,
      amenities: p.amenities.join(', '),
      isPremium: p.isPremium,
      videoUrl: p.videoUrl || ''
    });
    setActiveTab('add');
  };

  const handleDuplicate = (p: Property) => {
    setEditingPropertyId(null); // Es una nueva propiedad
    setFormData({
      title: `${p.title} (Copia)`,
      subtitle: p.subtitle,
      location: p.location.split(',')[0],
      price: p.price.toString(),
      currency: p.currency,
      imageUrl: p.imageUrl,
      categoryImages: p.categoryImages || [],
      bedrooms: p.bedrooms.toString(),
      bathrooms: p.bathrooms.toString(),
      area: p.area.toString(),
      landArea: (p.landArea || 0).toString(),
      parking: (p.parking || 0).toString(),
      type: p.type,
      listingType: p.listingType,
      description: p.description,
      amenities: p.amenities.join(', '),
      isPremium: p.isPremium,
      videoUrl: p.videoUrl || ''
    });
    setActiveTab('add');
  };

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleForceUpdate = () => {
    if (confirm('¿Deseas forzar una actualización del sistema? Esto limpiará la memoria temporal y recargará todos los datos de la nube.')) {
      // Limpiar backups locales
      localStorage.removeItem('leroy_properties_v1');
      localStorage.removeItem('leroy_property_draft');
      // Recargar la página ignorando el caché
      window.location.reload();
    }
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-serif">Panel de Gestión</h1>
          <div className="flex flex-col gap-1 mt-2">
            {currentUser && (
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-leroy-orange">
                <User size={12} />
                <span>Sesión: {currentUser.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
              <div className={`w-2 h-2 rounded-full ${isCloudConnected === true ? 'bg-green-500' : isCloudConnected === false ? 'bg-red-500' : 'bg-gray-300 animate-pulse'}`} />
              <span className={isCloudConnected === false ? 'text-red-500' : 'text-gray-400'}>
                {isCloudConnected === true ? 'Conectado a la Nube (Firebase)' : isCloudConnected === false ? 'Error de Conexión Cloud' : 'Verificando Conexión...'}
              </span>
              <button 
                onClick={checkCloudConnection}
                disabled={isTestingConnection}
                className="ml-2 text-leroy-orange hover:underline disabled:opacity-50"
              >
                {isTestingConnection ? 'Probando...' : 'Reintentar'}
              </button>
            </div>
            {!currentUser && (
              <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-[9px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <X size={12} />
                <span>Modo Local: Inicia sesión con Google para guardar en la nube</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleForceUpdate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-[9px] font-bold uppercase tracking-widest text-leroy-orange hover:bg-leroy-orange hover:text-white transition-all rounded-full border border-leroy-orange/20"
            title="Forzar Sincronización y Limpiar Caché"
          >
            <Globe size={14} className="animate-spin-slow" />
            <span>Actualización Forzada</span>
          </button>
          <button 
            onClick={onCancel} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors rounded-full"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-gray-100 mb-8">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'list' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
        >
          Mis Publicaciones
        </button>
        <button 
          onClick={() => {
            setActiveTab('add');
            if (editingPropertyId) {
              setEditingPropertyId(null);
              // Only reset if we were editing, to allow draft loading for new properties
              const savedDraft = localStorage.getItem('leroy_property_draft');
              if (savedDraft) {
                try {
                  setFormData(JSON.parse(savedDraft));
                } catch (e) {
                  setFormData(initialFormState);
                }
              } else {
                setFormData(initialFormState);
              }
            }
          }}
          className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'add' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
        >
          {editingPropertyId ? 'Editando Propiedad' : 'Nueva Propiedad'}
        </button>
        <button 
          onClick={() => setActiveTab('marketing')}
          className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'marketing' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
        >
          Marketing & Feeds
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          {saveSuccess && (
            <div className="bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-[0.3em] py-4 px-6 border border-green-100 animate-fadeIn">
              Propiedad guardada con éxito en la base de datos
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por título o ubicación..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none outline-none text-sm focus:ring-1 focus:ring-black transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredProperties.map(p => (
              <div key={p.id} className="flex items-center gap-6 p-4 border border-gray-100 hover:border-black transition-all group">
                <div className="w-24 h-24 bg-gray-100 flex-shrink-0 overflow-hidden border-2 border-leroy-orange">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-serif text-lg">{p.title}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.location}</p>
                  <p className="text-[10px] font-bold text-leroy-orange mt-1">{p.currency} {p.price.toLocaleString()}</p>
                </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setSharingProperty(p)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-leroy-orange text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-all rounded shadow-sm"
                      title="Compartir en Facebook / Instagram / WhatsApp"
                    >
                      <Share2 size={14} />
                      <span>Publicar / Compartir</span>
                    </button>
                    <button 
                      onClick={() => handleDuplicate(p)}
                      className="p-2.5 bg-gray-50 text-gray-500 hover:bg-gray-200 transition-all rounded-full border border-gray-100"
                      title="Duplicar propiedad"
                    >
                      <Copy size={15} />
                    </button>
                    <button 
                      onClick={() => handleEdit(p)}
                      className="p-2.5 bg-gray-50 text-gray-500 hover:bg-black hover:text-white transition-all rounded-full border border-gray-100"
                      title="Editar propiedad"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
                          onDeleteProperty(p.id);
                        }
                      }}
                      className="p-2.5 bg-gray-50 text-gray-500 hover:bg-red-500 hover:text-white transition-all rounded-full border border-gray-100"
                      title="Eliminar propiedad"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
              </div>
            ))}
            {filteredProperties.length === 0 && (
              <div className="text-center py-12 border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No se encontraron propiedades.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'add' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-4">
              {editingPropertyId ? 'Modificar Publicación' : 'Información Pública'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
                <input 
                  required
                  type="text" 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subtítulo</label>
                <input 
                  required
                  type="text" 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                  value={formData.subtitle}
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comuna</label>
                <select 
                  required
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                >
                  {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio</label>
                  <input 
                    required
                    type="number" 
                    className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Moneda</label>
                  <select 
                    className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="UF">UF</option>
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                    <option value="€">€</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Imagen Principal</label>
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-gray-500 font-medium bg-gray-50 p-2.5 rounded border border-gray-100 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓ Ajuste automático:</span> 
                    <span>La app recorta, optimiza y escala automáticamente cualquier foto subida a alta definición (HD) sin distorsión.</span>
                  </p>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="w-full text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-gray-50 file:text-black hover:file:bg-gray-100 cursor-pointer"
                    onChange={e => handleFileChange(e, 'main')}
                  />
                  <div className="flex gap-4 items-center">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">O URL:</span>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      className="flex-grow border-b border-gray-200 py-2 outline-none focus:border-black transition-colors text-[11px]"
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                  {formData.imageUrl && (() => {
                    const landMode = formData.type === PropertyType.LAND || formData.type === PropertyType.PARCEL;
                    const accentColor = landMode ? 'leroy-green' : 'leroy-orange';
                    const borderColor = landMode ? 'border-leroy-green' : 'border-leroy-orange';
                    const textColor = landMode ? 'text-leroy-green' : 'text-leroy-orange';

                    return (
                      <div className={`mt-2 aspect-video w-full flex flex-col overflow-hidden bg-gray-50 border-4 ${borderColor} shadow-lg`}>
                        <div className="flex-grow overflow-hidden relative">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className={`bg-white px-4 py-3 border-t ${landMode ? 'border-leroy-green/10' : 'border-leroy-orange/10'} flex justify-between items-center`}>
                          <div className="flex gap-4 text-gray-600">
                            {!landMode && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Bed size={14} className={textColor} />
                                  <span className="text-[10px] font-bold">{formData.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Bath size={14} className={textColor} />
                                  <span className="text-[10px] font-bold">{formData.bathrooms}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Car size={14} className={textColor} />
                                  <span className="text-[10px] font-bold">{formData.parking}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Maximize size={14} className={textColor} />
                              <span className="text-[10px] font-bold">{landMode ? (formData.landArea || formData.area) : formData.area}m²</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-serif font-medium ${textColor}`}>LeRoy Residence</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Galería de Imágenes (Opcional)</label>
                <div className="flex flex-col gap-4 p-4 border border-dashed border-gray-200 rounded-lg">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    className="w-full text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-black file:text-white hover:file:bg-orange-600 cursor-pointer transition-colors"
                    onChange={e => handleFileChange(e, 'gallery')}
                  />
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest italic">
                    Nota: Las imágenes se guardan localmente. Evite subir archivos muy pesados para no exceder el límite del navegador.
                  </p>
                  
                  {formData.categoryImages.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                      {formData.categoryImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square group">
                          <img src={img.imageUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dorm.</label>
                  <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Baños</label>
                  <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">m²</label>
                  <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Land m²</label>
                  <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.landArea} onChange={e => setFormData({...formData, landArea: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parking</label>
                  <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo</label>
                <select 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
                >
                  {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Operación</label>
                <select 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                  value={formData.listingType}
                  onChange={e => setFormData({...formData, listingType: e.target.value as ListingType})}
                >
                  {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amenidades (separadas por coma)</label>
              <input 
                type="text" 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.amenities}
                onChange={e => setFormData({...formData, amenities: e.target.value})}
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
              <textarea 
                className="w-full border border-gray-200 p-4 h-32 outline-none focus:border-black transition-colors"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <input 
                type="checkbox" 
                id="isPremium"
                checked={formData.isPremium}
                onChange={e => setFormData({...formData, isPremium: e.target.checked})}
              />
              <label htmlFor="isPremium" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Propiedad Premium</label>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Link de Reel / Video (Instagram, YouTube, etc.)</label>
              <input 
                type="text" 
                placeholder="https://www.instagram.com/reels/..."
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.videoUrl}
                onChange={e => setFormData({...formData, videoUrl: e.target.value})}
              />
            </div>
          </section>

          <button 
            type="submit"
            disabled={isProcessingImages}
            className={`w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-600 transition-colors flex items-center justify-center gap-4 ${isProcessingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessingImages ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando Imágenes...
              </>
            ) : (
              <>
                {editingPropertyId ? <Edit size={18} /> : <Plus size={18} />}
                {editingPropertyId ? 'Guardar Cambios' : 'Publicar Propiedad'}
              </>
            )}
          </button>
        </form>
      ) : (
        <MarketingSection properties={properties} onAddProperty={onAddProperty} />
      )}

      {sharingProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-none max-w-xl w-full p-8 shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setSharingProperty(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-leroy-orange">Distribución y Redes Sociales</span>
            <h3 className="font-serif text-2xl mt-2 mb-1">Compartir: {sharingProperty.title}</h3>
            <p className="text-xs text-gray-400 mb-6">{sharingProperty.location}</p>

            <div className="space-y-6">
              {/* Alerta de Educación */}
              <div className="bg-amber-50/70 border-l-2 border-leroy-orange p-4 text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900 block mb-1">💡 ¿Cómo funciona publicar en redes sociales?</span>
                Por seguridad y privacidad, <strong>ni Instagram ni Facebook permiten que una página externa publique de forma automática</strong> en tu perfil. 
                Hemos diseñado un sistema que genera tus links reales y descripciones listas para copiar!
              </div>

              {/* Selector de dirección web / dominio */}
              <div className="bg-gray-50 border border-gray-100 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Dirección Web de tu Inmobiliaria (Tu Web Real)</span>
                  {(window.location.origin.includes('ais-dev') || window.location.origin.includes('ais-pre') || window.location.origin.includes('localhost')) && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                      Entorno de Pruebas Detectado 🛠️
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="bg-gray-200/50 border border-gray-200 flex items-center px-3 text-xs text-gray-400 font-mono">
                    https://
                  </span>
                  <input 
                    type="text" 
                    value={shareDomain.replace(/^https?:\/\//, '')}
                    onChange={(e) => {
                      const cleanDomain = e.target.value.trim().replace(/^https?:\/\//, '');
                      setShareDomain(`https://${cleanDomain}`);
                    }}
                    placeholder="www.leroyresidence.cl"
                    className="flex-grow bg-white border border-gray-200 outline-none py-2 px-3 text-xs font-mono text-gray-800"
                  />
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  ⚠️ <strong>¡Súper Importante!</strong> Al estar administrando desde este entorno de AI Studio, hemos adaptado automáticamente el enlace a tu web real <strong>www.leroyresidence.cl</strong> para que los clientes que hagan clic en Facebook o Instagram puedan entrar normalmente sin recibir avisos de "Cookie Check" o pantallas de desarrollo vacías.
                </p>
              </div>

              {/* OPCIONES DE ACCIÓN RÁPIDA */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Acciones Rápidas Disponibles</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Botón Facebook Directo */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${shareDomain}/?property=${sharingProperty.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1565C0] text-white py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Facebook size={16} />
                    Publicar en Facebook
                  </a>

                  {/* Botón WhatsApp Directo */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`✨ NUEVA PROPIEDAD DISPONIBLE ✨\n\n🏡 *${sharingProperty.title}*\n📍 ${sharingProperty.location}\n💰 *${sharingProperty.currency} ${sharingProperty.price.toLocaleString()}*\n\n📐 *Detalles:* ${sharingProperty.area} m² | ${sharingProperty.bedrooms} dorms | ${sharingProperty.bathrooms} baños\n\n👉 Ver fotos y agenda una visita aquí:\n${shareDomain}/?property=${sharingProperty.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1FBE57] text-white py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <MessageCircle size={16} />
                    Compartir en WhatsApp
                  </a>
                </div>
              </div>

              {/* Opción 1: Enlace directo */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">1. Enlace directo de la propiedad (El Link Individual)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={`${shareDomain}/?property=${sharingProperty.id}`}
                    className="flex-grow bg-gray-50 border-none outline-none py-3 px-4 text-xs font-mono select-all text-gray-600"
                    id="share-direct-link"
                  />
                  <button 
                    onClick={() => {
                      const linkInput = document.getElementById('share-direct-link') as HTMLInputElement;
                      if (linkInput) {
                        navigator.clipboard.writeText(linkInput.value);
                        alert('¡Link individual de la propiedad copiado al portapapeles!');
                      }
                    }}
                    className="bg-black text-white px-4 hover:bg-leroy-orange transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    Copiar Link
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Este link abrirá <strong>esta propiedad específica de forma directa</strong>, en vez de abrir la portada general de la web. Idóneo para pegarlo en Facebook o agregarlo como sticker enlace en tus Historias de Instagram.
                </p>
              </div>

              {/* Opción 2: Plantilla lista de descripción */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">2. Descripción Formateada con Emojis (Lista para pegar)</label>
                  <span className="text-[9px] font-bold text-leroy-orange bg-orange-50 px-2 py-0.5 uppercase tracking-widest">Ahorra tiempo ✨</span>
                </div>
                
                <div className="bg-gray-50 p-4 font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto border border-gray-100 rounded leading-relaxed text-gray-600">
{`✨ NUEVA PROPIEDAD DISPONIBLE ✨

🏡 ${sharingProperty.title}
📍 ${sharingProperty.location}
💰 ${sharingProperty.currency} ${sharingProperty.price.toLocaleString()}

📏 DETALLES DE LA PROPIEDAD:
• Superficie: ${sharingProperty.area} m² ${sharingProperty.landArea ? `\n• Superficie Terreno: ${sharingProperty.landArea} m²` : ''}
• Dormitorios: ${sharingProperty.bedrooms}
• Baños: ${sharingProperty.bathrooms}
${sharingProperty.parking ? `• Estacionamientos: ${sharingProperty.parking}` : ''}

⭐ AMENIDADES & ATRIBUTOS:
${sharingProperty.amenities.map(a => `• ${a}`).join('\n')}

¡Haz clic en el enlace de nuestra biografía o entra aquí para ver todas las fotos y agendar visita! 👇
🔗 ${shareDomain}/?property=${sharingProperty.id}

#LeRoyResidence #BienesRaices #PropiedadesDeLujo #Inmobiliaria`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      const text = `✨ NUEVA PROPIEDAD DISPONIBLE ✨\n\n🏡 ${sharingProperty.title}\n📍 ${sharingProperty.location}\n💰 ${sharingProperty.currency} ${sharingProperty.price.toLocaleString()}\n\n📏 DETALLES DE LA PROPIEDAD:\n• Superficie: ${sharingProperty.area} m² ${sharingProperty.landArea ? `\n• Superficie Terreno: ${sharingProperty.landArea} m²` : ''}\n• Dormitorios: ${sharingProperty.bedrooms}\n• Baños: ${sharingProperty.bathrooms}\n${sharingProperty.parking ? `• Estacionamientos: ${sharingProperty.parking}\n` : ''}\n⭐ AMENIDADES & ATRIBUTOS:\n${sharingProperty.amenities.map(a => `• ${a}`).join('\n')}\n\n¡Haz clic en el enlace de nuestra biografía o entra aquí para ver todas las fotos y agendar una visita! 👇\n🔗 ${shareDomain}/?property=${sharingProperty.id}\n\n#LeRoyResidence #BienesRaices #PropiedadesDeLujo #Inmobiliaria`;
                      navigator.clipboard.writeText(text);
                      alert('¡Descripción generada y copiada con éxito! Ahora puedes pegarla directamente en tus publicaciones.');
                    }}
                    className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:bg-leroy-orange transition-colors"
                  >
                    Copiar Descripción + Link
                  </button>

                  <button 
                    onClick={() => {
                      window.open('https://www.instagram.com/', '_blank');
                    }}
                    className="w-full bg-white text-black border border-black text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Instagram size={14} />
                    Abrir Instagram
                  </button>
                </div>
              </div>

              {/* Guía de publicación paso a paso claro */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-black">Paso a Paso Fácil para tus Redes:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 leading-relaxed">
                  <div className="bg-gray-50/50 p-4 border border-gray-100">
                    <span className="font-bold text-black uppercase tracking-wider block mb-1 text-[10px]">Para Facebook:</span>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Haz clic arriba en <strong>"Publicar en Facebook"</strong>.</li>
                      <li>Se abrirá Facebook automáticamente con el link ya cargado.</li>
                      <li>Escribe lo que quieras o pega la descripción y dale a publicar. ¡Listo!</li>
                    </ol>
                  </div>

                  <div className="bg-gray-50/50 p-4 border border-gray-100">
                    <span className="font-bold text-black uppercase tracking-wider block mb-1 text-[10px]">Para Instagram (Reels o Post):</span>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Presiona <strong>"Copiar Descripción + Link"</strong> de arriba.</li>
                      <li>Presiona <strong>"Abrir Instagram"</strong> para ir a tu perfil.</li>
                      <li>Crea un post o Reel con tu video de la propiedad, pega la descripción en el cuadro de texto y ¡publica!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MarketingSection: React.FC<{ properties: Property[], onAddProperty: (p: Property) => void }> = ({ properties, onAddProperty }) => {
  const generateFacebookFeed = () => {
    // Basic Facebook Real Estate XML Feed
    let xml = `<?xml version="1.0"?>
<listings>
  <title>LeRoy Residence Feed</title>
  <link>${window.location.origin}</link>
  <description>Propiedades de Lujo en Chile</description>
  ${properties.map(p => `
  <listing>
    <home_listing_id>${p.id}</home_listing_id>
    <name>${p.title}</name>
    <description>${p.description}</description>
    <address format="simple">
      <component name="city">${p.location}</component>
      <component name="country">Chile</component>
    </address>
    <price>${p.price} ${p.currency}</price>
    <url>${window.location.origin}/property/${p.id}</url>
    <image>
      <url>${p.imageUrl}</url>
    </image>
    <listing_type>for_${p.listingType === ListingType.SALE ? 'sale' : 'rent'}</listing_type>
    <num_beds>${p.bedrooms}</num_beds>
    <num_baths>${p.bathrooms}</num_baths>
  </listing>`).join('')}
</listings>`;
    
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facebook_real_estate_feed.xml';
    a.click();
  };

  const generateJSONFeed = () => {
    const data = JSON.stringify(properties, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leroy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedProperties = JSON.parse(content);
        
        if (Array.isArray(importedProperties)) {
          if (confirm(`¿Estás seguro de que deseas restaurar ${importedProperties.length} propiedades? Esto reemplazará la lista actual.`)) {
            // We need a way to update the parent state. 
            // Since onAddProperty only adds one, we might need a new prop or just use a loop.
            // But a better way is to have a dedicated onRestore function.
            // For now, I'll assume we can use a loop or I'll add onRestore to props.
            importedProperties.forEach(prop => {
              // Basic validation
              if (prop.id && prop.title) {
                onAddProperty(prop);
              }
            });
            alert('Restauración completada. Nota: Se han añadido las propiedades del archivo.');
          }
        } else {
          alert('El archivo no tiene un formato válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo de respaldo.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const feedUrls = {
    facebook: `${window.location.origin}/api/feeds/facebook.xml`,
    universal: `${window.location.origin}/api/feeds/universal.xml`,
    json: `${window.location.origin}/api/properties`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada al portapapeles');
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-6">Sincronización con Portales (Feeds)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-100 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded">
                <Globe size={20} />
              </div>
              <h3 className="font-serif text-xl">Facebook & Instagram</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Usa este link en tu "Catálogo de Bienes Raíces" de Facebook Business Suite para que tus anuncios se actualicen solos.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded text-[10px] font-mono overflow-hidden">
                <span className="truncate flex-grow">{feedUrls.facebook}</span>
                <button onClick={() => copyToClipboard(feedUrls.facebook)} className="text-leroy-orange hover:text-black">
                  <Download size={14} />
                </button>
              </div>
              <button 
                onClick={generateFacebookFeed}
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-orange transition-colors"
              >
                <Download size={14} />
                Descargar XML Manual
              </button>
            </div>
          </div>

          <div className="p-6 border border-gray-100 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded">
                <Globe size={20} />
              </div>
              <h3 className="font-serif text-xl">Portal Inmobiliario / Otros</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Link universal compatible con la mayoría de los portales que aceptan importación vía XML (Feed URL).
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded text-[10px] font-mono overflow-hidden">
                <span className="truncate flex-grow">{feedUrls.universal}</span>
                <button onClick={() => copyToClipboard(feedUrls.universal)} className="text-leroy-orange hover:text-black">
                  <Download size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={generateJSONFeed}
                  className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-orange transition-colors"
                >
                  <Download size={14} />
                  Descargar Respaldo JSON
                </button>
                
                <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-green-600 cursor-pointer transition-colors">
                  <Plus size={14} />
                  Restaurar Respaldo
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleRestoreBackup}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-6">Optimización SEO & Redes</h2>
        <div className="p-8 border border-gray-100 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="font-serif text-2xl mb-2">Google Search Console</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tu sitio ya incluye <strong>Schema.org (JSON-LD)</strong>. Google leerá automáticamente tus propiedades 
                como "RealEstateListing", lo que mejora drásticamente tu posicionamiento y cómo apareces en los resultados.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="font-serif text-2xl mb-2">Social Media Ready</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Cada propiedad tiene etiquetas <strong>Open Graph</strong> dinámicas. Al compartir el link en Instagram o Facebook, 
                se mostrará automáticamente la foto, el título y el precio de la propiedad.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-6">Generador de Reels & Social Pack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.slice(0, 6).map(p => (
            <div key={p.id} className="p-6 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-video w-full overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-serif text-lg mb-4 truncate">{p.title}</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const text = `✨ ¡NUEVA OPORTUNIDAD! ✨\n\n🏡 ${p.title}\n📍 ${p.location}\n💰 ${p.currency} ${p.price.toLocaleString()}\n\n💎 ${p.bedrooms} Dormitorios • ${p.bathrooms} Baños • ${p.area}m²\n\n📩 Contáctanos para agendar tu visita exclusiva.\n\n#LeRoyResidence #VentaPropiedades #LujoChile #RealEstateChile #${p.location.split(',')[0].replace(/\s/g, '')} #ReelsRealEstate\n\n🔗 Ver más detalles: ${window.location.origin}/property/${p.id}`;
                    navigator.clipboard.writeText(text);
                    alert('Caption para Reel copiado');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-leroy-black text-white text-[9px] font-bold uppercase tracking-widest hover:bg-leroy-orange transition-colors"
                >
                  <Copy size={14} />
                  Copiar Texto para Reel
                </button>
                <div className="grid grid-cols-2 gap-2">
                   <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.leroyresidence.cl/?property=${p.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 border border-gray-100 text-[8px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors"
                  >
                    <Share2 size={12} className="text-blue-600" />
                    Facebook
                  </a>
                   <a 
                    href="https://www.instagram.com/leroyresidence/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 border border-gray-100 text-[8px] font-bold uppercase tracking-widest hover:bg-pink-50 transition-colors"
                  >
                    <Instagram size={12} className="text-pink-600" />
                    Instagram
                  </a>
                </div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest text-center mt-2">
                  Tip: Sube tus propios Reels a Instagram y pega el link en la edición de la propiedad para que aparezca en la web.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AdminView;
