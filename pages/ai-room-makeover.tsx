
import React from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import AIRoomMakeoverPage from '../components/AIRoomMakeoverPage';

export default function AiRoomMakeover() {
  return (
    <>
      <Head>
        <title>AI Редизайн Комнаты | Labelcom Мебель</title>
        <meta name="description" content="Загрузите фото вашей комнаты и получите персональную консультацию по редизайну от нашего AI-стилиста." />
      </Head>
      <Header />
      <main className="flex-grow">
        <AIRoomMakeoverPage />
      </main>
      <Footer />
    </>
  );
}
