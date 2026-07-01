import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SleepStagesChartProps {
  sleepStages: any;
  height: number;
}

export function SleepStagesChart({ sleepStages, height }: SleepStagesChartProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.text}>Sleep Stages Chart</Text>
      <Text style={styles.subtext}>Chart implementation coming soon...</Text>
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
}); 