import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Star, 
  ArrowLeft, 
  Phone, 
  Eye, 
  Calendar,
  Truck,
  Shield,
  Flag,
  CheckCircle
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { LineChart } from '@/components/LineChart';
import { trpc } from '@/lib/trpc';
import { ProductCondition, DeliveryMode } from '@/types/product';

const { width: screenWidth } = Dimensions.get('window');

const conditionLabels: Record<ProductCondition, string> = {
  new: 'Neuf',
  fresh: 'Récolte fraîche',
  used: 'Occasion',
  needs_repair: 'À réviser'
};

const deliveryModeLabels: Record<DeliveryMode, string> = {
  local: 'Livraison locale',
  regional: 'Livraison régionale',
  pickup: 'Retrait sur place'
};

// Type guard to check if a string is a valid ProductCondition
const isValidProductCondition = (condition: string): condition is ProductCondition => {
  return ['new', 'fresh', 'used', 'needs_repair'].includes(condition);
};

// Type guard to check if a string is a valid DeliveryMode
const isValidDeliveryMode = (mode: string): mode is DeliveryMode => {
  return ['local', 'regional', 'pickup'].includes(mode);
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: product, isLoading, error } = trpc.products.get.useQuery({
    id: id!
  });

  const incrementViewMutation = trpc.products.incrementView.useMutation();

  React.useEffect(() => {
    if (product) {
      incrementViewMutation.mutate({ id: product.id });
    }
  }, [product]);

  const handleReport = () => {
    Alert.alert(
      'Signaler cette annonce',
      'Pourquoi souhaitez-vous signaler cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Contenu inapproprié', onPress: () => {} },
        { text: 'Fausse annonce', onPress: () => {} },
        { text: 'Prix suspect', onPress: () => {} },
      ]
    );
  };

  const handleCall = () => {
    if (product?.seller.phone) {
      Alert.alert(
        'Appeler le vendeur',
        `Voulez-vous appeler ${product.seller.name} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Appeler', onPress: () => {} }
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Produit non trouvé'}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safe access to condition label with fallback
  const getConditionLabel = (condition: string): string => {
    if (isValidProductCondition(condition)) {
      return conditionLabels[condition];
    }
    return condition; // Fallback to original value if not recognized
  };

  // Safe access to delivery mode label with fallback
  const getDeliveryModeLabel = (mode: string): string => {
    if (isValidDeliveryMode(mode)) {
      return deliveryModeLabels[mode];
    }
    return mode; // Fallback to original value if not recognized
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: product.title,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleReport}>
                <Flag size={24} color={colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 16 }}>
                <Heart size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          style={styles.imageCarousel}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="start"
        >
          {product.images.map((image: string, index: number) => (
            <Image
              key={index}
              source={image}
              style={[styles.productImage, { width: screenWidth }]}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
              {product.seller.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield size={16} color={colors.primary} />
                  <Text style={styles.verifiedText}>Vérifié</Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {product.price} FCFA/{product.unit}
              </Text>
              {product.negotiable && (
                <Text style={styles.negotiable}>Prix négociable</Text>
              )}
            </View>
          </View>
          
          <View style={styles.location}>
            <MapPin size={18} color={colors.textLight} />
            <Text style={styles.locationText} numberOfLines={1}>
              {product.location.city}, {product.location.region}, {product.location.country}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Eye size={16} color={colors.textLight} />
              <Text style={styles.statText}>{product.statistics.views} vues</Text>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={16} color={colors.textLight} />
              <Text style={styles.statText}>{product.statistics.contacts} contacts</Text>
            </View>
          </View>

          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Quantité disponible</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {product.quantity} {product.unit}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>État</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {getConditionLabel(product.condition)}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Catégorie</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilité</Text>
            <View style={styles.availabilityCard}>
              <View style={styles.availabilityRow}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.availabilityText}>
                  Disponible à partir du {new Date(product.availability.startDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              {product.availability.endDate && (
                <Text style={styles.availabilityDuration}>
                  Jusqu'au {new Date(product.availability.endDate).toLocaleDateString('fr-FR')}
                </Text>
              )}
              {product.availability.duration && (
                <Text style={styles.availabilityDuration}>
                  Durée: {product.availability.duration}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livraison</Text>
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryModes}>
                {product.delivery.modes.map((mode: string, index: number) => (
                  <View key={index} style={styles.deliveryMode}>
                    <Truck size={16} color={colors.primary} />
                    <Text style={styles.deliveryModeText}>
                      {getDeliveryModeLabel(mode)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.deliveryFees}>
                {product.delivery.freeDelivery 
                  ? 'Livraison gratuite' 
                  : `Frais de livraison: ${product.delivery.deliveryFees} FCFA`
                }
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || 'Aucune description fournie.'}
            </Text>
          </View>

          {product.priceHistory && product.priceHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Évolution des prix</Text>
              <LineChart data={product.priceHistory} />
            </View>
          )}

          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <Image
                source={product.seller.avatar}
                style={styles.sellerAvatar}
                contentFit="cover"
              />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName} numberOfLines={1}>{product.seller.name}</Text>
                  {product.seller.verified && (
                    <CheckCircle size={16} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.sellerRole}>Vendeur vérifié</Text>
              </View>
            </View>
            
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => router.push(`/chat/${product.seller.id}`)}
              >
                <MessageCircle size={20} color={colors.white} />
                <Text style={styles.contactButtonText}>Message</Text>
              </TouchableOpacity>
              {product.seller.allowCalls && product.seller.phone && (
                <TouchableOpacity 
                  style={[styles.contactButton, styles.callButton]}
                  onPress={handleCall}
                >
                  <Phone size={20} color={colors.primary} />
                  <Text style={[styles.contactButtonText, styles.callButtonText]}>
                    Appeler
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
  },
  errorText: {
    color: colors.textLight,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCarousel: {
    height: 300,
  },
  productImage: {
    height: 300,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    lineHeight: 30,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  negotiable: {
    fontSize: 14,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    color: colors.textLight,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textLight,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  availabilityCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  availabilityText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  availabilityDuration: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  deliveryCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryModes: {
    gap: 8,
    marginBottom: 12,
  },
  deliveryMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  deliveryModeText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  deliveryFees: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  sellerCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  sellerRole: {
    fontSize: 14,
    color: colors.textLight,
  },
  contactButtons: {
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minHeight: 48,
  },
  contactButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  callButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callButtonText: {
    color: colors.primary,
  },
});