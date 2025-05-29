import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { categories } from '@/constants/categories';
import { colors } from '@/constants/colors';
import { MapPin, TrendingUp, Star, Eye, Navigation } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { Product } from '@/types/product';
import * as Location from 'expo-location';

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

export default function HomeScreen() {
  const [userLocation, setUserLocation] = useState<{
    city: string;
    region: string;
    country: string;
    coordinates?: { latitude: number; longitude: number };
  }>({
    city: 'Dakar',
    region: 'Dakar',
    country: 'Sénégal'
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const { data: products, isLoading, refetch } = trpc.products.list.useQuery({
    limit: 6,
    country: userLocation.country === 'Sénégal' ? 'SN' : userLocation.country === 'Mali' ? 'ML' : 'BF',
    region: userLocation.region,
    city: userLocation.city
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
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour afficher les produits près de vous.',
          [
            { text: 'Continuer sans GPS', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setIsLoadingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      const { latitude, longitude } = location.coords;
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
        const location = getLocationFromCoordinates(latitude, longitude);
        setUserLocation({
          ...location,
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
        
        setUserLocation({
          ...mappedLocation,
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

  const handleCategoryPress = (categoryName: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { category: categoryName }
    });
  };

  const handleLocationPress = () => {
    Alert.alert(
      'Localisation',
      'Voulez-vous actualiser votre position ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Actualiser', onPress: getCurrentLocation }
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour!</Text>
          <Text style={styles.title}>AgriConnect</Text>
        </View>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleLocationPress}
        >
          {isLoadingLocation ? (
            <Navigation size={18} color={colors.primary} />
          ) : (
            <MapPin size={18} color={colors.primary} />
          )}
          <Text style={styles.locationText}>
            {isLoadingLocation ? 'Localisation...' : userLocation.city}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.searchText}>Rechercher un produit...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.name)}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.featured}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonces près de vous</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.productGrid}>
          {isLoading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : products?.products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune annonce disponible dans votre région</Text>
              <Text style={styles.emptySubtext}>
                Soyez le premier à publier une annonce !
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/post')}
              >
                <Text style={styles.emptyButtonText}>Publier une annonce</Text>
              </TouchableOpacity>
            </View>
          ) : (
            products?.products.map((product: Product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => router.push(`/products/${product.id}`)}
              >
                <Image
                  source={product.images[0]}
                  style={styles.productImage}
                  contentFit="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.title}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                      {product.price} FCFA/{product.unit}
                    </Text>
                    {product.negotiable && (
                      <Text style={styles.negotiableTag}>Négociable</Text>
                    )}
                  </View>
                  <View style={styles.productLocation}>
                    <MapPin size={12} color={colors.textLight} />
                    <Text style={styles.locationText}>
                      {product.location.city}
                    </Text>
                  </View>
                  <View style={styles.productStats}>
                    <View style={styles.stat}>
                      <Eye size={12} color={colors.textLight} />
                      <Text style={styles.statText}>{product.statistics.views}</Text>
                    </View>
                    {product.seller.verified && (
                      <View style={styles.verifiedBadge}>
                        <Star size={12} color={colors.secondary} />
                        <Text style={styles.verifiedText}>Vérifié</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.trending}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Tendances du marché</Text>
        </View>
        <View style={styles.trendingCard}>
          <Text style={styles.trendingText}>
            {products?.products.length === 0 
              ? "Aucune donnée de marché disponible pour le moment"
              : `${products?.products.length} nouvelles annonces dans votre région cette semaine`
            }
          </Text>
        </View>
      </View>

      {userLocation.coordinates && (
        <View style={styles.gpsInfo}>
          <Text style={styles.gpsText}>
            📍 Position GPS: {userLocation.coordinates.latitude.toFixed(4)}, {userLocation.coordinates.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: colors.textLight,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    color: colors.text,
    fontSize: 14,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    color: colors.textLight,
    fontSize: 16,
  },
  categories: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryList: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  featured: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  negotiableTag: {
    fontSize: 10,
    color: colors.secondary,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textLight,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '500',
  },
  loadingText: {
    color: colors.textLight,
    textAlign: 'center',
    width: '100%',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  trending: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  trendingCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingText: {
    color: colors.text,
    fontSize: 14,
  },
  gpsInfo: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  gpsText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});