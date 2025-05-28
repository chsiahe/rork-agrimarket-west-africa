export const countries = [
  {
    code: 'SN',
    name: 'Sénégal',
    regions: [
      {
        name: 'Dakar',
        cities: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Bargny']
      },
      {
        name: 'Thiès',
        cities: ['Thiès', 'Mbour', 'Tivaouane', 'Joal-Fadiouth', 'Popenguine']
      },
      {
        name: 'Saint-Louis',
        cities: ['Saint-Louis', 'Dagana', 'Podor', 'Richard-Toll']
      },
      {
        name: 'Diourbel',
        cities: ['Diourbel', 'Touba', 'Mbacké', 'Bambey']
      },
      {
        name: 'Louga',
        cities: ['Louga', 'Linguère', 'Kébémer']
      },
      {
        name: 'Fatick',
        cities: ['Fatick', 'Foundiougne', 'Gossas', 'Sokone']
      },
      {
        name: 'Kaolack',
        cities: ['Kaolack', 'Kaffrine', 'Nioro du Rip', 'Guinguinéo']
      },
      {
        name: 'Tambacounda',
        cities: ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum']
      },
      {
        name: 'Kédougou',
        cities: ['Kédougou', 'Saraya', 'Salémata']
      },
      {
        name: 'Kolda',
        cities: ['Kolda', 'Vélingara', 'Médina Yoro Foulah']
      },
      {
        name: 'Ziguinchor',
        cities: ['Ziguinchor', 'Oussouye', 'Bignona']
      },
      {
        name: 'Sédhiou',
        cities: ['Sédhiou', 'Bounkiling', 'Goudomp']
      },
      {
        name: 'Matam',
        cities: ['Matam', 'Kanel', 'Ranérou']
      },
      {
        name: 'Kaffrine',
        cities: ['Kaffrine', 'Birkelane', 'Koungheul', 'Malem-Hodar']
      }
    ]
  },
  {
    code: 'ML',
    name: 'Mali',
    regions: [
      {
        name: 'Bamako',
        cities: ['Bamako']
      },
      {
        name: 'Kayes',
        cities: ['Kayes', 'Kita', 'Bafoulabé']
      },
      {
        name: 'Koulikoro',
        cities: ['Koulikoro', 'Kati', 'Dioïla']
      },
      {
        name: 'Sikasso',
        cities: ['Sikasso', 'Bougouni', 'Yanfolila']
      }
    ]
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    regions: [
      {
        name: 'Centre',
        cities: ['Ouagadougou']
      },
      {
        name: 'Hauts-Bassins',
        cities: ['Bobo-Dioulasso', 'Banfora']
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

export const getAllCities = () => {
  return countries.flatMap(country => 
    country.regions.flatMap(region => 
      region.cities.map(city => ({
        city,
        region: region.name,
        country: country.name,
        countryCode: country.code
      }))
    )
  );
};