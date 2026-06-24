// Tennys design system — derived from the Claude Design wireframes.
// Court-Grün / Lime, Bebas Neue (display) · DM Sans (body) · JetBrains Mono (scores).

export const colors = {
  // greens
  courtGreen: '#0E2A21',
  courtGreenLight: '#1C4537',
  notch: '#06140F',
  // lime
  lime: '#C9F135',
  limeDark: '#A8CF1A',
  limeText: '#5E7D0C',
  limeWash: '#F4FDD9',
  // surfaces
  canvas: '#E6E4DE',
  screen: '#F7F6F2',
  white: '#FFFFFF',
  // text
  ink: '#141210',
  inkSecondary: '#6B6860',
  inkMuted: '#A8A6A0',
  // borders / hairlines
  border: '#E9E7E0',
  borderStrong: '#D4D1C8',
  chevron: '#C9C7C0',
  // accents
  red: '#FF5A38',
  redDark: '#E23C1C',
  blue: '#1A7FCC',
  blueWash: '#D6EDFA',
  // avatar palette
  purple: '#7B68EE',
  teal: '#2A8A6A',
} as const;

export const fonts = {
  display: 'BebasNeue_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 38,
  pill: 999,
} as const;

// Maps the font families loaded at the app root.
export const fontMap = {
  BebasNeue_400Regular: require('@expo-google-fonts/bebas-neue/400Regular/BebasNeue_400Regular.ttf'),
  DMSans_400Regular: require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
  DMSans_500Medium: require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
  DMSans_600SemiBold: require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
  DMSans_700Bold: require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
  JetBrainsMono_500Medium: require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
  JetBrainsMono_600SemiBold: require('@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf'),
};
