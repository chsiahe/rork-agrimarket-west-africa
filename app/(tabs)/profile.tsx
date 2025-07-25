import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { 
  User, 
  Settings, 
  Heart, 
  Package, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  LogOut,
  Eye,
  TrendingUp
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { Product } from '@/types/product';
import { useAuthStore } from '@/stores/auth-store';
import { categories } from '@/constants/categories';
import { getAllCities } from '@/constants/locations';
import { Dropdown } from '@/components/Dropdown';
import { FlatList } from 'react-native';
import { useTabStore } from '@/stores/tab-store';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 16px padding on each side + 16px gap

type TabType = 'listings' | 'favorites' | 'settings' | 'market';

export default function ProfileScreen() {
  // Get the active tab from the store with a default fallback
  const { activeProfileTab, setActiveProfileTab } = useTabStore();
  const [activeTab, setActiveTab] = useState<TabType>(activeProfileTab || 'listings');
  const { user } = useAuthStore();
  
  // Update local state when store changes
  useEffect(() => {
    if (activeProfileTab) {
      setActiveTab(activeProfileTab);
    }
  }, [activeProfileTab]);

  // Update store when local state changes
  useEffect(() => {
    setActiveProfileTab(activeTab);
  }, [activeTab, setActiveProfileTab]);
  
  // Get current user ID, fallback to '1' for demo purposes
  const currentUserId = user?.id || '1';
  
  const { data: userProfile } = trpc.users.profile.useQuery({
    userId: currentUserId
  });
  
  const { data: userListings, refetch: refetchListings } = trpc.products.list.useQuery({
    userId: currentUserId,
    limit: 20
  });

  // Mock favorites data
  const favorites: Product[] = [];
  
  // State for market price submission
  const [category, setCategory] = useState(categories[0].name);
  const [productName, setProductName] = useState('');
  const [city, setCity] = useState(user?.location?.city || 'Dakar');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const submitMutation = trpc.marketTrends.submit.useMutation({
    onMutate: () => setSubmissionStatus('submitting'),
    onSuccess: () => {
      setSubmissionStatus('success');
      setPrice('');
      setProductName('');
      setTimeout(() => setSubmissionStatus('idle'), 3000);
    },
    onError: () => {
      setSubmissionStatus('error');
      setTimeout(() => setSubmissionStatus('idle'), 3000);
    }
  });

  const handleSubmitPrice = () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setSubmissionStatus('error');
      setTimeout(() => setSubmissionStatus('idle'), 3000);
      return;
    }

    submitMutation.mutate({
      category,
      productName: productName || undefined,
      city,
      region: user?.location?.region || 'Dakar',
      country: user?.location?.country || 'Sénégal',
      price: Number(price),
      unit
    });
  };

  const cities = getAllCities();
  const cityOptions = cities.map(city => ({
    value: city.city,
    label: `${city.city}, ${city.region}`
  }));

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    icon: cat.icon
  }));

  const unitOptions = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'tonne', label: 'Tonne' },
    { value: 'sac', label: 'Sac' },
    { value: 'pièce', label: 'Pièce' },
    { value: 'litre', label: 'Litre' }
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[styles.productCard, { width: cardWidth }]}
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
        <Text style={styles.productPrice}>
          {item.price} FCFA/{item.unit}
        </Text>
        <View style={styles.productStats}>
          <View style={styles.stat}>
            <Eye size={12} color={colors.textLight} />
            <Text style={styles.statText}>{item.statistics.views}</Text>
          </View>
          <Text style={styles.productStatus}>
            {item.negotiable ? 'Négociable' : 'Prix fixe'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Calculate display stats from userProfile or fallback values
  const displayStats = {
    totalListings: userProfile?.listings?.length || userListings?.products?.length || 0,
    totalSales: userProfile?.totalSales || 0,
    rating: userProfile?.rating || 0
  };

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Mes annonces</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/post')}
        >
          <Text style={styles.addButtonText}>+ Nouvelle annonce</Text>
        </TouchableOpacity>
      </View>
      
      {userListings?.products && userListings.products.length > 0 ? (
        <FlatList
          data={userListings.products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          onRefresh={refetchListings}
          refreshing={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Package size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Aucune annonce publiée</Text>
          <Text style={styles.emptySubtext}>
            Commencez par publier votre première annonce
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/post')}
          >
            <Text style={styles.emptyButtonText}>Publier une annonce</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFavoritesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Favoris</Text>
      
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Heart size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Aucun favori</Text>
          <Text style={styles.emptySubtext}>
            Les produits que vous aimez apparaîtront ici
          </Text>
        </View>
      )}
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Paramètres</Text>
      <View style={styles.settingsList}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/profile/edit')}
        >
          <Edit size={20} color={colors.textLight} />
          <Text style={styles.settingText}>Modifier le profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Settings size={20} color={colors.textLight} />
          <Text style={styles.settingText}>Préférences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Phone size={20} color={colors.textLight} />
          <Text style={styles.settingText}>Numéro de téléphone</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Mail size={20} color={colors.textLight} />
          <Text style={styles.settingText}>Adresse email</Text>
        </TouchableOpacity>
        
        <View style={styles.settingDivider} />
        
        <TouchableOpacity 
          style={[styles.settingItem, styles.logoutItem]}
          onPress={() => {
            useAuthStore.getState().logout();
            router.push('/auth/login');
          }}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.settingText, styles.logoutText]}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMarketTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Tendances du marché</Text>
      <Text style={styles.tabSubtitle}>
        Contribuez aux données de prix du marché dans votre région
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <Dropdown
            options={categoryOptions}
            value={category}
            onSelect={setCategory}
            placeholder="Sélectionner une catégorie"
            searchable={true}
            autoComplete={true}
          />
          
          <Text style={styles.label}>Nom du produit</Text>
          <TextInput
            style={styles.textInput}
            value={productName}
            onChangeText={setProductName}
            placeholder="Ex: Mangue Kent, Tomate locale, Riz local"
            placeholderTextColor={colors.textLight}
          />
          
          <Text style={styles.label}>Ville / Marché</Text>
          <Dropdown
            options={cityOptions}
            value={city}
            onSelect={setCity}
            placeholder="Sélectionner une ville"
            searchable={true}
            autoComplete={true}
          />
          
          <View style={styles.priceRow}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.label}>Prix (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder="Entrez le prix"
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.unitInputContainer}>
              <Text style={styles.label}>Unité</Text>
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
            style={[
              styles.submitButton,
              submissionStatus === 'submitting' && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitPrice}
            disabled={submissionStatus === 'submitting'}
          >
            <Text style={styles.submitButtonText}>
              {submissionStatus === 'submitting' ? 'Envoi...' : 'Soumettre le prix'}
            </Text>
          </TouchableOpacity>
          
          {submissionStatus === 'success' && (
            <Text style={styles.successMessage}>
              Prix soumis avec succès. Merci de votre contribution!
            </Text>
          )}
          {submissionStatus === 'error' && (
            <Text style={styles.errorMessage}>
              Erreur lors de la soumission. Veuillez vérifier les données et réessayer.
            </Text>
          )}
        </View>
        
        <Text style={styles.infoText}>
          Vos contributions aident les agriculteurs et acheteurs à comprendre les tendances du marché. 
          Soumettez uniquement des prix réels observés sur le marché.
        </Text>
      </View>
    </View>
  );

  // Use profile data if available, otherwise fallback to user data or defaults
  const displayName = userProfile?.name || user?.name || 'Utilisateur';
  const displayLocation = userProfile?.location?.city || user?.location?.city || 'Localisation inconnue';

  // Render the appropriate tab content based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings':
        return renderListingsTab();
      case 'favorites':
        return renderFavoritesTab();
      case 'settings':
        return renderSettingsTab();
      case 'market':
        return renderMarketTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Image
            source={userProfile?.avatar || user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {(userProfile?.verified || user?.verified) && (
                <View style={styles.verifiedBadge}>
                  <Star size={16} color={colors.primary} />
                  <Text style={styles.verifiedText}>Vérifié</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textLight} />
              <Text style={styles.userLocation}>{displayLocation}</Text>
            </View>
            <Text style={styles.userRole}>Producteur agricole</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayStats.totalListings}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayStats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayStats.totalSales}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
            onPress={() => setActiveTab('listings')}
          >
            <Package size={20} color={activeTab === 'listings' ? colors.primary : colors.textLight} />
            <Text style={[
              styles.tabText,
              activeTab === 'listings' && styles.activeTabText
            ]}>
              Mes annonces
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
            onPress={() => setActiveTab('favorites')}
          >
            <Heart size={20} color={activeTab === 'favorites' ? colors.primary : colors.textLight} />
            <Text style={[
              styles.tabText,
              activeTab === 'favorites' && styles.activeTabText
            ]}>
              Favoris
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={20} color={activeTab === 'settings' ? colors.primary : colors.textLight} />
            <Text style={[
              styles.tabText,
              activeTab === 'settings' && styles.activeTabText
            ]}>
              Paramètres
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'market' && styles.activeTab]}
            onPress={() => setActiveTab('market')}
          >
            <TrendingUp size={20} color={activeTab === 'market' ? colors.primary : colors.textLight} />
            <Text style={[
              styles.tabText,
              activeTab === 'market' && styles.activeTabText
            ]}>
              Marché
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 4,
    flexShrink: 1,
  },
  userRole: {
    fontSize: 14,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
    minWidth: '20%',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    flexShrink: 1,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '500',
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  productsList: {
    gap: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    gap: 16,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
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
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  productStatus: {
    fontSize: 10,
    color: colors.secondary,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
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
  settingsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  settingDivider: {
    height: 8,
    backgroundColor: colors.background,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: colors.error,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  priceInputContainer: {
    flex: 2,
  },
  unitInputContainer: {
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  errorMessage: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});