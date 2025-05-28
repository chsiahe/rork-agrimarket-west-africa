import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Search, Filter, MapPin, Eye, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { categories } from '@/constants/categories';
import { countries, getRegionsByCountry, getCitiesByRegion } from '@/constants/locations';
import { trpc } from '@/lib/trpc';
import { router, useLocalSearchParams } from 'expo-router';
import { Product } from '@/types/product';
import { Dropdown } from '@/components/Dropdown';

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(params.category as string || '');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: searchResults, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    country: selectedCountry || undefined,
    region: selectedRegion || undefined,
    city: selectedCity || undefined,
    limit: 20
  });

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName === selectedCategory ? '' : categoryName);
  };

  const countryOptions = countries.map(c => ({
    value: c.code,
    label: c.name
  }));

  const regionOptions = selectedCountry 
    ? getRegionsByCountry(selectedCountry).map(r => ({
        value: r.name,
        label: r.name
      }))
    : [];

  const cityOptions = selectedCountry && selectedRegion
    ? getCitiesByRegion(selectedCountry, selectedRegion).map(c => ({
        value: c,
        label: c
      }))
    : [];

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedRegion('');
    setSelectedCity('');
  };

  const handleRegionChange = (regionName: string) => {
    setSelectedRegion(regionName);
    setSelectedCity('');
  };

  const clearLocationFilters = () => {
    setSelectedCountry('');
    setSelectedRegion('');
    setSelectedCity('');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push(`/products/${item.id}`)}
    >
      <Image
        source={item.images[0]}
        style={styles.productImage}
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            {item.price} FCFA/{item.unit}
          </Text>
          {item.negotiable && (
            <Text style={styles.negotiableTag}>Négociable</Text>
          )}
        </View>
        <View style={styles.productLocation}>
          <MapPin size={12} color={colors.textLight} />
          <Text style={styles.locationText}>
            {item.location.city}, {item.location.region}
          </Text>
        </View>
        <View style={styles.productStats}>
          <View style={styles.stat}>
            <Eye size={12} color={colors.textLight} />
            <Text style={styles.statText}>{item.statistics.views}</Text>
          </View>
          {item.seller.verified && (
            <View style={styles.verifiedBadge}>
              <Star size={12} color={colors.secondary} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Localisation</Text>
            
            <View style={styles.locationFilters}>
              <View style={styles.filterRow}>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <Dropdown
                    options={countryOptions}
                    value={selectedCountry}
                    onSelect={handleCountryChange}
                    placeholder="Pays"
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <Dropdown
                    options={regionOptions}
                    value={selectedRegion}
                    onSelect={handleRegionChange}
                    placeholder="Région"
                    disabled={!selectedCountry}
                  />
                </View>
                
                <View style={[styles.filterInput, { flex: 1, marginLeft: 8 }]}>
                  <Dropdown
                    options={cityOptions}
                    value={selectedCity}
                    onSelect={setSelectedCity}
                    placeholder="Ville"
                    disabled={!selectedRegion}
                  />
                </View>
              </View>

              {(selectedCountry || selectedRegion || selectedCity) && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearLocationFilters}
                >
                  <Text style={styles.clearButtonText}>Effacer les filtres</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={[
                  styles.categoryChip,
                  selectedCategory === category.name && styles.categoryChipActive
                ]}
                onPress={() => handleCategorySelect(category.name)}
              >
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.name && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.resultsCount}>
          {searchResults?.total || 0} résultat(s) trouvé(s)
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        ) : searchResults?.products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            <Text style={styles.emptySubtext}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults?.products || []}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  locationFilters: {
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.textLight,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.white,
  },
  categoriesSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
  },
  resultsSection: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  },
  productsList: {
    gap: 12,
  },
  row: {
    justifyContent: 'space-between',
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
  locationText: {
    fontSize: 12,
    color: colors.textLight,
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
});