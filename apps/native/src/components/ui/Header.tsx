import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme/tokens';

// Fixed height of the title row — identical across every screen that renders
// one, tab roots and pushed screens alike, so navigating between them never
// causes the header to jump.
const TITLE_ROW_HEIGHT = 44;
const TITLE_FONT_SIZE = 24;

// The one dark-green title bar used across the app: tab roots (no onBack),
// pushed screens (onBack), with an optional trailing element (toggle, bell,
// avatar, segmented control) and optional footer content below the fixed
// row (e.g. Spiele's live-match banner) that doesn't affect the row's height.
export function Header({
  title,
  onBack,
  trailing,
  footer,
}: {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.courtGreen, paddingTop: insets.top }}>
      <View
        style={{
          minHeight: TITLE_ROW_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 6,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          {onBack ? <HeaderIconButton name="arrow-left" onPress={onBack} /> : null}
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.display, fontSize: TITLE_FONT_SIZE, color: '#fff' }}>
            {title}
          </Text>
        </View>
        {trailing}
      </View>
      {footer}
    </View>
  );
}

// Standardized light sub-header row directly below the dark header — hosts
// search bars / meta text (PRD: same background + spacing everywhere).
export function SubHeaderBar({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.screen, paddingHorizontal: 20, paddingVertical: 10 }}>
      {children}
    </View>
  );
}

// Raw dark-green header shell for screens with bespoke header layouts that
// don't fit Header's single-row shape (multi-row hero content, extra bottom
// padding). Extends under the status bar via the top inset.
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

// Circular translucent button holding a Feather glyph (back/close).
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
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Feather name={name} size={14} color="#fff" />
    </Pressable>
  );
}
