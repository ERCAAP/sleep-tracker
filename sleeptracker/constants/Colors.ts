/**
 * Sleep Tracker App - Color System
 * Optimized for sleep-friendly UI with soothing gradients and dark mode support
 */

export const Colors = {
  // Main brand colors - Calming night theme
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Primary brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Sleep-friendly palette
  sleep: {
    deepNight: '#0f0c29',
    nightSky: '#16213e', 
    twilight: '#0f3460',
    moonbeam: '#4568dc',
    starlight: '#6c5ce7',
    aurora: '#a29bfe',
    dawn: '#feb47b',
    sunrise: '#ff7e5f',
  },

  // Gradient combinations
  gradients: {
    night: ['#0f0c29', '#0e0e23', '#24243e'],
    deepSleep: ['#667eea', '#764ba2'], 
    rem: ['#ff7e5f', '#feb47b'],
    lightSleep: ['#74b9ff', '#0984e3'],
    wake: ['#a8edea', '#fed6e3'],
    quality: ['#00b894', '#00cec9'],
    restless: ['#e17055', '#fdcb6e'],
  },

  // Sleep stages colors
  stages: {
    awake: '#ff7675',
    light: '#74b9ff', 
    deep: '#6c5ce7',
    rem: '#a29bfe',
    restless: '#fdcb6e',
  },

  // Semantic colors
  semantic: {
    success: '#00b894',
    warning: '#fdcb6e', 
    error: '#e17055',
    info: '#74b9ff',
    excellent: '#00b894',
    good: '#00cec9',
    fair: '#fdcb6e',
    poor: '#e17055',
  },

  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7', 
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

  // Light theme
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceVariant: '#f1f5f9',
    outline: '#e2e8f0',
    outlineVariant: '#cbd5e1',
    onBackground: '#0f172a',
    onSurface: '#334155',
    onSurfaceVariant: '#64748b',
    shadow: 'rgba(15, 23, 42, 0.04)',
    elevation1: '#ffffff',
    elevation2: '#f8fafc',
    elevation3: '#f1f5f9',
  },

  // Dark theme - Sleep optimized
  dark: {
    background: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceVariant: '#262626',
    outline: '#404040',
    outlineVariant: '#525252',
    onBackground: '#fafafa',
    onSurface: '#e5e5e5',
    onSurfaceVariant: '#a3a3a3',
    shadow: 'rgba(0, 0, 0, 0.3)',
    elevation1: '#1a1a1a',
    elevation2: '#262626',
    elevation3: '#404040',
  },

  // Chart colors for data visualization
  charts: {
    sleepQuality: ['#00b894', '#00cec9', '#74b9ff', '#fdcb6e', '#e17055'],
    sleepStages: ['#6c5ce7', '#74b9ff', '#a29bfe', '#ff7675'],
    weekly: ['#667eea', '#764ba2', '#ff7e5f', '#feb47b', '#00b894', '#00cec9', '#74b9ff'],
    progress: {
      excellent: '#00b894',
      good: '#00cec9', 
      average: '#74b9ff',
      below: '#fdcb6e',
      poor: '#e17055',
    }
  }
};

// Theme configurations
export const lightTheme = {
  colors: {
    ...Colors.primary,
    background: Colors.light.background,
    surface: Colors.light.surface,
    surfaceVariant: Colors.light.surfaceVariant,
    outline: Colors.light.outline,
    onBackground: Colors.light.onBackground,
    onSurface: Colors.light.onSurface,
    onSurfaceVariant: Colors.light.onSurfaceVariant,
    ...Colors.semantic,
  },
  gradients: Colors.gradients,
  sleep: Colors.sleep,
  charts: Colors.charts,
};

export const darkTheme = {
  colors: {
    ...Colors.primary,
    background: Colors.dark.background,
    surface: Colors.dark.surface,
    surfaceVariant: Colors.dark.surfaceVariant,
    outline: Colors.dark.outline,
    onBackground: Colors.dark.onBackground,
    onSurface: Colors.dark.onSurface,
    onSurfaceVariant: Colors.dark.onSurfaceVariant,
    ...Colors.semantic,
  },
  gradients: Colors.gradients,
  sleep: Colors.sleep,
  charts: Colors.charts,
};

export type Theme = typeof lightTheme;
export default Colors; 