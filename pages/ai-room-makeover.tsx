
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function AiRoomMakeover() {
  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-4xl font-serif text-brand-brown mb-4">AI Редизайн комнаты</h1>
            <p className="text-lg text-gray-600">Эта функция находится в разработке. Следите за обновлениями!</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
