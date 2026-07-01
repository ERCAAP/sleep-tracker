import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { Colors } from '../../constants/Colors';

interface QuickActionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  backgroundColor?: string;
  gradient?: string[];
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export function QuickActionCard({
  title,
  icon,
  onPress,
  backgroundColor = Colors.primary[600],
  size = 'medium',
  gradient,
  disabled = false,
}: QuickActionCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { 
        damping: 10, 
        stiffness: 200 
      });
      opacity.value = withTiming(0.8, { duration: 150 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, { 
        damping: 10, 
        stiffness: 200 
      });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { width: wp(40), height: hp(12) };
      case 'large':
        return { width: wp(90), height: hp(15) };
      default:
        return { width: wp(42), height: hp(14) };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  const cardStyle = [
    styles.card,
    getCardSize(),
    {
      opacity: disabled ? 0.6 : 1,
    },
  ];

  const CardContent = () => (
    <View style={styles.content}>
      <Animated.View 
        style={[
          styles.iconContainer, 
          { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
        ]}
      >
        <Ionicons 
          name={icon as any} 
          size={getIconSize()} 
          color={Colors.neutral[100]} 
        />
      </Animated.View>
      <Text 
        style={[styles.title, { fontSize: getFontSize() }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  );

  if (gradient) {
    return (
      <Animated.View style={[cardStyle, animatedStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={gradient as any}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <CardContent />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[styles.content, { backgroundColor }]}
      >
        <CardContent />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: Colors.neutral[100],
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 18,
  },
}); 