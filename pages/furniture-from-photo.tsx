
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FurnitureFromPhotoPage } from '../components/FurnitureFromPhotoPage';

export default function FurnitureFromPhoto() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <FurnitureFromPhotoPage />
      </main>
      <Footer />
    </>
  );
}
