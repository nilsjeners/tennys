import { Pressable, View } from 'react-native';
import { colors } from '@/theme/tokens';

// Settings on/off switch — lime track when on, grey when off.
export function Toggle({ value, onValueChange }: { value: boolean; onValueChange?: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      hitSlop={6}
      style={{
        width: 42,
        height: 25,
        borderRadius: 999,
        backgroundColor: value ? colors.lime : colors.borderStrong,
        paddingHorizontal: 2.5,
        alignItems: value ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
