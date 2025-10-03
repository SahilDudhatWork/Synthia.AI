/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'fr', 'es', 'it', 'de'],
    defaultLocale: 'en',
    localeDetection: true // (default) automatically redirects "/" to best match, e.g. "/fr"
  }
  
};
module.exports = nextConfig;

