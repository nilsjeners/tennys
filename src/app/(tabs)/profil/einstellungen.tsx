import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui/Card';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { colors, fonts } from '@/theme/tokens';

type Icon = React.ComponentProps<typeof Feather>['name'];

export default function Einstellungen() {
  const router = useRouter();
  const me = useQuery(api.users.me, {});
  const [push, setPush] = useState(true);
  const [reminders, setReminders] = useState(false);

  const signOut = async () => {
    await authClient.signOut();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Einstellungen</Text>
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <SectionLabel style={{ marginLeft: 4 }}>Konto</SectionLabel>
        <Card flush style={{ marginBottom: 18 }}>
          <Row icon="user" label="Profil bearbeiten" chevron onPress={() => router.push('/(tabs)/profil/edit')} />
          <Row icon="mail" label="E-Mail-Adresse" value={me?.email ?? '…'} />
          <Row icon="lock" label="Passwort ändern" chevron last />
        </Card>

        <SectionLabel style={{ marginLeft: 4 }}>Benachrichtigungen</SectionLabel>
        <Card flush style={{ marginBottom: 18 }}>
          <Row icon="bell" label="Push-Mitteilungen" toggle toggleOn={push} onToggle={() => setPush((v) => !v)} />
          <Row icon="clock" label="Match-Erinnerungen" toggle toggleOn={reminders} onToggle={() => setReminders((v) => !v)} last />
        </Card>

        <SectionLabel style={{ marginLeft: 4 }}>Präferenzen</SectionLabel>
        <Card flush style={{ marginBottom: 18 }}>
          <Row icon="map-pin" label="Lieblingsplätze" chevron />
          <Row icon="award" label="Spielstärke (LK)" value="LK 12" last />
        </Card>

        <Card flush>
          <Pressable onPress={signOut} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, opacity: pressed ? 0.7 : 1 })}>
            <Feather name="log-out" size={18} color={colors.red} />
            <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.red }}>Abmelden</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value, chevron, toggle, toggleOn, onToggle, onPress, last }: { icon: Icon; label: string; value?: string; chevron?: boolean; toggle?: boolean; toggleOn?: boolean; onToggle?: () => void; onPress?: () => void; last?: boolean }) {
  const content = (
    <>
      <Feather name={icon} size={18} color={colors.courtGreen} />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink }}>{label}</Text>
      {value && <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>{value}</Text>}
      {chevron && <Feather name="chevron-right" size={16} color={colors.chevron} />}
      {toggle && <Toggle on={!!toggleOn} onPress={onToggle} />}
    </>
  );
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}

function Toggle({ on, onPress }: { on: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 42, height: 25, borderRadius: 999, backgroundColor: on ? colors.lime : colors.borderStrong, justifyContent: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', top: 2.5, left: on ? undefined : 2.5, right: on ? 2.5 : undefined, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
    </Pressable>
  );
}
