import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, Platform, Keyboard } from 'react-native';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';
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
  autoComplete?: boolean;
}

export function Dropdown({ 
  options, 
  value, 
  onSelect, 
  placeholder, 
  searchable = true, 
  disabled = false,
  autoComplete = true
}: DropdownProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<TextInput>(null);

  const selectedOption = useMemo(() => 
    options.find(option => option.value === value), 
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // First, find exact matches at the beginning of the string
    const startsWithMatches = options.filter(option => 
      option.label.toLowerCase().startsWith(normalizedQuery) || 
      option.value.toLowerCase().startsWith(normalizedQuery)
    );
    
    // Then, find options that contain the query anywhere
    const containsMatches = options.filter(option => 
      (option.label.toLowerCase().includes(normalizedQuery) || 
       option.value.toLowerCase().includes(normalizedQuery)) &&
      !startsWithMatches.includes(option)
    );
    
    // Combine the results, prioritizing exact matches
    return [...startsWithMatches, ...containsMatches];
  }, [options, searchQuery, searchable]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    if (filteredOptions.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [filteredOptions.length]);

  const handleSelect = useCallback((optionValue: string) => {
    onSelect(optionValue);
    setIsVisible(false);
    setSearchQuery('');
  }, [onSelect]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setSearchQuery('');
      setIsVisible(true);
      
      // Focus the search input after a short delay to ensure the modal is visible
      setTimeout(() => {
        if (searchInputRef.current && searchable) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [disabled, searchable]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (autoComplete && text.trim() && filteredOptions.length > 0) {
      // Auto-complete functionality
      const firstMatch = filteredOptions[0];
      if (firstMatch && firstMatch.label.toLowerCase().startsWith(text.toLowerCase())) {
        // Don't auto-select, just highlight
        setHighlightedIndex(0);
      }
    }
  }, [autoComplete, filteredOptions]);

  const handleKeyPress = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      // Handle keyboard navigation for web
      if (e.key === 'ArrowDown') {
        setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  }, [filteredOptions, highlightedIndex, handleSelect]);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim() || !searchable) {
      return <Text style={styles.optionText}>{text}</Text>;
    }

    const normalizedQuery = query.toLowerCase();
    const normalizedText = text.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) {
      return <Text style={styles.optionText}>{text}</Text>;
    }

    return (
      <Text style={styles.optionText}>
        {text.substring(0, index)}
        <Text style={styles.highlightedText}>
          {text.substring(index, index + query.length)}
        </Text>
        {text.substring(index + query.length)}
      </Text>
    );
  }, [searchable]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <>
      <TouchableOpacity 
        style={[styles.input, disabled && styles.inputDisabled]} 
        onPress={handleOpen}
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
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <Search size={18} color={colors.textLight} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Rechercher..."
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={Platform.OS !== 'web'}
                  onKeyPress={handleKeyPress}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch}>
                    <X size={18} color={colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {filteredOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
              </View>
            ) : (
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      option.value === value && styles.optionSelected,
                      index === highlightedIndex && styles.optionHighlighted
                    ]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <View style={styles.optionContent}>
                      {option.icon && (
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                      )}
                      {searchable ? 
                        highlightMatch(option.label, searchQuery) :
                        <Text style={[
                          styles.optionText,
                          option.value === value && styles.optionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      }
                    </View>
                    {option.value === value && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
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
  optionHighlighted: {
    backgroundColor: colors.primary + '15', // Light version of primary color
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
  highlightedText: {
    backgroundColor: colors.primary + '33',
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
});