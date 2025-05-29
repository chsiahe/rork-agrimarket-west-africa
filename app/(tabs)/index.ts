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
import { findClosestLocation, LocationData } from '@/constants/locations';
import { LineChart } from '@/components/LineChart';
import { MarketTrendAggregate } from '@/types/marketTrend';

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
    country: userLocation.country === 'Sénégal' ? 'SN' : userLocation.country === 'Mali' ? 'ML' : userLocation.country === 'Burkina Faso' ? 'BF' : userLocation.country === "Côte d'Ivoire" ? 'CI' : 'SN',
    region: userLocation.region,
    city: userLocation.city
  });
  
  const { data: marketTrends, isLoading: isLoadingTrends, refetch: refetchTrends } = trpc.marketTrends.get.useQuery({
    country: userLocation.country,
    region: userLocation.region,
    city: userLocation.city,
    limitCategories: 3,
    days: 30
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
        const location = findClosestLocation(latitude, longitude);
        if (location) {
          setUserLocation({
            city: location.city,
            region: location.region,
            country: location.country,
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
        
        setUserLocation({
          ...mappedLocation,
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
    refetchTrends();
  }, [refetch, refetchTrends]);

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
        
        {isLoadingTrends ? (
          <View style={styles.trendingCard}>
            <Text style={styles.trendingText}>Chargement des tendances...</Text>
          </View>
        ) : marketTrends && marketTrends.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.trendsCarousel}
          >
            <View style={styles.trendsList}>
              {marketTrends.map((trend: MarketTrendAggregate, index: number) => (
                <View key={`${trend.category}-${trend.city}-${index}`} style={styles.trendItem}>
                  <Text style={styles.trendTitle}>
                    {trend.category} à {trend.city}
                  </Text>
                  <Text style={styles.trendPrice}>
                    {trend.averagePrice} FCFA/{trend.unit}
                  </Text>
                  <Text style={styles.trendSubmissions}>
                    Basé sur {trend.submissions} soumission{trend.submissions > 1 ? 's' : ''}
                  </Text>
                  {trend.dataPoints.length > 1 && (
                    <LineChart data={trend.dataPoints} />
                  )}
                  <TouchableOpacity 
                    style={styles.contributeButton}
                    onPress={() => {
                      setActiveTab('market');
                      router.push('/(tabs)/profile');
                    }}
                  >
                    <Text style={styles.contributeButtonText}>Contribuer un prix</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.trendingCard}>
            <Text style={styles.trendingText}>
              Aucune donnée de marché disponible pour {userLocation.city}
            </Text>
            <TouchableOpacity 
              style={styles.contributeButton}
              onPress={() => {
                setActiveTab('market');
                router.push('/(tabs)/profile');
              }}
            >
              <Text style={styles.contributeButtonText}>Contribuer un prix</Text>
            </TouchableOpacity>
          </View>
        )}
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

// Assuming this is defined elsewhere in your app
const setActiveTab = (tab: string) => {
  // This is a placeholder for navigation or state management to switch tabs
  console.log(`Switching to ${tab} tab`);
};

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
    alignItems: 'center',
    gap: 12,
  },
  trendingText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  trendsCarousel: {
    maxHeight: 300,
  },
  trendsList: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 16,
  },
  trendItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    width: 280,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trendPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trendSubmissions: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  contributeButton: {
    backgroundColor: colors.secondary + '22', // Adding transparency
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  contributeButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
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
