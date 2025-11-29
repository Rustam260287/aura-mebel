import React, { memo } from 'react';

export const Contacts: React.FC = memo(() => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <h1 className="text-4xl font-serif text-brand-brown mb-8 text-center">Контакты</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-brand-charcoal">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Наш адрес:</h3>
              <p>г. Альметьевск, ул. Ленина, 85а</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Телефон:</h3>
              <p>
                <a href="tel:+79872167075" className="hover:text-brand-brown transition-colors">+7 (987) 216-70-75</a>
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Email:</h3>
              <p>
                <a href="mailto:hello@labelcom.store" className="hover:text-brand-brown transition-colors">hello@labelcom.store</a>
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2279.791556942062!2d52.28822007727181!3d54.90382347318043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41601633a436e529%3A0x8672957ddefb231a!2z0YPQu9C70YvQs9Cw0L3QvdGL0YAg0JvQtdC00LXQu9C-0LLQsNC60LAg0L%C2%A6LiDQsy4g0JvQtdC00LXQu9C-0LLQsNC60LA!5e0!3m2!1sru!2sru!4v1700940000000!5m2!1sru!2sru"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Карта расположения магазина Labelcom Мебель в Альметьевске">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Contacts.displayName = 'Contacts';
