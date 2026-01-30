CREATE TABLE IF NOT EXISTS logistics_routes (
  id TEXT PRIMARY KEY,
  crop TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km REAL,
  recommended_vehicle TEXT,
  estimated_cost_kes REAL,
  risk_level TEXT,
  departure_window TEXT,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO logistics_routes (
  id,
  crop,
  origin,
  destination,
  distance_km,
  recommended_vehicle,
  estimated_cost_kes,
  risk_level,
  departure_window,
  notes
)
VALUES
  ('maize-molo-nakuru-town-market', 'Maize', 'Molo', 'Nakuru Town Market', 45.0, 'Truck/Lorry', 3300.0, 'Low', 'Morning', 'Seasonal Price jumps'),
  ('green-beans-bahati-nakuru-town-market', 'Green beans', 'Bahati', 'Nakuru Town Market', 15.0, 'Pickup', 6000.0, NULL, 'Morning', 'Bulk Discounts for traders'),
  ('potatoes-njoro-nakuru-town-market', 'Potatoes', 'Njoro', 'Nakuru Town Market', 25.0, 'Canter', 2000.0, NULL, 'Morning', 'Seasonal Price jumps'),
  ('cabbages-njoro-nakuru-town-market', 'Cabbages', 'Njoro', 'Nakuru Town Market', 25.0, 'Tractor', 100.0, NULL, 'Morning', 'Seasonal Price jumps'),
  ('carrots-elementaita-naivasha-market', 'Carrots', 'Elementaita', 'Naivasha Market', 30.0, 'Pickup', 1200.0, 'Medium', 'Morning', 'Bulk Discounts for traders'),
  ('tomatoes-naivasha-gilgil-town', 'Tomatoes', 'Naivasha', 'Gilgil Town', 25.0, 'Motorbike', 1500.0, NULL, 'Morning', 'Spoilage during rains'),
  ('avocado-gilgil-nakuru-town-market', 'Avocado', 'Gilgil', 'Nakuru Town Market', 35.0, 'Pickup', 1900.0, NULL, 'Morning', 'Spoilage risks');
