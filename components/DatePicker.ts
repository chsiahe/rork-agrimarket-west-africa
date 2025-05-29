import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({ value, onDateChange, placeholder, minimumDate, maximumDate }: DatePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date());

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange(formatDate(date));
    setIsVisible(false);
  };

  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = current.getMonth() === currentMonth;
      const isToday = current.toDateString() === today.toDateString();
      const isSelected = current.toDateString() === selectedDate.toDateString();
      const isPast = current < today && !isToday;
      const isDisabled = (minimumDate && current < minimumDate) || (maximumDate && current > maximumDate) || isPast;
      
      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setIsVisible(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Calendar size={20} color={colors.textLight} />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigateMonth('prev')}>
                <Text style={styles.navButton}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.monthYear}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              
              <TouchableOpacity onPress={() => navigateMonth('next')}>
                <Text style={styles.navButton}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dayHeaders}>
              {dayNames.map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {generateCalendar().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    !day.isCurrentMonth && styles.dayButtonInactive,
                    day.isToday && styles.dayButtonToday,
                    day.isSelected && styles.dayButtonSelected,
                    day.isDisabled && styles.dayButtonDisabled,
                  ]}
                  onPress={() => !day.isDisabled && handleDateSelect(day.date)}
                  disabled={day.isDisabled}
                >
                  <Text style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextInactive,
                    day.isToday && styles.dayTextToday,
                    day.isSelected && styles.dayTextSelected,
                    day.isDisabled && styles.dayTextDisabled,
                  ]}>
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  inputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
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
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  navButton: {
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 4,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    paddingVertical: 8,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayButtonToday: {
    backgroundColor: colors.background,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonDisabled: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
  },
  dayTextInactive: {
    color: colors.textLight,
  },
  dayTextToday: {
    fontWeight: '600',
    color: colors.primary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: colors.textLight,
  },
});
