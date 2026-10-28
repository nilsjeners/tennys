import { Image } from 'expo-image';
import { Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Props = {
  initials: string;
  size?: number;
  bg?: string;
  fg?: string;
  /** when set, shows the photo instead of initials */
  uri?: string | null;
  /** use Bebas Neue (e.g. profile header) instead of DM Sans */
  display?: boolean;
  /** extra style (border / margin) — used for stacked doubles avatars */
  style?: ViewStyle;
};

export function Avatar({ initials, size = 38, bg = colors.courtGreen, fg = colors.lime, uri, display, style }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }, style as ImageStyle]}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text
        style={{
          color: fg,
          fontFamily: display ? fonts.display : fonts.sansBold,
          fontSize: display ? size * 0.36 : Math.max(11, size * 0.32),
        }}>
        {initials}
      </Text>
    </View>
  );
}

// Two overlapping avatars for a doubles side.
export function AvatarStack({
  a,
  b,
  size = 38,
  border = colors.white,
}: {
  a: { initials: string; bg: string; fg: string; uri?: string | null };
  b: { initials: string; bg: string; fg: string; uri?: string | null };
  size?: number;
  border?: string;
}) {
  const ring: ViewStyle = { borderWidth: 2, borderColor: border };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Avatar {...a} size={size} style={{ ...ring, zIndex: 2 }} />
      <Avatar {...b} size={size} style={{ ...ring, marginLeft: -size * 0.34 }} />
    </View>
  );
}
