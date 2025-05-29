import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { countries, getRegionsByCountry } from '@/constants/locations';
import { Dropdown } from '@/components/Dropdown';
import { X, Plus } from 'lucide-react-native';
import { OperatingArea } from '@/types/user';

interface OperatingAreaSelectorProps {
  operatingAreas?: OperatingArea;
  onOperatingAreasChange: (areas: OperatingArea) => void;
  userCountry: string;
}

export function OperatingAreaSelector({
  operatingAreas,
  onOperatingAreasChange,
  userCountry
}: OperatingAreaSelectorProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(operatingAreas?.regions || []);
  const [maxDistance, setMaxDistance] = useState(operatingAreas?.maxDeliveryDistance?.toString() || '50');
  const [deliveryZones, setDeliveryZones] = useState<string[]>(operatingAreas?.deliveryZones || []);
  const [newZone, setNewZone] = useState('');

  const regions = getRegionsByCountry(userCountry);
  const regionOptions = regions.map(r => ({
    value: r.name,
    label: r.name
  }));

  const handleRegionToggle = (regionName: string) => {
    const newRegions = selectedRegions.includes(regionName)
      ? selectedRegions.filter(r => r !== regionName)
      : [...selectedRegions, regionName];
    
    setSelectedRegions(newRegions);
    updateOperatingAreas(newRegions, maxDistance, deliveryZones);
  };

  const handleMaxDistanceChange = (distance: string) => {
    setMaxDistance(distance);
    updateOperatingAreas(selectedRegions, distance, deliveryZones);
  };

  const addDeliveryZone = () => {
    if (newZone.trim() && !deliveryZones.includes(newZone.trim())) {
      const newZones = [...deliveryZones, newZone.trim()];
      setDeliveryZones(newZones);
      setNewZone('');
      updateOperatingAreas(selectedRegions, maxDistance, newZones);
    }
  };

  const removeDeliveryZone = (zone: string) => {
    const newZones = deliveryZones.filter(z => z !== zone);
    setDeliveryZones(newZones);
    updateOperatingAreas(selectedRegions, maxDistance, newZones);
  };

  const updateOperatingAreas = (regions: string[], distance: string, zones: string[]) => {
    onOperatingAreasChange({
      regions,
      maxDeliveryDistance: parseInt(distance) || 50,
      deliveryZones: zones
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zones d'opération</Text>
      <Text style={styles.subtitle}>
        Définissez les régions où vous opérez et vos zones de livraison
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Régions d'opération</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.regionList}>
            {regionOptions.map((region) => (
              <TouchableOpacity
                key={region.value}
                style={[
                  styles.regionChip,
                  selectedRegions.includes(region.value) && styles.regionChipActive
                ]}
                onPress={() => handleRegionToggle(region.value)}
              >
                <Text style={[
                  styles.regionText,
                  selectedRegions.includes(region.value) && styles.regionTextActive
                ]}>
                  {region.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distance de livraison maximale</Text>
        <View style={styles.distanceContainer}>
          <TextInput
            style={styles.distanceInput}
            placeholder="50"
            value={maxDistance}
            onChangeText={handleMaxDistanceChange}
            keyboardType="numeric"
          />
          <Text style={styles.distanceUnit}>km</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zones de livraison spécifiques</Text>
        <View style={styles.addZoneContainer}>
          <TextInput
            style={styles.zoneInput}
            placeholder="Ajouter une zone (ex: Marché Sandaga)"
            value={newZone}
            onChangeText={setNewZone}
          />
          <TouchableOpacity style={styles.addButton} onPress={addDeliveryZone}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {deliveryZones.length > 0 && (
          <View style={styles.zonesList}>
            {deliveryZones.map((zone, index) => (
              <View key={index} style={styles.zoneChip}>
                <Text style={styles.zoneText}>{zone}</Text>
                <TouchableOpacity onPress={() => removeDeliveryZone(zone)}>
                  <X size={16} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  regionList: {
    flexDirection: 'row',
    gap: 8,
  },
  regionChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionText: {
    fontSize: 14,
    color: colors.text,
  },
  regionTextActive: {
    color: colors.white,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  distanceUnit: {
    fontSize: 16,
    color: colors.text,
  },
  addZoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  zoneText: {
    fontSize: 14,
    color: colors.text,
  },
});
