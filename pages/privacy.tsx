
import React from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Политика конфиденциальности | Aura</title>
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] py-12">
        <div className="container mx-auto px-6 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-serif text-brand-brown mb-8">Политика конфиденциальности сервиса Aura</h1>
          <p className="mb-8 text-sm text-gray-500">Редакция от 15.01.2026</p>

          <div className="prose prose-brown max-w-none text-gray-700 space-y-6">
            <p>
              Мы, сервис Aura, управляемый Индивидуальным предпринимателем <strong>Гизатулиной Данией Амировной</strong>, уважаем ваше право на частную жизнь. Наша цель — помочь вам примерить мебель в интерьере, а не собирать досье. Этот документ объясняет, как мы работаем с данными простым и понятным языком.
            </p>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">1. Кто обрабатывает данные</h2>
              <p>
                Оператором данных является Индивидуальный предприниматель <strong>Гизатулина Дания Амировна</strong>.
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>ИНН:</strong> 745000639026</li>
                <li><strong>ОГРНИП:</strong> 325745600001360</li>
                <li><strong>Адрес:</strong> 454052, г. Челябинск, ул. Черкасская, д. 15, кв. 81</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">2. Какие данные мы собираем и зачем</h2>
              <p>
                Aura — это сервис визуализации. Для его работы нам не нужна ваша фамилия или паспортные данные. Мы обрабатываем только то, что необходимо для технического функционирования сервиса:
              </p>

              <h3 className="text-lg font-semibold text-brand-charcoal mt-4">Техническая информация</h3>
              <p>
                Когда вы пользуетесь Aura, мы автоматически получаем обезличенные данные:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>IP-адрес и тип вашего устройства;</li>
                <li>Версия операционной системы и браузера;</li>
                <li>Данные из файлов cookie (куки);</li>
                <li>Информация о том, как вы взаимодействуете с интерфейсом (куда нажимаете, какие модели смотрите).</li>
              </ul>
              <p className="mt-2">
                Пользователь может ограничить или отключить использование cookie в настройках своего браузера.
              </p>
              <p className="mt-2 text-sm italic">
                <strong>Зачем:</strong> Чтобы приложение работало стабильно, 3D-модели загружались быстро, а интерфейс подстраивался под ваш экран.
              </p>

              <h3 className="text-lg font-semibold text-brand-charcoal mt-4">Данные для AI и AR функций</h3>
              <p>
                Вы можете загружать фотографии своего интерьера для использования функций AI-редизайна или использовать камеру для AR-примерки.
              </p>
              <p className="mt-2"><strong>Важно:</strong></p>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>Фотографии интерьеров</strong> используются исключительно для генерации визуализаций в моменте.</li>
                <li>Мы <strong>не передаем</strong> ваши личные фотографии рекламным сетям.</li>
                <li>Мы <strong>не используем</strong> изображения вашего дома для идентификации личности.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">3. Аналитика и Реклама</h2>
              <p>
                Мы используем сервисы веб-аналитики, в частности <strong>Яндекс.Метрику</strong>, чтобы понимать, какие функции сервиса нравятся пользователям больше всего. Эти сервисы собирают обезличенную статистику.
              </p>
              <p className="mt-2">
                Также вы можете видеть наши рекламные материалы через систему <strong>Яндекс.Директ</strong>. Эти системы могут использовать собственные cookie-файлы для оптимизации рекламы, но Aura не передает им ваши личные фотографии или переписки.
              </p>
              <p className="mt-2">
                Обработка данных с использованием сервисов Яндекс осуществляется в соответствии с условиями и политиками конфиденциальности ООО «Яндекс».
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">4. Контактные данные</h2>
              <p>
                В приложении Aura нет обязательной регистрации. Мы не храним базы телефонных номеров или Email пользователей внутри сервиса.
              </p>
              <p className="mt-2">
                Если вы решите связаться с нами или продавцом через WhatsApp или Telegram, ваше общение будет проходить на платформе соответствующего мессенджера и регулироваться его правилами конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">5. Как мы защищаем данные</h2>
              <p>
                Мы принимаем необходимые технические меры для защиты данных от несанкционированного доступа. Мы используем современные протоколы шифрования (HTTPS) при передаче данных.
              </p>
              <p className="mt-2">
                Мы не продаем, не обмениваем и не сдаем в аренду информацию пользователей третьим лицам.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">6. Ваши права</h2>
              <p>
                В соответствии с 152-ФЗ РФ, вы имеете право:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>Узнать, какие данные о вас у нас есть (в данном случае — только технические логи);</li>
                <li>Отозвать согласие на обработку данных (написав нам на email);</li>
                <li>Потребовать удалить данные.</li>
              </ul>
              <p className="mt-2">
                Мы рассматриваем обращения пользователей в разумный срок, но не более 30 календарных дней.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-charcoal">7. Обратная связь</h2>
              <p>
                Если у вас есть вопросы по поводу конфиденциальности или работы сервиса, напишите нам:<br />
                <strong>Email:</strong> <a href="mailto:daniyagizatulina005@gmail.com" className="text-brand-brown hover:underline">daniyagizatulina005@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
