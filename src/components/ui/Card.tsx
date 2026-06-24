import { View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radii } from '@/theme/tokens';

type Props = ViewProps & {
  /** removes internal padding (for list cards with their own rows) */
  flush?: boolean;
};

// White rounded card with the subtle elevation used across the screens.
export function Card({ flush, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radii.lg,
          padding: flush ? 0 : 14,
          overflow: flush ? 'hidden' : undefined,
          shadowColor: '#000',
          shadowOpacity: 0.07,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        } as ViewStyle,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
