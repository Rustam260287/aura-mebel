import Head from 'next/head';
import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = 'Aura Мебель';
const DEFAULT_DESCRIPTION = 'Премиальная мебель для вашего дома. Aura Мебель предлагает широкий выбор стильной и качественной мебели.';
const DEFAULT_IMAGE = '/og-image.jpg'; // Ensure this image exists in public folder
const SITE_URL = 'https://aura-mebel.com'; // Replace with actual domain

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = DEFAULT_DESCRIPTION, 
  image = DEFAULT_IMAGE,
  url
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Head>
  );
};
