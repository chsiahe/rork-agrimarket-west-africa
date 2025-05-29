import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  disabled?: boolean;
}

export function Dropdown({ options, value, onSelect, placeholder, disabled = false }: DropdownProps) {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.input, disabled && styles.inputDisabled]} 
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          {selectedOption?.icon && (
            <Text style={styles.icon}>{selectedOption.icon}</Text>
          )}
          <Text style={[
            styles.inputText, 
            !selectedOption && styles.placeholder,
            disabled && styles.textDisabled
          ]}>
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color={disabled ? colors.border : colors.textLight} />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Sélectionner une option</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    option.value === value && styles.optionSelected
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={styles.optionContent}>
                    {option.icon && (
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    )}
                    <Text style={[
                      styles.optionText,
                      option.value === value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {option.value === value && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textLight,
  },
  textDisabled: {
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    fontSize: 18,
    color: colors.textLight,
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  optionSelected: {
    backgroundColor: colors.background,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
});
