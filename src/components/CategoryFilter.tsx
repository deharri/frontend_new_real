import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const categories = [
  { id: 'all', label: 'All Services', icon: 'home-outline' as const, color: colors.slate500 },
  { id: 'PLUMBER', label: 'Plumber', icon: 'water-outline' as const, color: colors.categoryPlumber },
  { id: 'ELECTRICIAN', label: 'Electrician', icon: 'flash-outline' as const, color: colors.categoryElectrician },
  { id: 'CARPENTER', label: 'Carpenter', icon: 'hammer-outline' as const, color: colors.categoryCarpenter },
  { id: 'PAINTER', label: 'Painter', icon: 'brush-outline' as const, color: colors.categoryPainter },
  { id: 'HVAC_TECHNICIAN', label: 'AC Repair', icon: 'snow-outline' as const, color: colors.categoryAC },
  { id: 'MASON', label: 'Mason', icon: 'construct-outline' as const, color: colors.categoryMason },
  { id: 'WELDER', label: 'Welder', icon: 'flame-outline' as const, color: colors.categoryWelder },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;

        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              isSelected && { backgroundColor: category.color },
              !isSelected && styles.categoryButtonInactive,
            ]}
            onPress={() => onCategoryChange(category.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon as any}
              size={28}
              color={isSelected ? colors.white : colors.slate700}
              style={styles.icon}
            />
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
              ]}
              numberOfLines={1}
            >
              {category.label}
            </Text>
            {isSelected && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    position: 'relative',
  },
  categoryButtonInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.slate700,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.white,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
