import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '.firebase/**',
      '.next/**',
      'coverage/**',
      'functions/lib/**',
      'generated_images/**',
      'logs/**',
      'public/sw.js',
      'public/workbox-*.js',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];
