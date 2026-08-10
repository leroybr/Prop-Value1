import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ReelSection from './components/ReelSection';
import ListingView from './components/ListingView';
import AdminView from './components/AdminView';
import AdminLoginView from './components/AdminLoginView';
import PropertyDetailView from './components/PropertyDetailView';
import { Property, HeroSearchState, ListingType, PropertyType } from './types';
import { MOCK_PROPERTIES, COMMUNES } from './constants';
import { interpretSearchQuery } from './services/geminiService';
import { db, handleFirestoreError, OperationType, auth, logout } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'real_estate' | 'admin' | 'detail'>('home');
  const [listingCategory, setListingCategory] = useState<'sale' | 'rent' | 'all'>('all');
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  
  // Persistencia: Cargar propiedades desde el servidor al iniciar
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- MANEJO DE DEEP LINKING (Query Params) ---
  useEffect(() => {
    if (isInitialLoadDone && properties.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const propertyId = params.get('property');
      if (propertyId) {
        const found = properties.find(p => p.id === propertyId);
        if (found) {
          setSelectedPropertyId(propertyId);
          setView('detail');
          console.log(`Deep link detected: showing property ${propertyId}`);
        }
      }
    }
  }, [isInitialLoadDone, properties]);

  // --- ESCUCHA DE AUTENTICACIÓN ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser && currentUser.email === 'janiceleroy@gmail.com') {
        setIsAdminAuthenticated(true);
      }
      // No forzamos false aquí para permitir que el login por PIN funcione
    });
    return () => unsubscribe();
  }, []);

  // --- CORRECCIÓN EN LA CARGA DE DATOS ---
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);

    const q = query(collection(db, 'properties'), orderBy('id', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const propsFromDb: Property[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Property;
        const propId = data.id || doc.id;
        propsFromDb.push({
          ...data,
          id: propId,
          listingType: data.listingType || ListingType.SALE
        });
      });

      console.log(`Firestore snapshot received: ${propsFromDb.length} properties from server/cache.`);

      const mergeWithMocks = (baseList: Property[]): Property[] => {
        const existingIds = new Set(baseList.map((p) => p.id));
        const existingTitles = new Set(baseList.map((p) => (p.title || '').toLowerCase().trim()));
        const missing = MOCK_PROPERTIES.filter(
          (m) => !existingIds.has(m.id) && !existingTitles.has((m.title || '').toLowerCase().trim())
        );
        return [...baseList, ...missing];
      };

      if (propsFromDb.length > 0) {
        setProperties(mergeWithMocks(propsFromDb));
        setLoadError(null);
      } else if (!isInitialLoadDone) {
        console.log('Firestore is empty on initial load. Checking local storage...');
        const savedLocal = localStorage.getItem('leroy_properties_v1');
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProperties(mergeWithMocks(parsed));
            } else {
              setProperties(MOCK_PROPERTIES);
            }
          } catch (e) {
            setProperties(MOCK_PROPERTIES);
          }
        } else {
          setProperties(MOCK_PROPERTIES);
        }
      } else {
        if (!snapshot.metadata.fromCache && auth.currentUser) {
          console.log('Firestore confirmed empty from server.');
          setProperties(MOCK_PROPERTIES);
        }
      }
      
      setIsLoading(false);
      setIsInitialLoadDone(true);
    }, (error) => {
      console.error('Firestore onSnapshot error:', error);
      setLoadError('Error de conexión con la base de datos. Usando respaldo local.');
      
      const savedLocal = localStorage.getItem('leroy_properties_v1');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: any) => p.id));
            const existingTitles = new Set(parsed.map((p: any) => (p.title || '').toLowerCase().trim()));
            const missing = MOCK_PROPERTIES.filter(
              (m) => !existingIds.has(m.id) && !existingTitles.has((m.title || '').toLowerCase().trim())
            );
            setProperties([...parsed, ...missing]);
          } else {
            setProperties(MOCK_PROPERTIES);
          }
        } catch (e) {
          setProperties(MOCK_PROPERTIES);
        }
      } else {
        setProperties(MOCK_PROPERTIES);
      }
      setIsLoading(false);
      setIsInitialLoadDone(true);
    });

    return () => unsubscribe();
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const contactTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleContactHover = (show: boolean) => {
    if (contactTimeoutRef.current) {
      clearTimeout(contactTimeoutRef.current);
    }

    if (show) {
      setShowContactForm(true);
    } else {
      contactTimeoutRef.current = setTimeout(() => {
        setShowContactForm(false);
      }, 300); // 300ms delay to allow moving mouse to the form
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500); // Intro lasts 2.5 seconds (faster)
    return () => clearTimeout(timer);
  }, []);

  // Guardar en localStorage como respaldo secundario
  useEffect(() => {
    if (isInitialLoadDone && properties.length > 0) {
      localStorage.setItem('leroy_properties_v1', JSON.stringify(properties));
    }
  }, [properties, isInitialLoadDone]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedPropertyId]);

  const handleSearch = async (searchState: HeroSearchState) => {
    setIsSearching(true);
    try {
      const filters = await interpretSearchQuery(searchState.location);
      console.log('Filtros interpretados por IA:', filters);
      
      if (filters.location) {
        setSelectedCommunes([filters.location]);
      }
      
      setListingCategory('all');
      setSelectedType(null);
      setView('real_estate');
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSelectedCommunes([searchState.location]);
      setSelectedType(null);
      setView('real_estate');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickLink = (label: string) => {
    if (label === 'Casas espectaculares') {
      navigateToDetail('espectacular-1');
    } else if (label === 'Propiedades en Venta') {
      setListingCategory('sale');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (label === 'Propiedades en Arriendo') {
      setListingCategory('rent');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (COMMUNES.includes(label)) {
      setListingCategory('all');
      setSelectedCommunes([label]);
      setSelectedType(null);
      setView('real_estate');
    } else {
      setListingCategory('all');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    }
  };

  const navigateToDetail = (id: string) => {
    setSelectedPropertyId(id);
    setView('detail');
  };

  // --- CORRECCIÓN EN EL GUARDADO ---
  const handleAddProperty = async (newProp: Property) => {
    console.log('Attempting to save property:', newProp.id);
    
    // Actualización optimista en el estado local para que el usuario vea el cambio de inmediato
    setProperties(prev => {
      const exists = prev.find(p => p.id === newProp.id);
      if (exists) {
        return prev.map(p => p.id === newProp.id ? newProp : p);
      }
      return [newProp, ...prev];
    });

    try {
      // Validar tamaño aproximado (Firestore límite 1MB)
      const size = new Blob([JSON.stringify(newProp)]).size;
      if (size > 1000000) {
        throw new Error('La propiedad es demasiado grande. Las imágenes son muy pesadas.');
      }

      // Si no hay sesión de Google, guardamos solo localmente y avisamos
      if (!auth.currentUser) {
        console.warn('No Google session. Saving only to local storage.');
        // Ya se actualizó el estado local arriba, y el useEffect de persistencia lo guardará en localStorage
        alert('Nota: No has iniciado sesión con Google. La propiedad se guardó solo en este dispositivo. Para sincronizar con la nube, inicia sesión con Google.');
        return;
      }

      await setDoc(doc(db, 'properties', newProp.id), newProp);
      console.log('Property successfully saved to Firestore');
      
      setListingCategory('all');
      setSelectedCommunes([]);
      setSelectedType(null);
    } catch (error: any) {
      console.error('Error saving property:', error);
      let message = 'Error al sincronizar con la nube.';
      
      if (error.message.includes('demasiado grande')) {
        message = error.message;
      } else if (error.code === 'permission-denied') {
        message = 'Permiso denegado en la nube. Asegúrate de usar la cuenta janiceleroy@gmail.com.';
      }

      alert(message + ' Tu cambio se mantiene localmente en este navegador.');
      throw error; 
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad permanentemente?')) return;
    
    try {
      await deleteDoc(doc(db, 'properties', id));
    } catch (error) {
      console.error('Error deleting property from Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, `properties/${id}`);
      alert('Error al eliminar la propiedad.');
    }
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setView('admin');
    }
  };

  const handleNavigate = (v: string) => {
    if (v === 'admin') {
      handleAdminAccess();
    } else if (v === 'real_estate_sale') {
      setListingCategory('sale');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (v === 'real_estate_rent') {
      setListingCategory('rent');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (v === 'real_estate') {
      setListingCategory('all');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else {
      setView(v as any);
    }
  };

  const handleSecureLogout = async () => {
    try {
      await logout();
      setIsAdminAuthenticated(false);
      setIsConfirmingLogout(false);
      setView('home');
    } catch (error) {
      console.error('Logout error:', error);
      setIsAdminAuthenticated(false);
      setIsConfirmingLogout(false);
      setView('home');
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const getHeaderView = (): 'home' | 'listing' | 'admin' | 'detail' => {
    if (view === 'real_estate') return 'listing';
    if (view === 'admin') return 'admin';
    return view as 'home' | 'detail';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>LeRoy Residence | Propiedades de Lujo en Chile</title>
        <meta name="description" content="Encuentra las mejores propiedades de lujo en venta y arriendo en las comunas más exclusivas de Chile. Casas, departamentos y villas espectaculares." />
        <meta name="keywords" content="propiedades de lujo chile, casas en venta lo barnechea, arriendo departamentos vitacura, corretaje de propiedades premium" />
        <meta property="og:title" content="LeRoy Residence | Propiedades de Lujo" />
        <meta property="og:description" content="Corretaje de propiedades exclusivo en Chile. Venta y arriendo de mansiones, villas y departamentos premium." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {showIntro && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl">
            <h2 className="text-leroy-black font-serif text-3xl md:text-4xl mb-6 font-medium leading-[1.1] animate-slideInRight tracking-tight">
              Bienvenido LeRoy Residence
            </h2>
            <div className="flex justify-center gap-4 mb-8 animate-fadeIn text-leroy-black font-bold uppercase tracking-[0.4em] text-[8px] md:text-[9px] opacity-60">
              <span>Vender</span>
              <span className="text-leroy-orange">•</span>
              <span>Comprar</span>
              <span className="text-leroy-orange">•</span>
              <span>Arrendar</span>
            </div>
            <p className="text-leroy-orange font-serif italic text-xl md:text-2xl animate-fadeIn">
              Propiedades en Venta
            </p>
          </div>
          <div className="absolute bottom-12 w-32 h-px bg-leroy-black/10 overflow-hidden">
            <div className="h-full bg-leroy-orange animate-progress" />
          </div>
        </div>
      )}
      <Header 
        onNavigate={handleNavigate} 
        currentView={getHeaderView()} 
        onContactHover={handleContactHover}
        showContactForm={showContactForm}
      />
      
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
            <div className="w-12 h-12 border-2 border-leroy-orange border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Cargando Propiedades...</p>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="bg-orange-50 text-leroy-orange text-[10px] font-bold uppercase tracking-widest py-2 px-8 text-center animate-fadeIn">
                {loadError}
              </div>
            )}
            {view === 'home' && (
              <>
                <Hero 
                  onSearch={handleSearch} 
                  onQuickLinkClick={handleQuickLink} 
                  isSearching={isSearching} 
                />
                <ReelSection />
              </>
            )}

            {view === 'real_estate' && (
              <ListingView 
                category={listingCategory} 
                properties={properties} 
                selectedCommunes={selectedCommunes}
                selectedType={selectedType}
                onToggleCommune={(commune) => {
                  if (commune === null) {
                    setSelectedCommunes([]);
                  } else {
                    setSelectedCommunes(prev => 
                      prev.includes(commune) 
                        ? prev.filter(c => c !== commune) 
                        : [...prev, commune]
                    );
                  }
                }}
                onToggleType={(type) => setSelectedType(type)}
                onClearFilters={() => {
                  setSelectedCommunes([]);
                  setSelectedType(null);
                }} 
                onPropertyClick={navigateToDetail}
                onGoHome={() => { 
                  setView('home'); 
                  setSelectedCommunes([]); 
                  setSelectedType(null);
                }}
              />
            )}

            {view === 'admin' && (
              !isAdminAuthenticated ? (
                <AdminLoginView 
                  onSuccess={() => setIsAdminAuthenticated(true)} 
                  onCancel={() => setView('home')} 
                />
              ) : (
                <>
                  <AdminView 
                    properties={properties}
                    onAddProperty={handleAddProperty} 
                    onDeleteProperty={handleDeleteProperty}
                    onCancel={() => setIsConfirmingLogout(true)} 
                  />
                  {isConfirmingLogout && (
                    <AdminLoginView 
                      mode="logout"
                      onSuccess={handleSecureLogout} 
                      onCancel={() => setIsConfirmingLogout(false)} 
                    />
                  )}
                </>
              )
            )}

            {view === 'detail' && selectedProperty && (
              <PropertyDetailView 
                property={selectedProperty} 
                onGoHome={() => setView('home')} 
              />
            )}
          </>
        )}
      </main>

      <Footer />
      
      {/* Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/56994443591?text=Hola%20Janice,%20me%20interesa%20obtener%20más%20información%20sobre%20sus%20propiedades.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[150] bg-[#25D366] text-white p-3 rounded-full shadow-2xl hover:bg-[#128C7E] hover:scale-110 transition-all duration-300 group"
        aria-label="Contactar por WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-leroy-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
          ¿Hablamos?
        </span>
      </a>

      {/* Floating Admin Button - Hidden behind a white circle */}
      <button 
        onClick={() => handleAdminAccess()}
        className="fixed bottom-6 left-6 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center group z-[100] hover:w-24 hover:h-10 transition-all duration-500 border border-gray-100 overflow-hidden"
        aria-label="Admin Access"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-all duration-300 whitespace-nowrap">
          Admin
        </span>
      </button>
    </div>
  );
};

export default App;