export const KENYA_LOCATIONS: Record<string, Record<string, Record<string, string[]>>> = {
  Baringo: {
    "Baringo North": {
      Barwessa: ["Barwessa East", "Barwessa West"],
    },
  },
  Nairobi: {
    Westlands: {
      Parklands: ["Parklands", "Highridge"],
    },
  },
  Nakuru: {
    Naivasha: {
      "Mai Mahiu": ["Mai Mahiu", "Kijabe"],
    },
  },
};

export const getCounties = () => Object.keys(KENYA_LOCATIONS);

export const getSubCounties = (county: string) =>
  county && KENYA_LOCATIONS[county] ? Object.keys(KENYA_LOCATIONS[county]) : [];

export const getWards = (county: string, subCounty: string) =>
  county && subCounty && KENYA_LOCATIONS[county]?.[subCounty]
    ? Object.keys(KENYA_LOCATIONS[county][subCounty])
    : [];

export const getLocations = (county: string, subCounty: string, ward: string) =>
  county && subCounty && ward && KENYA_LOCATIONS[county]?.[subCounty]?.[ward]
    ? KENYA_LOCATIONS[county][subCounty][ward]
    : [];
