import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;    // hex or named color
  icon?: string;     // 'worker' | 'customer' | 'shop'
  title?: string;
  subtitle?: string;
  distanceKm?: number;
}

interface Props {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: MapMarker[];
  polyline?: { lat: number; lng: number }[];
  showUserLocation?: boolean;
  userLat?: number;
  userLng?: number;
  onMarkerPress?: (id: string) => void;
}

export function LeafletViewMap({
  centerLat = 33.6844,
  centerLng = 73.0479,
  zoom = 13,
  markers = [],
  polyline,
  showUserLocation,
  userLat,
  userLng,
  onMarkerPress,
}: Props) {
  const webviewRef = useRef<WebView>(null);

  const markersJs = markers.map(m => {
    const color = m.color ?? '#2563eb';
    const label = m.icon === 'worker' ? '🔧' : m.icon === 'customer' ? '🏠' : '📍';
    const popup = m.title
      ? `<b>${m.title}</b>${m.subtitle ? `<br/>${m.subtitle}` : ''}${m.distanceKm ? `<br/>${m.distanceKm.toFixed(1)} km away` : ''}`
      : '';
    return `
      (function() {
        var icon = L.divIcon({
          html: '<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>',
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        var mk = L.marker([${m.lat}, ${m.lng}], { icon: icon }).addTo(map);
        ${popup ? `mk.bindPopup('${popup.replace(/'/g, "\\'")}');` : ''}
        mk.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ markerId: '${m.id}' }));
        });
      })();
    `;
  }).join('\n');

  const userJs = showUserLocation && userLat && userLng ? `
    var userIcon = L.divIcon({
      html: '<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup('You are here');
  ` : '';

  const polylineJs = polyline && polyline.length > 1 ? `
    L.polyline([${polyline.map(p => `[${p.lat},${p.lng}]`).join(',')}], {
      color: '#2563eb', weight: 2, dashArray: '8, 4'
    }).addTo(map);
  ` : '';

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
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    ${markersJs}
    ${userJs}
    ${polylineJs}
  </script>
</body>
</html>`;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.markerId && onMarkerPress) onMarkerPress(data.markerId);
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
