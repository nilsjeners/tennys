import { Pressable, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

// The court-green header block. Extends under the status bar via the top inset.
export function DarkHeader({
  children,
  style,
  paddingBottom = 16,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  paddingBottom?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: colors.courtGreen,
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

// Circular translucent button holding a Feather glyph (back / close).
export function HeaderIconButton({
  name,
  onPress,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Feather name={name} size={18} color="#fff" />
    </Pressable>
  );
}
