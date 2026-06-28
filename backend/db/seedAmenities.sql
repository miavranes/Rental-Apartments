-- Ensures amenity icon slugs match the frontend filter keys (wifi, car, etc.)
INSERT INTO amenities (name, icon)
SELECT v.name, v.icon
FROM (VALUES
  ('WiFi', 'wifi'),
  ('Parking', 'car'),
  ('Air Conditioning', 'snowflake'),
  ('Pool', 'waves'),
  ('Kitchen', 'utensils'),
  ('Washing Machine', 'washing-machine'),
  ('TV', 'tv'),
  ('Pet Friendly', 'paw-print'),
  ('Grill', 'flame'),
  ('Balcony', 'building'),
  ('Spa', 'spa'),
  ('Gym', 'gym'),
  ('Room Service', 'room-service'),
  ('Sea View', 'sea-view'),
  ('Mountain View', 'mountain-view'),
  ('Kettle', 'kettle'),
  ('Breakfast', 'breakfast'),
  ('Lunch', 'lunch'),
  ('Dinner', 'dinner')
) AS v(name, icon)
WHERE NOT EXISTS (SELECT 1 FROM amenities a WHERE a.icon = v.icon);

-- Normalize legacy icon values that block filtering / saving
UPDATE amenities SET icon = 'wifi' WHERE icon IN ('WiFi', 'wi-fi', 'WIFI') OR LOWER(name) = 'wifi';
UPDATE amenities SET icon = 'washing-machine' WHERE icon IN ('washer', 'washing_machine');
UPDATE amenities SET icon = 'paw-print' WHERE icon IN ('pets', 'pet-friendly', 'pet_friendly');
UPDATE amenities SET icon = 'snowflake' WHERE icon IN ('ac', 'air-conditioning', 'air_conditioning');
UPDATE amenities SET icon = 'car' WHERE icon IN ('parking');
