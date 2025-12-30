
import React from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Условия использования | Labelcom</title>
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] py-12">
        <div className="container mx-auto px-6 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-serif text-brand-brown mb-8">Условия использования</h1>
          
          <div className="prose prose-brown max-w-none text-gray-700 space-y-6">
            <p>
              Этот сайт — сервис визуальной примерки мебели: 3D‑просмотр, AR и спокойное сравнение вариантов в вашем интерьере.
            </p>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">1. Общие положения</h2>
              <p>
                1.1. Используя сайт, вы соглашаетесь с этими условиями.<br/>
                1.2. Мы можем обновлять условия и функциональность сервиса без предварительного уведомления.<br/>
                1.3. Сайт помогает принять решение о том, подходит ли объект для вашего пространства.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">2. Консультация</h2>
              <p>
                2.1. Если вы хотите обсудить детали, вы можете связаться с менеджером через контакты на сайте.<br/>
                2.2. Мы не используем механики давления и срочности в интерфейсе сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">3. Ограничения ответственности</h2>
              <p>
                3.1. 3D/AR‑визуализация — это приближенная модель восприятия, она может отличаться от реального вида из‑за освещения и особенностей камер/экранов.<br/>
                3.2. Мы рекомендуем использовать AR как инструмент примерки масштаба и визуального сочетания.
              </p>
            </section>

            <p className="text-sm text-gray-500 mt-8 italic">
              Юридическая информация и реквизиты: заполните данными вашей компании.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
