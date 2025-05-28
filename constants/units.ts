export const units = [
  { value: 'kg', label: 'Kilogramme (kg)', category: 'weight' },
  { value: 'g', label: 'Gramme (g)', category: 'weight' },
  { value: 't', label: 'Tonne (t)', category: 'weight' },
  { value: 'L', label: 'Litre (L)', category: 'volume' },
  { value: 'mL', label: 'Millilitre (mL)', category: 'volume' },
  { value: 'piece', label: 'Pièce', category: 'count' },
  { value: 'unit', label: 'Unité', category: 'count' },
  { value: 'dozen', label: 'Douzaine', category: 'count' },
  { value: 'box', label: 'Boîte', category: 'count' },
  { value: 'bag', label: 'Sac', category: 'count' },
  { value: 'm', label: 'Mètre (m)', category: 'length' },
  { value: 'cm', label: 'Centimètre (cm)', category: 'length' },
  { value: 'm2', label: 'Mètre carré (m²)', category: 'area' },
  { value: 'hectare', label: 'Hectare (ha)', category: 'area' },
];

export const unitConversions: Record<string, Record<string, number>> = {
  weight: {
    g: 1,
    kg: 1000,
    t: 1000000,
  },
  volume: {
    mL: 1,
    L: 1000,
  },
  length: {
    cm: 1,
    m: 100,
  },
  area: {
    m2: 1,
    hectare: 10000,
  },
};

export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  const fromUnitData = units.find(u => u.value === fromUnit);
  const toUnitData = units.find(u => u.value === toUnit);
  
  if (!fromUnitData || !toUnitData || fromUnitData.category !== toUnitData.category) {
    return value; // Cannot convert between different categories
  }
  
  const category = fromUnitData.category;
  const conversions = unitConversions[category];
  
  if (!conversions) return value;
  
  // Convert to base unit, then to target unit
  const baseValue = value * conversions[fromUnit];
  return baseValue / conversions[toUnit];
}