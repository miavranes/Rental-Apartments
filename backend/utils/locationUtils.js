function formatLocation({ location, municipality, country } = {}) {
  if (!location) return '';
  const parts = [location];
  if (municipality && municipality.toLowerCase() !== location.toLowerCase()) {
    parts.push(municipality);
  }
  if (country) parts.push(country);
  return parts.join(', ');
}

function parseNominatimResult(item) {
  const a = item.address || {};
  const location =
    a.city || a.town || a.village || a.hamlet || a.suburb || item.name || '';
  const municipality =
    a.municipality || a.county || a.state_district || a.region || '';
  const country = a.country || '';

  const place = {
    location,
    municipality,
    country,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };

  return {
    ...place,
    label: formatLocation(place),
  };
}

module.exports = { formatLocation, parseNominatimResult };
