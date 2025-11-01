import React from 'react';

export const Contacts: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <h1 className="text-4xl font-serif text-brand-brown mb-8 text-center">Контакты</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-brand-charcoal">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Наш адрес:</h3>
              <p>г. Альметьевск, ул. Ленина, д. 15</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Телефон:</h3>
              <p>
                <a href="tel:+79991234567" className="hover:text-brand-brown transition-colors">+7 (999) 123-45-67</a>
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Email:</h3>
              <p>
                <a href="mailto:info@auramebel.ru" className="hover:text-brand-brown transition-colors">info@auramebel.ru</a>
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Часы работы:</h3>
              <p>Пн-Сб: 10:00 - 20:00</p>
              <p>Вс: 11:00 - 19:00</p>
            </div>
          </div>
          <div>
            <div className="rounded-lg overflow-hidden h-full min-h-[300px]">
               <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d35889.39088514125!2d52.28580641007812!3d54.90485541604085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41601633a436e529%3A0x8672957ddefb231a!2z0JDQu9C80LXRgtC10LLRgdC6LCDQoNC-0YHRgdC40Y8g0KLQsNGC0LDRgNGB0YLQstC1!5e0!3m2!1sru!2sru!4v1684321098765!5m2!1sru!2sru"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Карта расположения магазина Аура Мебель в Альметьевске">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};