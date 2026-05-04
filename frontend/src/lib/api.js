// Detect if running as a native Capacitor app (Android/iOS)
// In native mode, relative URLs like /api/... don't work — we need the full server URL
const isCapacitorNative =
  typeof window !== 'undefined' &&
  window.Capacitor &&
  typeof window.Capacitor.isNativePlatform === 'function' &&
  window.Capacitor.isNativePlatform();

const API_URL =
  import.meta.env.VITE_API_URL ||
  (isCapacitorNative
    ? 'https://0c4275e2-15fa-4f27-820b-8405f59697bf-00-hmffvotwz3cw.riker.replit.dev'
    : '');

export default API_URL;
