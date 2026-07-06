import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPin }) {
  useMapEvents({
    click(e) {
      onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ coords }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 15, { duration: 1 });
  }, [coords, map]);
  return null;
}

export default function PinMap({ pin, onPin }) {
  const { t } = useTranslation();
  const center = pin ? [pin.lat, pin.lng] : [42.7087, 19.3744]; // default: Montenegro

  return (
    <div style={s.wrapper}>
      <p style={s.hint}>{t('owner.pinHintClick')}</p>
      <div style={s.mapBox}>
        <MapContainer
          center={center}
          zoom={pin ? 15 : 8}
          style={{ width: '100%', height: '100%', borderRadius: 12 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPin={onPin} />
          {pin && <FlyTo coords={pin} />}
          {pin && <Marker position={[pin.lat, pin.lng]} />}
        </MapContainer>
      </div>
      {pin && (
        <div style={s.coords}>
          <span>📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
          <button type="button" onClick={() => onPin(null)} style={s.clearBtn}>{t('owner.removePin')}</button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: { marginTop: 8 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 8px' },
  mapBox: { height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd' },
  coords: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: '#555' },
  clearBtn: { background: 'none', border: 'none', color: '#c0392b', fontSize: 13, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif", padding: 0 },
};
