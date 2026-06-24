import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TennisBall } from '@/components/ui/TennisBall';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Done() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.courtGreen }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingBottom: 40, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 80, width: 300, height: 300, borderRadius: 150, borderWidth: 2, borderColor: 'rgba(201,241,53,0.10)' }} />

          <View
            style={{
              width: 110, height: 110, borderRadius: 55, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 30,
              shadowColor: colors.lime, shadowOpacity: 0.4, shadowRadius: 60, shadowOffset: { width: 0, height: 0 }, elevation: 10,
            }}>
            <TennisBall size={64} ball={colors.courtGreen} line={colors.lime} />
          </View>

          <Text style={{ fontFamily: fonts.display, fontSize: 54, color: colors.lime, letterSpacing: -1, lineHeight: 54 }}>Willkommen!</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 17, color: '#fff', lineHeight: 25, marginTop: 14, maxWidth: 250, textAlign: 'center' }}>
            Dein Konto ist startklar. Logge dein erstes Match und steig in die Rangliste ein. 🎾
          </Text>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => ({ width: '100%', backgroundColor: colors.lime, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center', marginTop: 40, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink }}>Los geht&apos;s</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
