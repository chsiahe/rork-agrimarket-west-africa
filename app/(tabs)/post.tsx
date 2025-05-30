import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Camera, X, Truck, MapPin, Navigation, Tag, FileText, Calendar, Info } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { ProductCondition, DeliveryMode, ProductLocation } from '@/types/product';
import { categories } from '@/constants/categories';
import { units } from '@/constants/units';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { LocationSelector } from '@/components/LocationSelector';
import { findClosestLocation, getRegionCoordinates } from '@/constants/locations';

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

type PostTab = 'product' | 'details' | 'location' | 'delivery' | 'photos';

export default function PostScreen() {
  const [activeTab, setActiveTab] = useState<PostTab>('product');
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
          async (position: GeolocationPosition) => {
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
        const locationData = findClosestLocation(latitude, longitude);
        if (locationData) {
          setLocation({
            country: locationData.countryCode,
            region: locationData.region,
            city: locationData.city,
            coordinates: { latitude, longitude }
          });
        }
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
          country: mappedLocation.country === 'Sénégal' ? 'SN' : mappedLocation.country === 'Mali' ? 'ML' : mappedLocation.country === 'Burkina Faso' ? 'BF' : mappedLocation.country === "Côte d'Ivoire" ? 'CI' : 'SN',
          region: mappedLocation.region,
          city: mappedLocation.city,
          coordinates: { latitude, longitude }
        });
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
    }
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
      'CI': "Côte d'Ivoire",
      'Senegal': 'Sénégal',
      'Mali': 'Mali',
      'Burkina Faso': 'Burkina Faso',
      "Cote d'Ivoire": "Côte d'Ivoire",
      "Ivory Coast": "Côte d'Ivoire"
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
    setActiveTab('product');
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

  const validateForm = () => {
    if (!title) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du produit');
      setActiveTab('product');
      return false;
    }
    
    if (!category) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      setActiveTab('product');
      return false;
    }
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un prix valide');
      setActiveTab('product');
      return false;
    }
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir une quantité valide');
      setActiveTab('details');
      return false;
    }
    
    if (!location.country || !location.region || !location.city) {
      Alert.alert('Erreur', 'Veuillez sélectionner une localisation complète');
      setActiveTab('location');
      return false;
    }
    
    if (!startDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date de disponibilité');
      setActiveTab('details');
      return false;
    }
    
    if (!validateDates()) {
      setActiveTab('details');
      return false;
    }
    
    if (deliveryModes.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un mode de livraison');
      setActiveTab('delivery');
      return false;
    }
    
    if (!freeDelivery && (!deliveryFees || isNaN(Number(deliveryFees)) || Number(deliveryFees) < 0)) {
      Alert.alert('Erreur', 'Veuillez saisir des frais de livraison valides');
      setActiveTab('delivery');
      return false;
    }
    
    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      setActiveTab('photos');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
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
    const coordinates = getRegionCoordinates(newLocation.country, newLocation.region);
    
    setLocation({
      country: newLocation.country,
      region: newLocation.region,
      city: newLocation.city,
      coordinates: coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : undefined
    });
  };

  const renderTabIndicator = () => (
    <View style={styles.tabIndicator}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'product' && styles.activeTabButton]}
        onPress={() => setActiveTab('product')}
      >
        <Tag size={20} color={activeTab === 'product' ? colors.white : colors.textLight} />
        <Text style={[styles.tabButtonText, activeTab === 'product' && styles.activeTabButtonText]}>
          Produit
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'details' && styles.activeTabButton]}
        onPress={() => setActiveTab('details')}
      >
        <Info size={20} color={activeTab === 'details' ? colors.white : colors.textLight} />
        <Text style={[styles.tabButtonText, activeTab === 'details' && styles.activeTabButtonText]}>
          Détails
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'location' && styles.activeTabButton]}
        onPress={() => setActiveTab('location')}
      >
        <MapPin size={20} color={activeTab === 'location' ? colors.white : colors.textLight} />
        <Text style={[styles.tabButtonText, activeTab === 'location' && styles.activeTabButtonText]}>
          Lieu
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'delivery' && styles.activeTabButton]}
        onPress={() => setActiveTab('delivery')}
      >
        <Truck size={20} color={activeTab === 'delivery' ? colors.white : colors.textLight} />
        <Text style={[styles.tabButtonText, activeTab === 'delivery' && styles.activeTabButtonText]}>
          Livraison
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'photos' && styles.activeTabButton]}
        onPress={() => setActiveTab('photos')}
      >
        <Camera size={20} color={activeTab === 'photos' ? colors.white : colors.textLight} />
        <Text style={[styles.tabButtonText, activeTab === 'photos' && styles.activeTabButtonText]}>
          Photos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductTab = () => (
    <View style={styles.tabContent}>
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
          searchable={true}
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
            searchable={false}
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

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={[styles.nextButton, (!title || !category || !price) && styles.nextButtonDisabled]}
          onPress={() => setActiveTab('details')}
          disabled={!title || !category || !price}
        >
          <Text style={styles.nextButtonText}>Suivant: Détails</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
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

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setActiveTab('product')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextButton, (!quantity || !startDate) && styles.nextButtonDisabled]}
          onPress={() => setActiveTab('location')}
          disabled={!quantity || !startDate}
        >
          <Text style={styles.nextButtonText}>Suivant: Localisation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocationTab = () => (
    <View style={styles.tabContent}>
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

      <TouchableOpacity 
        style={styles.checkboxRow}
        onPress={() => setAllowCalls(!allowCalls)}
      >
        <View style={[styles.checkbox, allowCalls && styles.checkboxChecked]}>
          {allowCalls && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Autoriser les appels téléphoniques</Text>
      </TouchableOpacity>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setActiveTab('details')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextButton, (!location.country || !location.region || !location.city) && styles.nextButtonDisabled]}
          onPress={() => setActiveTab('delivery')}
          disabled={!location.country || !location.region || !location.city}
        >
          <Text style={styles.nextButtonText}>Suivant: Livraison</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeliveryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Options de livraison</Text>
      
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

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setActiveTab('location')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextButton, deliveryModes.length === 0 && styles.nextButtonDisabled]}
          onPress={() => setActiveTab('photos')}
          disabled={deliveryModes.length === 0}
        >
          <Text style={styles.nextButtonText}>Suivant: Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Photos du produit</Text>
      <Text style={styles.sectionSubtitle}>
        Ajoutez des photos claires et de qualité pour attirer plus d'acheteurs
      </Text>
      
      <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
        <Camera size={24} color={colors.secondary} />
        <Text style={styles.addImageText}>
          Ajouter des photos ({images.length}/5)
        </Text>
      </TouchableOpacity>
      
      {images.length > 0 && (
        <FlatList
          data={images}
          horizontal={false}
          numColumns={2}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.previewContainer}>
              <Image source={item} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setImages(images.filter((_, i) => i !== index))}
              >
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.imagePreviewGrid}
        />
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setActiveTab('delivery')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (images.length === 0 || createProductMutation.isPending) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={images.length === 0 || createProductMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createProductMutation.isPending ? 'Publication...' : 'Publier l\'annonce'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'product':
        return renderProductTab();
      case 'details':
        return renderDetailsTab();
      case 'location':
        return renderLocationTab();
      case 'delivery':
        return renderDeliveryTab();
      case 'photos':
        return renderPhotosTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Publier une annonce</Text>
      </View>
      
      {renderTabIndicator()}
      
      <View style={styles.content}>
        {renderActiveTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  tabIndicator: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabButtonText: {
    fontSize: 12,
    color: colors.textLight,
  },
  activeTabButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    gap: 16,
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
    backgroundColor: colors.white,
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
  imagePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  previewContainer: {
    width: '48%',
    aspectRatio: 1,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
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
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
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
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginRight: 8,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
});