
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ShippingPage as ShippingComponent } from '../components/ShippingPage';
import { SEO } from '../components/SEO';

export default function Shipping() {
  return (
    <>
      <SEO title="Доставка и оплата" description="Узнайте условия доставки и оплаты в нашем интернет-магазине. Доставляем мебель по всей России." />
      <Header />
      <main className="flex-grow">
        <ShippingComponent />
      </main>
      <Footer />
    </>
  );
}
