import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save,
  X
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { trpc } from '@/lib/trpc';
import { UserRole, OperatingArea } from '@/types/user';
import { LocationSelector } from '@/components/LocationSelector';
import { OperatingAreaSelector } from '@/components/OperatingAreaSelector';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.location?.country || 'SN',
    region: user?.location?.region || '',
    city: user?.location?.city || '',
    avatar: user?.avatar || '',
  });

  const [operatingAreas, setOperatingAreas] = useState<OperatingArea>(
    user?.operatingAreas || {
      regions: [],
      maxDeliveryDistance: 50,
      deliveryZones: []
    }
  );

  const updateProfileMutation = trpc.users.updateProfile.useMutation();

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.country || !formData.region || !formData.city.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedUserData = await updateProfileMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country: formData.country,
        region: formData.region,
        city: formData.city.trim(),
        avatar: formData.avatar.trim() || undefined,
        operatingAreas: (user?.role === 'farmer' || user?.role === 'distributor') ? operatingAreas : undefined,
      });
      
      updateUser(updatedUserData);
      Alert.alert('Succès', 'Profil mis à jour avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (location: { country: string; region: string; city: string }) => {
    setFormData(prev => ({
      ...prev,
      country: location.country,
      region: location.region,
      city: location.city
    }));
  };

  const showOperatingAreas = user?.role === 'farmer' || user?.role === 'distributor';

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{
          title: 'Modifier le profil',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isLoading}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            >
              <Save size={20} color={isLoading ? colors.textLight : colors.primary} />
              <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={formData.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop"}
              style={styles.avatar}
              contentFit="cover"
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom complet"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone *</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+221 77 123 45 67"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <LocationSelector
              country={formData.country}
              region={formData.region}
              city={formData.city}
              onLocationChange={handleLocationChange}
              label="Votre localisation"
              required
            />
          </View>

          {showOperatingAreas && (
            <View style={styles.section}>
              <OperatingAreaSelector
                operatingAreas={operatingAreas}
                onOperatingAreasChange={setOperatingAreas}
                userCountry={formData.country}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo de profil</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>URL de l'image (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Camera size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://exemple.com/photo.jpg"
                  value={formData.avatar}
                  onChangeText={(value) => updateFormData('avatar', value)}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>

          <View style={styles.roleSection}>
            <Text style={styles.sectionTitle}>Type de compte</Text>
            <View style={styles.roleDisplay}>
              <Text style={styles.roleText}>
                {user?.role === 'farmer' ? 'Agriculteur' :
                 user?.role === 'buyer' ? 'Acheteur' :
                 user?.role === 'cooperative' ? 'Coopérative' :
                 user?.role === 'distributor' ? 'Distributeur' : 'Non défini'}
              </Text>
              <Text style={styles.roleHint}>
                Le type de compte ne peut pas être modifié
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: colors.textLight,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarHint: {
    fontSize: 14,
    color: colors.textLight,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  section: {
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  roleSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleDisplay: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  roleHint: {
    fontSize: 12,
    color: colors.textLight,
  },
});
