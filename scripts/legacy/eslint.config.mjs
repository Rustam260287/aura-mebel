import next from 'eslint-config-next';

const relaxedRules = {
  'react/no-unescaped-entities': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/static-components': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/immutability': 'off',
};

const extendedNext = next.map(config => ({
  ...config,
  rules: {
    ...(config.rules ?? {}),
    ...relaxedRules,
  },
}));

const config = [
  {
    ignores: ['.next/**', '.firebase/**', 'node_modules/**', 'out/**'],
  },
  ...extendedNext,
];

export default config;
