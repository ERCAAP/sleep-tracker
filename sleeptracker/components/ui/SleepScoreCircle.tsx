import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface SleepScoreCircleProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function SleepScoreCircle({
  score,
  size = 100,
  strokeWidth = 6,
  showLabel = true,
  animated = true,
}: SleepScoreCircleProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: score,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(score);
    }
  }, [score, animated]);

  const getScoreColor = () => {
    if (score >= 85) return Colors.semantic.excellent;
    if (score >= 70) return Colors.semantic.good;
    if (score >= 50) return Colors.semantic.fair;
    return Colors.semantic.poor;
  };

  const getScoreText = () => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.neutral[800]}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { fontSize: size * 0.25 }]}>
          {Math.round(score)}
        </Text>
        {showLabel && (
          <Text style={[styles.labelText, { fontSize: size * 0.1 }]}>
            {getScoreText()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  scoreText: {
    fontWeight: 'bold',
    color: Colors.neutral[100],
    textAlign: 'center',
  },
  labelText: {
    color: Colors.neutral[400],
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
}); 