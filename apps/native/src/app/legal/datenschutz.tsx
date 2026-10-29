import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { PRIVACY_SECTIONS as SECTIONS } from '@repo/backend/convex/lib/locales';
import { Header } from '@/components/ui/Header';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme/tokens';

// Copy lives in convex/lib/locales.ts under `legal.privacy.<key>.title` /
// `.body` and is editable in the Convex dashboard.

export default function Datenschutz() {
  const router = useRouter();
  const t = useT();
  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('legal.privacy.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginBottom: 24 }}>
          {t('legal.updated')}
        </Text>

        {SECTIONS.map((key, i) => (
          <Section key={key} title={t(`legal.privacy.${key}.title`)} last={i === SECTIONS.length - 1}>
            {t(`legal.privacy.${key}.body`)}
          </Section>
        ))}
      </ScrollView>
    </View>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={{ marginBottom: last ? 0 : 26 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}
