import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { MapPin } from 'lucide-react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={32} color={colors.textLight} />
        <Text style={styles.placeholderText}>Carte non disponible en web</Text>
        <Text style={styles.placeholderSubtext}>
          Utilisez l'application mobile pour voir la carte
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});
