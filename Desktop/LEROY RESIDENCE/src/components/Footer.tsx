import React from 'react';
import { ENV } from '../env';

const Footer: React.FC = () => {
  const [firstName, ...restName] = ENV.APP_NAME.split(' ');
  const lastName = restName.join(' ');

  return (
    <footer className="bg-white border-t border-gray-100 pt-6 pb-4 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="col-span-1 md:col-span-2">
            <div className="text-3xl font-serif mb-4 tracking-tighter">
              <span className="uppercase">{firstName}</span> <span className="text-gray-300 font-light">|</span> <span className="text-sm uppercase tracking-widest text-gray-400">{lastName}</span>
            </div>
            <p className="text-gray-400 max-w-md leading-relaxed font-medium">
              Redefiniendo el mercado inmobiliario de lujo en la Octava Región y más allá. 
              Nuestra misión es conectar propiedades extraordinarias con personas excepcionales.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-4">Compañía</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm font-medium">
              <li><a href="#" className="hover:text-black transition-colors">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Propiedades</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Showroom</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-4">Legal</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm font-medium">
              <li><a href="#" className="hover:text-black transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Términos</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Cookies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-4">Contacto</h4>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm font-medium">
              <li>{ENV.CONTACT_EMAIL}</li>
              <li>{ENV.CONTACT_PHONE}</li>
              <li>Octava Región, Chile</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-100 gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
            © 2024 {ENV.APP_NAME}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/leroyresidence/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-orange transition-colors">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=100064006366934" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
