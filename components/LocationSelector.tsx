import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { countries, getRegionsByCountry, getCitiesByRegion } from '@/constants/locations';
import { Dropdown } from '@/components/Dropdown';

interface LocationSelectorProps {
  country: string;
  regionId: string;
  city: string;
  onLocationChange: (location: { country: string; regionId: string; city: string }) => void;
  label?: string;
  required?: boolean;
}

export function LocationSelector({
  country,
  regionId,
  city,
  onLocationChange,
  label = 'Localisation',
  required = false
}: LocationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedRegionId, setSelectedRegionId] = useState(regionId);
  const [selectedCity, setSelectedCity] = useState(city);
  const [regions, setRegions] = useState(getRegionsByCountry(country));
  const [cities, setCities] = useState(getCitiesByRegion(country, regionId));

  useEffect(() => {
    const newRegions = getRegionsByCountry(selectedCountry);
    setRegions(newRegions);
    
    if (selectedCountry !== country) {
      setSelectedRegionId('');
      setSelectedCity('');
      setCities([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    const newCities = getCitiesByRegion(selectedCountry, selectedRegionId);
    setCities(newCities);
    
    if (selectedRegionId !== regionId) {
      setSelectedCity('');
    }
  }, [selectedRegionId]);

  useEffect(() => {
    onLocationChange({
      country: selectedCountry,
      regionId: selectedRegionId || '',
      city: selectedCity
    });
  }, [selectedCountry, selectedRegionId, selectedCity]);

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
            onSelect={setSelectedCountry}
            placeholder="Sélectionner un pays"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Région</Text>
          <Dropdown
            options={regionOptions}
            value={selectedRegionId}
            onSelect={setSelectedRegionId}
            placeholder="Sélectionner une région"
            disabled={!selectedCountry}
          />
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.inputLabel}>Ville</Text>
          <Dropdown
            options={cityOptions}
            value={selectedCity}
            onSelect={setSelectedCity}
            placeholder="Sélectionner une ville"
            disabled={!selectedRegionId}
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