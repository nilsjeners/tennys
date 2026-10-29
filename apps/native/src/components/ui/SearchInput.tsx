import { Feather } from '@expo/vector-icons';
import { Pressable, TextInput, View, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

// Shared realtime search field for the light sub-header row (Freunde,
// Rangliste, …) — same look wherever a search box appears.
export function SearchInput({
  value,
  onChangeText,
  placeholder,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 9 },
        style,
      ]}>
      <Feather name="search" size={14} color={colors.inkMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.inkMuted}
        style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, padding: 0 }}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Feather name="x" size={13} color={colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
