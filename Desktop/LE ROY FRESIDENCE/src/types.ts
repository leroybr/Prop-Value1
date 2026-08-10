export enum PropertyType {
  HOUSE = 'Casa',
  APARTMENT = 'Departamento',
  LAND = 'Terreno',
  PARCEL = 'Parcela'
}

export enum ListingType {
  SALE = 'Venta',
  RENT = 'Arriendo'
}

export interface PropertyCategoryImage {
  category: string;
  imageUrl: string;
}

export interface Property {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  price: number;
  currency: string;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  landArea?: number;
  parking?: number;
  type: PropertyType;
  listingType: ListingType;
  description: string;
  amenities: string[];
  isPremium: boolean;
  categoryImages?: PropertyCategoryImage[];
  gallery?: string[];
  videoUrl?: string;
}

export interface HeroSearchState {
  location: string;
  category: string;
}

export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}
