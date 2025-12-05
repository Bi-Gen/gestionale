/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ottimizzazioni per sviluppo più veloce
  compiler: {
    removeConsole: false, // mantieni i console.log in dev
  },

  // Configurazione webpack per cache migliore
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Cache più aggressiva in sviluppo
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },

  // Riduce la verbosità dei log
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

module.exports = nextConfig;
