import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Camera, X, Truck, MapPin, Navigation } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { ProductCondition, DeliveryMode, ProductLocation } from '@/types/product';
import { categories } from '@/constants/categories';
import { units, convertUnit } from '@/constants/units';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { LocationSelector } from '@/components/LocationSelector';

const conditionOptions: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'Neuf' },
  { value: 'fresh', label: 'Récolte fraîche' },
  { value: 'used', label: 'Occasion' },
  { value: 'needs_repair', label: 'À réviser' },
];

const deliveryOptions: { value: DeliveryMode; label: string }[] = [
  { value: 'local', label: 'Livraison locale' },
  { value: 'regional', label: 'Livraison régionale' },
  { value: 'pickup', label: 'Retrait sur place' },
];

// West African countries GPS coordinates mapping
const WEST_AFRICAN_LOCATIONS = {
  // Senegal
  'SN': {
    'Dakar': {
      'Dakar': { lat: 14.6928, lng: -17.4467 },
      'Pikine': { lat: 14.7549, lng: -17.3983 },
      'Guédiawaye': { lat: 14.7692, lng: -17.4056 },
      'Rufisque': { lat: 14.7167, lng: -17.2667 },
      'Bargny': { lat: 14.6833, lng: -17.2000 }
    },
    'Thiès': {
      'Thiès': { lat: 14.7886, lng: -16.9246 },
      'Mbour': { lat: 14.4167, lng: -16.9667 },
      'Tivaouane': { lat: 14.9500, lng: -16.8167 },
      'Joal-Fadiouth': { lat: 14.1667, lng: -16.8333 },
      'Popenguine': { lat: 14.3500, lng: -17.1167 }
    },
    'Saint-Louis': {
      'Saint-Louis': { lat: 16.0167, lng: -16.5000 },
      'Dagana': { lat: 16.5167, lng: -15.5000 },
      'Podor': { lat: 16.6500, lng: -14.9667 },
      'Richard-Toll': { lat: 16.4667, lng: -15.7000 }
    },
    'Ziguinchor': {
      'Ziguinchor': { lat: 12.5681, lng: -16.2719 },
      'Oussouye': { lat: 12.4833, lng: -16.5500 },
      'Bignona': { lat: 12.8167, lng: -16.2333 }
    }
  },
  // Mali
  'ML': {
    'Bamako': {
      'Bamako': { lat: 12.6392, lng: -8.0029 }
    },
    'Kayes': {
      'Kayes': { lat: 14.4500, lng: -11.4333 },
      'Kita': { lat: 13.0333, lng: -9.4833 },
      'Bafoulabé': { lat: 13.8167, lng: -10.8333 }
    }
  },
  // Burkina Faso
  'BF': {
    'Centre': {
      'Ouagadougou': { lat: 12.3714, lng: -1.5197 }
    },
    'Hauts-Bassins': {
      'Bobo-Dioulasso': { lat: 11.1781, lng: -4.2970 },
      'Banfora': { lat: 10.6333, lng: -4.7500 }
    }
  }
};

export default function PostScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [location, setLocation] = useState<ProductLocation>({
    country: 'SN',
    region: '',
    city: '',
    coordinates: undefined
  });
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('fresh');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(['pickup']);
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [deliveryFees, setDeliveryFees] = useState('');
  const [allowCalls, setAllowCalls] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: (newProduct) => {
      Alert.alert('Succès', 'Votre annonce a été publiée!', [
        { 
          text: 'Voir l\'annonce', 
          onPress: () => {
            router.push(`/products/${newProduct.id}`);
          }
        },
        { 
          text: 'Mes annonces', 
          onPress: () => {
            router.push('/(tabs)/profile');
          }
        }
      ]);
      
      // Reset form
      resetForm();
    },
    onError: (error: { message: string }) => {
      Alert.alert('Erreur', error.message);
    }
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      // Web geolocation fallback
      if (navigator.geolocation) {
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocode(latitude, longitude);
            setIsLoadingLocation(false);
          },
          (error) => {
            console.log('Web geolocation error:', error);
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
      return;
    }

    try {
      setIsLoadingLocation(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour géolocaliser votre produit.',
          [
            { text: 'Continuer sans GPS', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      const { latitude, longitude } = locationResult.coords;
      await reverseGeocode(latitude, longitude);
      
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use coordinate-based mapping
        const locationData = getLocationFromCoordinates(latitude, longitude);
        setLocation({
          country: locationData.country === 'Sénégal' ? 'SN' : locationData.country === 'Mali' ? 'ML' : 'BF',
          region: locationData.region,
          city: locationData.city,
          coordinates: { latitude, longitude }
        });
        return;
      }

      const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodedAddress.length > 0) {
        const address = reverseGeocodedAddress[0];
        
        // Map to West African locations
        const mappedLocation = mapToWestAfricanLocation(address);
        
        setLocation({
          country: mappedLocation.country === 'Sénégal' ? 'SN' : mappedLocation.country === 'Mali' ? 'ML' : 'BF',
          region: mappedLocation.region,
          city: mappedLocation.city,
          coordinates: { latitude, longitude }
        });
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
    }
  };

  const getLocationFromCoordinates = (lat: number, lng: number) => {
    // Find the closest city based on coordinates
    let closestCity = { city: 'Dakar', region: 'Dakar', country: 'Sénégal', distance: Infinity };
    
    Object.entries(WEST_AFRICAN_LOCATIONS).forEach(([countryCode, regions]) => {
      Object.entries(regions).forEach(([regionName, cities]) => {
        Object.entries(cities).forEach(([cityName, coords]) => {
          const distance = Math.sqrt(
            Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
          );
          
          if (distance < closestCity.distance) {
            const countryName = countryCode === 'SN' ? 'Sénégal' : countryCode === 'ML' ? 'Mali' : 'Burkina Faso';
            closestCity = {
              city: cityName,
              region: regionName,
              country: countryName,
              distance
            };
          }
        });
      });
    });
    
    return closestCity;
  };

  const mapToWestAfricanLocation = (address: any) => {
    const country = address.country || address.isoCountryCode;
    const region = address.region || address.subregion || address.city;
    const city = address.city || address.district || address.subregion;

    // Map country codes to full names
    const countryMapping: Record<string, string> = {
      'SN': 'Sénégal',
      'ML': 'Mali',
      'BF': 'Burkina Faso',
      'Senegal': 'Sénégal',
      'Mali': 'Mali',
      'Burkina Faso': 'Burkina Faso'
    };

    return {
      country: countryMapping[country] || 'Sénégal',
      region: region || 'Dakar',
      city: city || 'Dakar'
    };
  };

  const resetForm = () => {
    setImages([]);
    setTitle('');
    setPrice('');
    setNegotiable(false);
    setDescription('');
    setQuantity('');
    setUnit('kg');
    setLocation({ country: 'SN', region: '', city: '', coordinates: undefined });
    setCategory('');
    setCondition('fresh');
    setStartDate('');
    setEndDate('');
    setDuration('');
    setDeliveryModes(['pickup']);
    setFreeDelivery(true);
    setDeliveryFees('');
    setAllowCalls(false);
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const toggleDeliveryMode = (mode: DeliveryMode) => {
    if (deliveryModes.includes(mode)) {
      setDeliveryModes(deliveryModes.filter(m => m !== mode));
    } else {
      setDeliveryModes([...deliveryModes, mode]);
    }
  };

  const validateDates = () => {
    if (!startDate) return false;
    
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      Alert.alert('Erreur', 'La date de début ne peut pas être dans le passé');
      return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (end <= start) {
        Alert.alert('Erreur', 'La date de fin doit être postérieure à la date de début');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!title || !price || !quantity || !location.country || !location.region || !location.city || !category || !startDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    if (deliveryModes.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un mode de livraison');
      return;
    }

    if (!validateDates()) {
      return;
    }

    createProductMutation.mutate({
      title,
      price: parseFloat(price),
      negotiable,
      quantity: parseFloat(quantity),
      unit,
      location,
      category,
      description,
      condition,
      images,
      availability: {
        startDate,
        endDate: endDate || undefined,
        duration: duration || undefined,
      },
      delivery: {
        modes: deliveryModes,
        freeDelivery,
        deliveryFees: freeDelivery ? undefined : parseFloat(deliveryFees),
      },
      allowCalls,
    });
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    icon: cat.icon,
  }));

  const unitOptions = units.map(u => ({
    value: u.value,
    label: u.label,
  }));

  const getMinimumEndDate = () => {
    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + 1);
      return start;
    }
    return new Date();
  };

  const handleLocationChange = (newLocation: { country: string; region: string; city: string }) => {
    // Get coordinates for the selected city if available
    const countryCode = newLocation.country === 'Sénégal' ? 'SN' : newLocation.country === 'Mali' ? 'ML' : 'BF';
    const coordinates = WEST_AFRICAN_LOCATIONS[countryCode as keyof typeof WEST_AFRICAN_LOCATIONS]?.[newLocation.region]?.[newLocation.city];
    
    setLocation({
      country: newLocation.country,
      region: newLocation.region,
      city: newLocation.city,
      coordinates: coordinates ? { latitude: coordinates.lat, longitude: coordinates.lng } : undefined
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Camera size={24} color={colors.secondary} />
          <Text style={styles.addImageText}>
            Ajouter des photos ({images.length}/5)
          </Text>
        </TouchableOpacity>
        
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
            {images.map((uri, index) => (
              <View key={index} style={styles.previewContainer}>
                <Image source={uri} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Maïs jaune sec, Motoculteur thermique"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catégorie *</Text>
          <Dropdown
            options={categoryOptions}
            value={category}
            onSelect={setCategory}
            placeholder="Sélectionner une catégorie"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Prix *</Text>
            <TextInput
              style={styles.input}
              placeholder="Prix en FCFA"
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
              value={price}
              onChangeText={setPrice}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Unité *</Text>
            <Dropdown
              options={unitOptions}
              value={unit}
              onSelect={setUnit}
              placeholder="Unité"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setNegotiable(!negotiable)}
        >
          <View style={[styles.checkbox, negotiable && styles.checkboxChecked]}>
            {negotiable && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Prix négociable</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantité disponible *</Text>
          <TextInput
            style={styles.input}
            placeholder="Quantité disponible"
            keyboardType="numeric"
            placeholderTextColor={colors.textLight}
            value={quantity}
            onChangeText={setQuantity}
          />
          {quantity && unit && (
            <Text style={styles.quantityHelper}>
              {quantity} {units.find(u => u.value === unit)?.label}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>État du produit</Text>
          <View style={styles.optionGroup}>
            {conditionOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  condition === option.value && styles.optionButtonActive
                ]}
                onPress={() => setCondition(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  condition === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionTitle}>Localisation du produit</Text>
            <TouchableOpacity 
              style={styles.gpsButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <Navigation size={16} color={colors.white} />
              ) : (
                <MapPin size={16} color={colors.white} />
              )}
              <Text style={styles.gpsButtonText}>
                {isLoadingLocation ? 'Localisation...' : 'GPS'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <LocationSelector
            country={location.country}
            region={location.region}
            city={location.city}
            onLocationChange={handleLocationChange}
            required
          />
          
          {location.coordinates && (
            <Text style={styles.coordinatesText}>
              📍 Position GPS: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilité</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de disponibilité *</Text>
            <DatePicker
              value={startDate}
              onDateChange={setStartDate}
              placeholder="Sélectionner la date de début"
              minimumDate={new Date()}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Date de fin (optionnel)</Text>
              <DatePicker
                value={endDate}
                onDateChange={setEndDate}
                placeholder="Sélectionner la date de fin"
                minimumDate={getMinimumEndDate()}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Durée (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: jusqu'à épuisement"
                placeholderTextColor={colors.textLight}
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraison</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modes de livraison</Text>
            <View style={styles.optionGroup}>
              {deliveryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    deliveryModes.includes(option.value) && styles.optionButtonActive
                  ]}
                  onPress={() => toggleDeliveryMode(option.value)}
                >
                  <Truck size={16} color={
                    deliveryModes.includes(option.value) ? colors.white : colors.textLight
                  } />
                  <Text style={[
                    styles.optionText,
                    deliveryModes.includes(option.value) && styles.optionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFreeDelivery(!freeDelivery)}
          >
            <View style={[styles.checkbox, freeDelivery && styles.checkboxChecked]}>
              {freeDelivery && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Livraison gratuite</Text>
          </TouchableOpacity>

          {!freeDelivery && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frais de livraison (FCFA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Frais en FCFA"
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
                value={deliveryFees}
                onChangeText={setDeliveryFees}
              />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Informations complémentaires, conditions, origine..."
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setAllowCalls(!allowCalls)}
        >
          <View style={[styles.checkbox, allowCalls && styles.checkboxChecked]}>
            {allowCalls && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Autoriser les appels téléphoniques</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            createProductMutation.isPending && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={createProductMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createProductMutation.isPending ? 'Publication...' : 'Publier l\'annonce'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreview: {
    marginTop: 16,
  },
  previewContainer: {
    marginRight: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 4,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  gpsButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  quantityHelper: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
  },
  optionTextActive: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});