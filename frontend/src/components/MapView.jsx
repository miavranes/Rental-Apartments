import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView({ address, title, lat, lng }) {
  const [coords, setCoords] = useState(
    lat && lng ? [parseFloat(lat), parseFloat(lng)] : null
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lat && lng) {
      setCoords([parseFloat(lat), parseFloat(lng)]);
      return;
    }
    if (!address) return;
    const query = encodeURIComponent(address);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [address, lat, lng]);

  if (!address) return null;

  if (error) return (
    <p style={{ color: '#aaa', fontSize: 14 }}>Map not available for this address.</p>
  );

  if (!coords) return (
    <div style={s.skeleton}>
      <span style={{ color: '#aaa', fontSize: 13 }}>Loading map...</span>
    </div>
  );

  return (
    <div style={s.wrapper}>
      <MapContainer
        center={coords}
        zoom={15}
        style={{ width: '100%', height: '100%', borderRadius: 16 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>{title || address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

const s = {
  wrapper: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #ebebeb',
  },
  skeleton: {
    height: 320,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ebebeb',
  },
};
