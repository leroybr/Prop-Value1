/**
 * Configuración de "Entorno" para LeRoy Residence.
 * Centraliza valores que podrían variar según el contexto o mercado.
 */

export const ENV = {
  // Valores de conversión actuales
  UF_VALUE_CLP: 37800,
  USD_VALUE_CLP: 950,
  EUR_VALUE_CLP: 1020,
  
  // Configuración de la plataforma
  APP_NAME: "LeRoy Residence",
  DEFAULT_CURRENCY: "UF",
  SUPPORTED_CURRENCIES: ["UF", "CLP", "USD", "EUR"],
  
  // Límites y preferencias de UI
  ITEMS_PER_PAGE: 12,
  GALLERY_AUTO_PLAY: true,
  GALLERY_INTERVAL: 5000,
  
  // Contacto de soporte/ventas
  CONTACT_PHONE: "+56 9 9444 3591",
  CONTACT_EMAIL: "leroyresidence@gmail.com"
};
