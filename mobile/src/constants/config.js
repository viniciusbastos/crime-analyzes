// API Configuration
export const API_CONFIG = {
  // Change this to your computer's IP address when testing on mobile devices
  // For Android emulator: use 10.0.2.2
  // For iOS simulator: use localhost
  // For physical devices: use your computer's local IP (run `ipconfig getifaddr en0` on macOS or `hostname -I` on Linux)
  BASE_URL: __DEV__
    ? "https://apicrimeanalyze.bastosdev.xyz/api"
    : "https://your-production-api.com/api",

  TIMEOUT: 10000,
};

// Google Maps API Key - Replace with your actual key
export const GOOGLE_MAPS_API_KEY = "AIzaSyCT5BLfIar3xe5xI9ByAdWAGeObfnTvOXQ";

// Mapbox Access Token - Replace with your actual Mapbox token
export const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoidmluaWNpdXNiYXN0b3MiLCJhIjoiY2x6cW5xZGZzMGJ5ZzJqcGJzZ3p5ZG5zYSJ9.YourActualTokenHere";
