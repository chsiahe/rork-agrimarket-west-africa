import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '@/constants/colors';
import { MapPin, Calendar, Eye, MessageCircle, Phone, Share2, Heart } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { ProductCondition } from '@/types/product';

const conditionLabels: Record<ProductCondition, string> = {
  'new': 'Neuf',
  'like-new': 'Comme neuf',
  'good': 'Bon état',
  'fair': 'État correct',
  'poor': 'Mauvais état'
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuthStore();
  
  const { data: product, isLoading, error } = trpc.products.get.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );

  const incrementViewMutation = trpc.products.incrementView.useMutation();
  const startChatMutation = trpc.messages.startChat.useMutation({
    onSuccess: (data) => {
      router.push(`/chat/${data.chatId}`);
    },
    onError: (error) => {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    },
  });

  useEffect(() => {
    if (product && id) {
      incrementViewMutation.mutate({ id });
    }
  }, [product, id]);

  const handleContact = () => {
    if (!product || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour contacter le vendeur');
      return;
    }

    if (product.seller.id === user.id) {
      Alert.alert('Information', 'Vous ne pouvez pas vous contacter vous-même');
      return;
    }

    startChatMutation.mutate({
      otherUserId: product.seller.id,
    });
  };

  const handleCall = () => {
    if (!product?.seller.phone) {
      Alert.alert('Information', 'Numéro de téléphone non disponible');
      return;
    }

    Alert.alert(
      'Appeler le vendeur',
      `Voulez-vous appeler ${product.seller.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => Linking.openURL(`tel:${product.seller.phone}`)
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert('Partager', 'Fonctionnalité de partage à implémenter');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
        <Text style={styles.errorText}>Produit non trouvé</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: product.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Share2 size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
                <Heart 
                  size={24} 
                  color={isFavorite ? colors.primary : colors.text}
                  fill={isFavorite ? colors.primary : 'none'}
                />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={product.images[0]}
            style={styles.mainImage}
            contentFit="cover"
          />
          {product.images.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageCount}>1/{product.images.length}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>{product.price.toLocaleString()} FCFA</Text>
            <Text style={styles.unit}>/{product.unit}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MapPin size={16} color={colors.textLight} />
              <Text style={styles.metaText}>{product.location.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.textLight} />
              <Text style={styles.metaText}>
                {new Date(product.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Eye size={16} color={colors.textLight} />
              <Text style={styles.metaText}>{product.statistics.views} vues</Text>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Détails</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Catégorie:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantité:</Text>
              <Text style={styles.detailValue}>{product.quantity} {product.unit}</Text>
            </View>
            
            {product.condition && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>État:</Text>
                <Text style={styles.detailValue}>
                  {conditionLabels[product.condition] || product.condition}
                </Text>
              </View>
            )}
            
            {product.harvestDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date de récolte:</Text>
                <Text style={styles.detailValue}>
                  {new Date(product.harvestDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <View style={styles.sellerInfo}>
              <Image
                source={product.seller.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop"}
                style={styles.sellerAvatar}
                contentFit="cover"
              />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.seller.name}</Text>
                <Text style={styles.sellerLocation}>{product.seller.location}</Text>
                <Text style={styles.sellerJoined}>
                  Membre depuis {new Date(product.seller.joinedAt).getFullYear()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={handleCall}
        >
          <Phone size={20} color={colors.white} />
          <Text style={styles.callButtonText}>Appeler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={handleContact}
          disabled={startChatMutation.isPending}
        >
          <MessageCircle size={20} color={colors.white} />
          <Text style={styles.messageButtonText}>
            {startChatMutation.isPending ? 'Chargement...' : 'Message'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: 32,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  unit: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textLight,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  sellerSection: {
    marginBottom: 100,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sellerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sellerLocation: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  sellerJoined: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});