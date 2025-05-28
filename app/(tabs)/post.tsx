import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Camera, X, Truck } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { ProductCondition, DeliveryMode } from '@/types/product';
import { categories } from '@/constants/categories';
import { units, convertUnit } from '@/constants/units';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';

const conditionOptions: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'Neuf' },
  { value: 'fresh', label: 'Récolte fraîche' },
  { value: 'used', label: 'Occasion' },
  { value: 'needs_repair', label: 'À réviser' },
];

const deliveryOptions: { value: DeliveryMode; label: string }[] = [
  { value: 'local', label: 'Livraison locale' },
  { value: 'regional', label: 'Livraison régionale' },
  { value: 'pickup', label: 'Retrait sur place' },
];

export default function PostScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [country, setCountry] = useState('Sénégal');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('fresh');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(['pickup']);
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [deliveryFees, setDeliveryFees] = useState('');
  const [allowCalls, setAllowCalls] = useState(false);

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: (newProduct) => {
      Alert.alert('Succès', 'Votre annonce a été publiée!', [
        { 
          text: 'Voir l\'annonce', 
          onPress: () => {
            router.push(`/products/${newProduct.id}`);
          }
        },
        { 
          text: 'Mes annonces', 
          onPress: () => {
            router.push('/(tabs)/profile');
          }
        }
      ]);
      
      // Reset form
      setImages([]);
      setTitle('');
      setPrice('');
      setNegotiable(false);
      setDescription('');
      setQuantity('');
      setUnit('kg');
      setRegion('');
      setCity('');
      setCategory('');
      setCondition('fresh');
      setStartDate('');
      setEndDate('');
      setDuration('');
      setDeliveryModes(['pickup']);
      setFreeDelivery(true);
      setDeliveryFees('');
      setAllowCalls(false);
    },
    onError: (error: { message: string }) => {
      Alert.alert('Erreur', error.message);
    }
  });

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const toggleDeliveryMode = (mode: DeliveryMode) => {
    if (deliveryModes.includes(mode)) {
      setDeliveryModes(deliveryModes.filter(m => m !== mode));
    } else {
      setDeliveryModes([...deliveryModes, mode]);
    }
  };

  const validateDates = () => {
    if (!startDate) return false;
    
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      Alert.alert('Erreur', 'La date de début ne peut pas être dans le passé');
      return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (end <= start) {
        Alert.alert('Erreur', 'La date de fin doit être postérieure à la date de début');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!title || !price || !quantity || !region || !city || !category || !startDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    if (deliveryModes.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un mode de livraison');
      return;
    }

    if (!validateDates()) {
      return;
    }

    createProductMutation.mutate({
      title,
      price: parseFloat(price),
      negotiable,
      quantity: parseFloat(quantity),
      unit,
      location: {
        country,
        region,
        city,
      },
      category,
      description,
      condition,
      images,
      availability: {
        startDate,
        endDate: endDate || undefined,
        duration: duration || undefined,
      },
      delivery: {
        modes: deliveryModes,
        freeDelivery,
        deliveryFees: freeDelivery ? undefined : parseFloat(deliveryFees),
      },
      allowCalls,
    });
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    icon: cat.icon,
  }));

  const unitOptions = units.map(u => ({
    value: u.value,
    label: u.label,
  }));

  const getMinimumEndDate = () => {
    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + 1);
      return start;
    }
    return new Date();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Camera size={24} color={colors.secondary} />
          <Text style={styles.addImageText}>
            Ajouter des photos ({images.length}/5)
          </Text>
        </TouchableOpacity>
        
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
            {images.map((uri, index) => (
              <View key={index} style={styles.previewContainer}>
                <Image source={uri} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Maïs jaune sec, Motoculteur thermique"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catégorie *</Text>
          <Dropdown
            options={categoryOptions}
            value={category}
            onSelect={setCategory}
            placeholder="Sélectionner une catégorie"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Prix *</Text>
            <TextInput
              style={styles.input}
              placeholder="Prix en FCFA"
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
              value={price}
              onChangeText={setPrice}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Unité *</Text>
            <Dropdown
              options={unitOptions}
              value={unit}
              onSelect={setUnit}
              placeholder="Unité"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setNegotiable(!negotiable)}
        >
          <View style={[styles.checkbox, negotiable && styles.checkboxChecked]}>
            {negotiable && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Prix négociable</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantité disponible *</Text>
          <TextInput
            style={styles.input}
            placeholder="Quantité disponible"
            keyboardType="numeric"
            placeholderTextColor={colors.textLight}
            value={quantity}
            onChangeText={setQuantity}
          />
          {quantity && unit && (
            <Text style={styles.quantityHelper}>
              {quantity} {units.find(u => u.value === unit)?.label}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>État du produit</Text>
          <View style={styles.optionGroup}>
            {conditionOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  condition === option.value && styles.optionButtonActive
                ]}
                onPress={() => setCondition(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  condition === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pays</Text>
            <TextInput
              style={styles.input}
              placeholder="Pays"
              placeholderTextColor={colors.textLight}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Région *</Text>
              <TextInput
                style={styles.input}
                placeholder="Région"
                placeholderTextColor={colors.textLight}
                value={region}
                onChangeText={setRegion}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Ville/Commune *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ville"
                placeholderTextColor={colors.textLight}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilité</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de disponibilité *</Text>
            <DatePicker
              value={startDate}
              onDateChange={setStartDate}
              placeholder="Sélectionner la date de début"
              minimumDate={new Date()}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Date de fin (optionnel)</Text>
              <DatePicker
                value={endDate}
                onDateChange={setEndDate}
                placeholder="Sélectionner la date de fin"
                minimumDate={getMinimumEndDate()}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Durée (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: jusqu'à épuisement"
                placeholderTextColor={colors.textLight}
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraison</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modes de livraison</Text>
            <View style={styles.optionGroup}>
              {deliveryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    deliveryModes.includes(option.value) && styles.optionButtonActive
                  ]}
                  onPress={() => toggleDeliveryMode(option.value)}
                >
                  <Truck size={16} color={
                    deliveryModes.includes(option.value) ? colors.white : colors.textLight
                  } />
                  <Text style={[
                    styles.optionText,
                    deliveryModes.includes(option.value) && styles.optionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFreeDelivery(!freeDelivery)}
          >
            <View style={[styles.checkbox, freeDelivery && styles.checkboxChecked]}>
              {freeDelivery && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Livraison gratuite</Text>
          </TouchableOpacity>

          {!freeDelivery && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frais de livraison (FCFA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Frais en FCFA"
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
                value={deliveryFees}
                onChangeText={setDeliveryFees}
              />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Informations complémentaires, conditions, origine..."
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setAllowCalls(!allowCalls)}
        >
          <View style={[styles.checkbox, allowCalls && styles.checkboxChecked]}>
            {allowCalls && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Autoriser les appels téléphoniques</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            createProductMutation.isPending && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={createProductMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createProductMutation.isPending ? 'Publication...' : 'Publier l\'annonce'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreview: {
    marginTop: 16,
  },
  previewContainer: {
    marginRight: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 4,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  quantityHelper: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
  },
  optionTextActive: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});