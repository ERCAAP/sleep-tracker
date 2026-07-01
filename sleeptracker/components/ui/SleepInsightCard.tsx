import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SleepInsightCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export function SleepInsightCard({ title, value, trend, description }: SleepInsightCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return Colors.semantic.success;
      case 'down':
        return Colors.semantic.error;
      default:
        return Colors.neutral[400];
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={getTrendIcon()} size={20} color={getTrendColor()} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: Colors.neutral[300],
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: Colors.neutral[100],
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: Colors.neutral[400],
    fontSize: 12,
  },
}); 