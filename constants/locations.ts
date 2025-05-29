export type LocationData = {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  coordinates: { latitude: number; longitude: number };
};

export const countries = [
  {
    code: 'SN',
    name: 'Sénégal',
    regions: [
      {
        name: 'Dakar',
        cities: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Bargny'],
        coordinates: { latitude: 14.6928, longitude: -17.4467 }
      },
      {
        name: 'Thiès',
        cities: ['Thiès', 'Mbour', 'Tivaouane', 'Joal-Fadiouth', 'Popenguine'],
        coordinates: { latitude: 14.7886, longitude: -16.9246 }
      },
      {
        name: 'Saint-Louis',
        cities: ['Saint-Louis', 'Dagana', 'Podor', 'Richard-Toll'],
        coordinates: { latitude: 16.0167, longitude: -16.5000 }
      },
      {
        name: 'Diourbel',
        cities: ['Diourbel', 'Touba', 'Mbacké', 'Bambey'],
        coordinates: { latitude: 14.6500, longitude: -16.2333 }
      },
      {
        name: 'Louga',
        cities: ['Louga', 'Linguère', 'Kébémer'],
        coordinates: { latitude: 15.6167, longitude: -16.2167 }
      },
      {
        name: 'Fatick',
        cities: ['Fatick', 'Foundiougne', 'Gossas', 'Sokone'],
        coordinates: { latitude: 14.3333, longitude: -16.4167 }
      },
      {
        name: 'Kaolack',
        cities: ['Kaolack', 'Kaffrine', 'Nioro du Rip', 'Guinguinéo'],
        coordinates: { latitude: 14.1500, longitude: -16.0667 }
      },
      {
        name: 'Tambacounda',
        cities: ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum'],
        coordinates: { latitude: 13.7667, longitude: -13.6667 }
      },
      {
        name: 'Kédougou',
        cities: ['Kédougou', 'Saraya', 'Salémata'],
        coordinates: { latitude: 12.5500, longitude: -12.1833 }
      },
      {
        name: 'Kolda',
        cities: ['Kolda', 'Vélingara', 'Médina Yoro Foulah'],
        coordinates: { latitude: 12.8833, longitude: -14.9500 }
      },
      {
        name: 'Ziguinchor',
        cities: ['Ziguinchor', 'Oussouye', 'Bignona'],
        coordinates: { latitude: 12.5681, longitude: -16.2719 }
      },
      {
        name: 'Sédhiou',
        cities: ['Sédhiou', 'Bounkiling', 'Goudomp'],
        coordinates: { latitude: 12.7167, longitude: -15.5500 }
      },
      {
        name: 'Matam',
        cities: ['Matam', 'Kanel', 'Ranérou'],
        coordinates: { latitude: 15.6500, longitude: -13.2500 }
      },
      {
        name: 'Kaffrine',
        cities: ['Kaffrine', 'Birkelane', 'Koungheul', 'Malem-Hodar'],
        coordinates: { latitude: 14.1000, longitude: -15.5500 }
      }
    ]
  },
  {
    code: 'ML',
    name: 'Mali',
    regions: [
      {
        name: 'Bamako',
        cities: ['Bamako'],
        coordinates: { latitude: 12.6392, longitude: -8.0029 }
      },
      {
        name: 'Kayes',
        cities: ['Kayes', 'Kita', 'Bafoulabé'],
        coordinates: { latitude: 14.4500, longitude: -11.4333 }
      },
      {
        name: 'Koulikoro',
        cities: ['Koulikoro', 'Kati', 'Dioïla'],
        coordinates: { latitude: 12.8622, longitude: -7.5598 }
      },
      {
        name: 'Sikasso',
        cities: ['Sikasso', 'Bougouni', 'Yanfolila'],
        coordinates: { latitude: 11.3167, longitude: -5.6667 }
      }
    ]
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    regions: [
      {
        name: 'Centre',
        cities: ['Ouagadougou'],
        coordinates: { latitude: 12.3714, longitude: -1.5197 }
      },
      {
        name: 'Hauts-Bassins',
        cities: ['Bobo-Dioulasso', 'Banfora'],
        coordinates: { latitude: 11.1781, longitude: -4.2970 }
      }
    ]
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    regions: [
      {
        name: 'Abidjan',
        cities: ['Abidjan', 'Cocody', 'Yopougon', 'Treichville'],
        coordinates: { latitude: 5.3602, longitude: -4.0083 }
      },
      {
        name: 'Bas-Sassandra',
        cities: ['San-Pédro', 'Sassandra', 'Soubré'],
        coordinates: { latitude: 4.7500, longitude: -6.6333 }
      },
      {
        name: 'Comoé',
        cities: ['Abengourou', 'Agnibilékrou'],
        coordinates: { latitude: 6.7333, longitude: -3.4833 }
      },
      {
        name: 'Denguélé',
        cities: ['Odienné'],
        coordinates: { latitude: 9.5000, longitude: -7.5667 }
      }
    ]
  }
];

export const getRegionsByCountry = (countryCode: string) => {
  const country = countries.find(c => c.code === countryCode);
  return country?.regions || [];
};

export const getCitiesByRegion = (countryCode: string, regionName: string) => {
  const country = countries.find(c => c.code === countryCode);
  const region = country?.regions.find(r => r.name === regionName);
  return region?.cities || [];
};

export const getRegionCoordinates = (countryCode: string, regionName: string) => {
  const country = countries.find(c => c.code === countryCode);
  const region = country?.regions.find(r => r.name === regionName);
  return region?.coordinates;
};

export const getAllCities = () => {
  return countries.flatMap(country => 
    country.regions.flatMap(region => 
      region.cities.map(city => ({
        city,
        region: region.name,
        country: country.name,
        countryCode: country.code,
        coordinates: region.coordinates
      }))
    )
  );
};

export const findClosestLocation = (latitude: number, longitude: number): LocationData | null => {
  let closestLocation: LocationData | null = null;
  let minDistance = Infinity;

  countries.forEach(country => {
    country.regions.forEach(region => {
      const distance = Math.sqrt(
        Math.pow(latitude - region.coordinates.latitude, 2) + 
        Math.pow(longitude - region.coordinates.longitude, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = {
          country: country.name,
          countryCode: country.code,
          region: region.name,
          city: region.cities[0], // Default to first city in region
          coordinates: region.coordinates
        };
      }
    });
  });

  return closestLocation;
};