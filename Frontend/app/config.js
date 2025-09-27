// Centralized runtime configuration for the frontend.
// Change API_BASE when testing on a device to your machine's LAN IP (e.g. http://192.168.1.10:8000)
// The resolver below prefers explicit overrides in this order:
// 1) app/env.local.js (optional local file)
// 2) global.API_BASE
// 3) process.env.API_BASE
// 4) sensible defaults depending on platform and __DEV__
let localEnv = null;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  localEnv = require('./env.local');
} catch (e) {
  // env.local.js is optional — ignore if missing
}

const API_BASE = (() => {
  // 1) app/env.local.js
  if (localEnv && localEnv.API_BASE) return localEnv.API_BASE;

  // 2) global override
  if (typeof global !== 'undefined' && global.API_BASE) return global.API_BASE;

  // 3) environment variable
  if (typeof process !== 'undefined' && process.env && process.env.API_BASE) return process.env.API_BASE;

  const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  // 4) defaults
  if (__DEV__) {
    if (isWeb) return 'https://therapyapp-backend-82022078425.us-central1.run.app';
    return 'http://localhost:8000';
  }

  return 'https://therapyapp.com';
})();

export default {
  API_BASE,
};
