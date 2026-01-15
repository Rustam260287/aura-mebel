
import React from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Пользовательское соглашение | Aura</title>
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] py-12">
        <div className="container mx-auto px-6 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-serif text-brand-brown mb-8">Пользовательское соглашение сервиса Aura</h1>

          <div className="prose prose-brown max-w-none text-gray-700 space-y-6">
            <p className="font-medium">
              Пожалуйста, прочитайте этот текст. Используя веб-приложение Aura (далее — Сервис), вы соглашаетесь с этими условиями. Если вы не согласны, пожалуйста, не используйте Сервис.
            </p>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">1. О сервисе</h2>
              <p>
                Aura — это инструмент визуализации. Мы предоставляем технологии (3D-просмотр, Дополненная реальность/AR, AI-генерация), которые помогают вам представить, как мебель может выглядеть в вашем интерьере.
              </p>
              <p className="mt-2">
                <strong>Aura не является интернет-магазином.</strong> Мы не принимаем оплату внутри приложения и не заключаем договоры купли-продажи дистанционным способом через интерфейс приложения. Все решения о покупке вы принимаете самостоятельно, связываясь с менеджерами напрямую.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">2. Визуализация и Реальность</h2>
              <p>
                Технологии AR и AI дают <strong>примерное</strong> визуальное представление.
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>Оттенки:</strong> Цвет ткани на экране вашего смартфона может отличаться от реального цвета мебели из-за настроек дисплея и условий освещения.</li>
                <li><strong>Размеры:</strong> AR-примерка позволяет оценить габариты, но имеет техническую погрешность. Виртуальная модель не является инженерным чертежом.</li>
                <li><strong>AI-дизайн:</strong> Результаты работы Искусственного Интеллекта носят рекомендательный и творческий характер.</li>
              </ul>
              <p className="mt-2 text-sm italic">
                Мы рекомендуем уточнять точные размеры и образцы тканей у менеджера перед покупкой.
              </p>
              <p className="mt-2">
                Наличие рекламных материалов в сервисе не означает рекомендацию конкретных товаров или продавцов со стороны Aura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">3. Использование сервиса</h2>
              <p>
                Сервис предоставляется на условиях «как есть» (as is).
                Мы стараемся, чтобы Aura работала идеально, но не можем гарантировать, что:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>Сервис будет совместим со всеми моделями устройств (особенно устаревшими);</li>
                <li>AR-функции будут работать корректно при плохом освещении или на сложных поверхностях;</li>
                <li>В работе сервиса не будет технических сбоев.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">4. Интеллектуальная собственность</h2>
              <p>
                Все 3D-модели, дизайн интерфейса, программный код и контент сервиса Aura являются интеллектуальной собственностью Оператора или его партнеров.
              </p>
              <p className="mt-2">
                Вы можете использовать созданные визуализации (скриншоты, фото) для личных целей (например, обсудить интерьер с семьей), но копирование 3D-моделей или кода для коммерческого использования запрещено.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">5. Ограничение ответственности</h2>
              <p>
                Администрация сервиса не несет ответственности за:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>Любые решения, принятые пользователем на основе визуализаций (например, если диван не пролез в дверной проем, хотя в AR казалось иначе);</li>
                <li>Работу внешних мессенджеров (WhatsApp, Telegram) и сетей связи;</li>
                <li>Упущенную выгоду или косвенные убытки, связанные с использованием сервиса.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">6. Изменения условий</h2>
              <p>
                Мы развиваемся и добавляем новые функции (например, новые нейросети). Мы можем обновлять это соглашение. Продолжая пользоваться Aura после обновлений, вы принимаете новые правила.
              </p>
            </section>

            <section className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-brand-charcoal mb-2">Реквизиты:</h3>
              <p className="text-sm">
                ИП Гизатулина Дания Амировна<br />
                ИНН: 745000639026<br />
                Email: <a href="mailto:support@aura-mebel.ru" className="text-brand-brown hover:underline">support@aura-mebel.ru</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
