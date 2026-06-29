const { formatLocation, parseNominatimResult } = require('../utils/locationUtils');

const searchPlaces = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      addressdetails: '1',
      limit: '8',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'Rentura/1.0 (rental-apartments)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service unavailable.' });
    }

    const data = await response.json();
    const places = data
      .map(parseNominatimResult)
      .filter((p) => p.location)
      .filter((p, i, arr) => arr.findIndex((x) => x.label === p.label) === i);

    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { searchPlaces, formatLocation };
