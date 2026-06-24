import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { TennisBall } from '@/components/ui/TennisBall';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.courtGreen }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 36, paddingBottom: 36, justifyContent: 'space-between', overflow: 'hidden' }}>
          {/* decorative rings */}
          <View style={{ position: 'absolute', top: -60, right: -70, width: 240, height: 240, borderRadius: 120, borderWidth: 2, borderColor: 'rgba(201,241,53,0.12)' }} />
          <View style={{ position: 'absolute', bottom: 120, left: -80, width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(201,241,53,0.08)' }} />

          <View style={{ marginTop: 36 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
              <TennisBall size={40} ball={colors.courtGreen} line={colors.lime} />
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 64, color: colors.lime, letterSpacing: -1, lineHeight: 64 }}>tennys</Text>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 18, color: '#fff', lineHeight: 25, marginTop: 14, maxWidth: 240 }}>
              Tracke deine Matches. Finde Gegner. Werde besser.
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <SocialButton icon={<Ionicons name="logo-apple" size={17} color={colors.ink} />} label="Mit Apple fortfahren" />
            <SocialButton icon={<GoogleLogo size={17} />} label="Mit Google fortfahren" />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>oder</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </View>

            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => ({ width: '100%', backgroundColor: colors.lime, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink }}>Mit E-Mail registrieren</Text>
            </Pressable>

            <Text style={{ textAlign: 'center', fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              Schon dabei?{' '}
              <Text onPress={() => router.push('/(auth)/login')} style={{ color: colors.lime, fontFamily: fonts.sansSemiBold }}>
                Anmelden
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', backgroundColor: '#fff', borderRadius: radii.md, paddingVertical: 15, opacity: pressed ? 0.85 : 1 })}>
      {icon}
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
