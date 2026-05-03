import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

interface Props {
  initialLat?: number;
  initialLng?: number;
  markerLat?: number | null;
  markerLng?: number | null;
  onLocationPicked: (lat: number, lng: number) => void;
}

export function LeafletPickerMap({
  initialLat = 33.6844,
  initialLng = 73.0479,
  markerLat,
  markerLng,
  onLocationPicked,
}: Props) {
  const webviewRef = useRef<WebView>(null);

  const markerJs = markerLat && markerLng
    ? `var marker = L.marker([${markerLat}, ${markerLng}]).addTo(map);`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${initialLat}, ${initialLng}], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var currentMarker = null;
    ${markerJs.replace('var marker', 'currentMarker')}

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      if (currentMarker) map.removeLayer(currentMarker);
      currentMarker = L.marker([lat, lng]).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
    });
  </script>
</body>
</html>`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.lat && data.lng) onLocationPicked(data.lat, data.lng);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
