import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Heart, MessageCircle, MapPin, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { LineChart } from '@/components/LineChart';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();

  const priceHistory = [
    { date: '2025-01', price: 1200 },
    { date: '2025-02', price: 1300 },
    { date: '2025-03', price: 1100 },
    { date: '2025-04', price: 1500 },
    { date: '2025-05', price: 1400 },
  ];

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal pagingEnabled style={styles.imageCarousel}>
        <Image
          source="https://images.unsplash.com/photo-1601648764658-cf37e8c89b70"
          style={styles.productImage}
          contentFit="cover"
        />
      </ScrollView>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Maïs Jaune Sec</Text>
          <TouchableOpacity>
            <Heart size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>1500 FCFA/kg</Text>
        
        <View style={styles.location}>
          <MapPin size={18} color={colors.textLight} />
          <Text style={styles.locationText}>Thiès, Sénégal</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            Maïs de qualité supérieure, fraîchement récolté. Disponible en grande quantité.
            Idéal pour la transformation ou la consommation directe.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évolution des prix</Text>
          <LineChart data={priceHistory} />
        </View>

        <View style={styles.sellerCard}>
          <Image
            source="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
            style={styles.sellerAvatar}
            contentFit="cover"
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>Amadou Diallo</Text>
            <View style={styles.rating}>
              <Star size={16} color={colors.secondary} fill={colors.secondary} />
              <Text style={styles.ratingText}>4.8 (48 avis)</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/chat/1')}
          >
            <MessageCircle size={20} color={colors.white} />
            <Text style={styles.contactButtonText}>Contacter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageCarousel: {
    height: 300,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    marginLeft: 4,
    color: colors.textLight,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: colors.textLight,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
});