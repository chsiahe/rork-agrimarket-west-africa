import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { countries, getRegionsByCountry, getCitiesByRegion } from '@/constants/locations';
import { Dropdown } from '@/components/Dropdown';

interface LocationSelectorProps {
  country: string;
  region: string;
  city: string;
  onLocationChange: (location: { country: string; region: string; city: string }) => void;
  label?: string;
  required?: boolean;
}

export function LocationSelector({
  country,
  region,
  city,
  onLocationChange,
  label = 'Localisation',
  required = false
}: LocationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedCity, setSelectedCity] = useState(city);
  const [regions, setRegions] = useState(() => getRegionsByCountry(country));
  const [cities, setCities] = useState(() => getCitiesByRegion(country, region));

  // Memoize the callback to prevent unnecessary re-renders
  const handleLocationChange = useCallback((newCountry: string, newRegion: string, newCity: string) => {
    onLocationChange({
      country: newCountry,
      region: newRegion,
      city: newCity
    });
  }, [onLocationChange]);

  // Handle country change
  useEffect(() => {
    if (selectedCountry !== country) {
      const newRegions = getRegionsByCountry(selectedCountry);
      setRegions(newRegions);
      setSelectedRegion('');
      setSelectedCity('');
      setCities([]);
      handleLocationChange(selectedCountry, '', '');
    }
  }, [selectedCountry, country, handleLocationChange]);

  // Handle region change
  useEffect(() => {
    if (selectedRegion !== region) {
      const newCities = getCitiesByRegion(selectedCountry, selectedRegion);
      setCities(newCities);
      setSelectedCity('');
      handleLocationChange(selectedCountry, selectedRegion, '');
    }
  }, [selectedRegion, region, selectedCountry, handleLocationChange]);

  // Handle city change
  useEffect(() => {
    if (selectedCity !== city) {
      handleLocationChange(selectedCountry, selectedRegion, selectedCity);
    }
  }, [selectedCity, city, selectedCountry, selectedRegion, handleLocationChange]);

  // Update local state when props change
  useEffect(() => {
    if (country !== selectedCountry) {
      setSelectedCountry(country);
    }
  }, [country, selectedCountry]);

  useEffect(() => {
    if (region !== selectedRegion) {
      setSelectedRegion(region);
    }
  }, [region, selectedRegion]);

  useEffect(() => {
    if (city !== selectedCity) {
      setSelectedCity(city);
    }
  }, [city, selectedCity]);

  const countryOptions = countries.map(c => ({
    value: c.code,
    label: c.name
  }));

  const regionOptions = regions.map(r => ({
    value: r.name,
    label: r.name
  }));

  const cityOptions = cities.map(c => ({
    value: c,
    label: c
  }));

  const handleCountrySelect = useCallback((value: string) => {
    setSelectedCountry(value);
  }, []);

  const handleRegionSelect = useCallback((value: string) => {
    setSelectedRegion(value);
  }, []);

  const handleCitySelect = useCallback((value: string) => {
    setSelectedCity(value);
  }, []);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Pays</Text>
          <Dropdown
            options={countryOptions}
            value={selectedCountry}
            onSelect={handleCountrySelect}
            placeholder="Sélectionner un pays"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Région</Text>
          <Dropdown
            options={regionOptions}
            value={selectedRegion}
            onSelect={handleRegionSelect}
            placeholder="Sélectionner une région"
            disabled={!selectedCountry}
          />
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.inputLabel}>Ville</Text>
          <Dropdown
            options={cityOptions}
            value={selectedCity}
            onSelect={handleCitySelect}
            placeholder="Sélectionner une ville"
            disabled={!selectedRegion}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  required: {
    color: colors.error,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});