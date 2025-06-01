import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';
import { User, Mail, Lock, Phone, Eye, EyeOff, Tractor, ShoppingCart, Building, Truck } from 'lucide-react-native';
import { RegisterUserRole, OperatingArea } from '@/types/auth';
import { LocationSelector } from '@/components/LocationSelector';
import { OperatingAreaSelector } from '@/components/OperatingAreaSelector';

const roleOptions = [
  {
    value: 'farmer' as RegisterUserRole,
    label: 'Agriculteur',
    icon: Tractor,
    description: 'Je produis et vends des produits agricoles'
  },
  {
    value: 'buyer' as RegisterUserRole,
    label: 'Acheteur',
    icon: ShoppingCart,
    description: "J'achète des produits agricoles"
  },
  {
    value: 'cooperative' as RegisterUserRole,
    label: 'Coopérative',
    icon: Building,
    description: 'Je représente une coopérative agricole'
  },
  {
    value: 'distributor' as RegisterUserRole,
    label: 'Distributeur',
    icon: Truck,
    description: 'Je distribue des produits agricoles'
  }
];

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'SN',
    region: '',
    city: '',
    role: 'farmer' as RegisterUserRole,
  });
  const [operatingAreas, setOperatingAreas] = useState<OperatingArea>({
    regions: [],
    maxDeliveryDistance: 50,
    deliveryZones: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOperatingAreas, setShowOperatingAreas] = useState(false);
  
  const { login } = useAuthStore();
  const registerMutation = trpc.auth.register.useMutation();

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.country || !formData.city) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await registerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        country: formData.country,
        regionId: formData.region || undefined,
        city: formData.city,
        role: formData.role,
        operatingAreas: showOperatingAreas ? operatingAreas : undefined,
      });
      
      login(result.user, result.token ?? "");
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | RegisterUserRole) => {
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

  const handleRoleSelect = (role: RegisterUserRole) => {
    updateFormData('role', role);
    setShowOperatingAreas(role === 'farmer' || role === 'distributor');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la communauté AgriConnect</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Je suis :</Text>
          <View style={styles.roleGrid}>
            {roleOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleCard,
                    formData.role === option.value && styles.roleCardActive
                  ]}
                  onPress={() => handleRoleSelect(option.value)}
                >
                  <IconComponent 
                    size={24} 
                    color={formData.role === option.value ? colors.white : colors.primary} 
                  />
                  <Text style={[
                    styles.roleCardTitle,
                    formData.role === option.value && styles.roleCardTitleActive
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.roleCardDescription,
                    formData.role === option.value && styles.roleCardDescriptionActive
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <User size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <User size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>

        <View style={styles.locationSection}>
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
          <View style={styles.operatingSection}>
            <OperatingAreaSelector
              operatingAreas={operatingAreas}
              onOperatingAreasChange={setOperatingAreas}
              userCountry={formData.country}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Lock size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Mot de passe"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textLight} />
            ) : (
              <Eye size={20} color={colors.textLight} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Confirmer le mot de passe"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={colors.textLight} />
            ) : (
              <Eye size={20} color={colors.textLight} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.linkText}>Se connecter</Text>
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
    padding: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    flex: 1,
    paddingBottom: 40,
    gap: 16,
  },
  roleSection: {
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  roleCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  roleCardTitleActive: {
    color: colors.white,
  },
  roleCardDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  roleCardDescriptionActive: {
    color: colors.white,
    opacity: 0.9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  locationSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  operatingSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});