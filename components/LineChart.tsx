import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

type DataPoint = {
  date: string;
  price: number;
};

type Props = {
  data: DataPoint[];
};

export function LineChart({ data }: Props) {
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((point, index) => {
          const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
          
          return (
            <View key={point.date} style={styles.bar}>
              <View 
                style={[
                  styles.barFill,
                  { height: `${height}%` }
                ]} 
              />
              <Text style={styles.date}>
                {point.date.split('-')[1]}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.labels}>
        <Text style={styles.price}>{maxPrice} FCFA</Text>
        <Text style={styles.price}>{minPrice} FCFA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    flexDirection: 'row',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 20,
    gap: 8,
  },
  bar: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    backgroundColor: colors.primary,
    width: '100%',
    borderRadius: 4,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  labels: {
    width: 80,
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  price: {
    fontSize: 12,
    color: colors.textLight,
  },
});