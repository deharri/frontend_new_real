// Dynamic config — reads Google Maps key from .env
// app.json is the base; this file extends it with runtime env vars
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },
});
