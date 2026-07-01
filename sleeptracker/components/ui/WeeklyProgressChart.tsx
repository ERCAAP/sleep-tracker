import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface WeeklyProgressChartProps {
  data: any[];
  height: number;
}

export function WeeklyProgressChart({ data, height }: WeeklyProgressChartProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.text}>Weekly Progress Chart</Text>
      <Text style={styles.subtext}>Chart implementation coming soon...</Text>
      <Text style={styles.dataInfo}>{data.length} sessions recorded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    color: Colors.neutral[100],
    fontSize: 16,
    fontWeight: '600',
  },
  subtext: {
    color: Colors.neutral[400],
    fontSize: 12,
    marginTop: 4,
  },
  dataInfo: {
    color: Colors.neutral[300],
    fontSize: 10,
    marginTop: 8,
  },
}); 