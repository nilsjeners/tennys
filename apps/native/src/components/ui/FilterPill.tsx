import { Pressable, Text } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

type Variant = 'onDark' | 'onLight';

// Toggleable filter chip (e.g. Freunde / Region / Liga, In der Nähe / Gleiche LK …).
export function FilterPill({
  label,
  active,
  variant = 'onLight',
  onPress,
}: {
  label: string;
  active?: boolean;
  variant?: Variant;
  onPress?: () => void;
}) {
  const bg = active
    ? colors.lime
    : variant === 'onDark'
      ? 'rgba(255,255,255,0.1)'
      : colors.white;
  const fg = active ? colors.courtGreen : variant === 'onDark' ? 'rgba(255,255,255,0.7)' : colors.inkSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: bg,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: radii.pill,
        borderWidth: variant === 'onLight' && !active ? 1 : 0,
        borderColor: colors.border,
      }}>
      <Text style={{ fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium, fontSize: 13, color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
