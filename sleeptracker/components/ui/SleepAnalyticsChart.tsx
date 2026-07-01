import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/Colors';
import { SleepSession } from '../../database/models';
import { t } from '../../locales';

const screenWidth = Dimensions.get('window').width;

export interface SleepAnalyticsChartProps {
  data: SleepSession[];
  chartType: 'duration' | 'quality';
}

export function SleepAnalyticsChart({ data, chartType }: SleepAnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>{t('analytics.noDataChart')}</Text>
      </View>
    );
  }

  const chartLabels = data.map(session => 
    new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  ).reverse();

  const chartValues = data.map(session => 
    chartType === 'duration' ? session.totalSleepTime / 3600 : session.sleepScore
  ).reverse();

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: [chartType === 'duration' ? t('analytics.sleepDuration') : t('analytics.sleepQuality')],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const chartConfig = {
  backgroundColor: '#1e2923',
  backgroundGradientFrom: '#11111A',
  backgroundGradientTo: '#1A1A24',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: Colors.primary[400],
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    color: Colors.neutral[400],
    fontSize: 16,
  },
}); 