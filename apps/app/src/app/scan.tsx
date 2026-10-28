import { useRouter } from 'expo-router';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Avatar } from '@/components/ui/Avatar';
import { HeaderIconButton } from '@/components/ui/Header';
import { DisciplineToggle } from '@/components/ui/DisciplineToggle';
import { useMatchDraft, type DraftPlayer } from '@/lib/matchDraft';
import { avatarColors } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { colors, fonts } from '@/theme/tokens';

const CORNER = colors.lime;

export default function Scan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const convex = useConvex();
  const { slots, addPlayer, removePlayer, mode, setMode } = useMatchDraft();
  const realPlayers = slots.filter((s): s is DraftPlayer => s !== null && s !== 'me');
  const me = useQuery(api.users.me, {});
  const addFriend = useMutation(api.friends.addDirect);
  const [permission, requestPermission] = useCameraPermissions();
  const [done, setDone] = useState(false);

  // ask once as soon as we know we haven't asked yet
  useEffect(() => {
    if (permission?.status === 'undetermined') requestPermission();
  }, [permission?.status, requestPermission]);

  const cap = mode === 'Doppel' ? 3 : 1;
  const discipline = mode === 'Doppel' ? 'doubles' : 'singles';
  const lastScanAt = useRef(0);

  // partner/opponents are relative to wherever 'me' currently sits — the
  // signed-in user can be repositioned (match-setup drag-and-drop) so this
  // isn't always slots[0].
  const meIndex = slots.indexOf('me');
  const asPlayer = (s: (typeof slots)[number]) => (s === 'me' ? null : s);
  let partner: DraftPlayer | null = null;
  let opponents: (DraftPlayer | null)[] = [];
  if (mode === 'Doppel') {
    const onMyHalf = meIndex <= 1;
    partner = asPlayer(slots[onMyHalf ? 1 - meIndex : meIndex === 2 ? 3 : 2]);
    opponents = onMyHalf ? [asPlayer(slots[2]), asPlayer(slots[3])] : [asPlayer(slots[0]), asPlayer(slots[1])];
  } else {
    opponents = [asPlayer(slots[meIndex === 0 ? 1 : 0])];
  }
  const slotLabels = mode === 'Doppel'
    ? [t('matchSetup.slotPartner'), t('matchSetup.slotOpponent1'), t('matchSetup.slotOpponent2')]
    : [t('matchSetup.slotOpponent')];

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (done) return;
    const now = Date.now();
    if (now - lastScanAt.current < 2000) return;
    const match = /^tennys:\/\/player\/(.+)$/.exec(data);
    if (!match) return; // unrelated QR code — ignore silently
    lastScanAt.current = now;

    const profileId = match[1] as Id<'playerProfiles'>;
    if (profileId === me?.profile?._id) {
      toast.show(t('scan.ownCode'), 'info');
      return;
    }
    if (realPlayers.some((p) => p.profileId === profileId)) {
      toast.show(t('scan.alreadyIn'), 'info');
      return;
    }
    if (realPlayers.length >= cap) {
      toast.show(t('scan.maxPlayers'), 'info');
      return;
    }

    try {
      const card = await convex.query(api.players.profile, { profileId, discipline });
      if (!card) {
        toast.show(t('scan.notFound'), 'info');
        return;
      }
      addPlayer({ profileId: card.profileId, name: card.name, initials: card.initials, avatarUrl: card.avatarUrl, points: card.points });
      // viral loop: scanning adds the player to both friend lists immediately
      addFriend({ profileId: card.profileId }).catch(() => {});
      // all slots filled — show a confirmation beat, then close automatically
      if (realPlayers.length + 1 >= cap) {
        setDone(true);
        setTimeout(() => router.back(), 750);
      }
    } catch {
      toast.show(t('scan.unreadable'), 'info');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.notch }}>
      <View style={{ paddingTop: insets.top + 6, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 12, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
            <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>{t('scan.title')}</Text>
          </View>
          <DisciplineToggle value={mode === 'Doppel' ? 'doubles' : 'singles'} onChange={(d) => setMode(d === 'singles' ? 'Einzel' : 'Doppel')} variant="onDark" />
        </View>

        {/* own QR */}
        <View style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 14, backgroundColor: '#fff', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 6, backgroundColor: '#fff' }}>
            {me?.profile?._id ? (
              <QRCode value={`tennys://player/${me.profile._id}`} size={84} backgroundColor="#fff" color={colors.courtGreen} />
            ) : (
              <View style={{ width: 84, height: 84 }} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 3 }}>{t('scan.yourCode')}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, lineHeight: 22 }}>{me?.profile?.displayName ?? t('common.you')}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkSecondary, marginTop: 2 }}>{t('scan.yourCodeHint')}</Text>
          </View>
        </View>

        {/* viewfinder — square */}
        <View style={{ aspectRatio: 1, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.courtGreen, alignItems: 'center', justifyContent: 'center' }}>
          {permission?.granted ? (
            <>
              <CameraView
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcodeScanned}
              />
              {/* corner frame */}
              <View style={{ position: 'absolute', width: 180, height: 180 }} pointerEvents="none">
                <Corner style={{ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 }} />
                <Corner style={{ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 }} />
                <Corner style={{ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 }} />
                <Corner style={{ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 }} />
              </View>
              <View style={{ position: 'absolute', bottom: 14 }} pointerEvents="none">
                <Text style={{ fontSize: 12, color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' }}>
                  {t('scan.aim')}
                </Text>
              </View>
            </>
          ) : permission?.status === 'denied' ? (
            <>
              <Feather name="camera-off" size={42} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 220, marginTop: 12 }}>
                {t('scan.noAccess')}
              </Text>
              <Pressable onPress={() => Linking.openSettings()} style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#fff' }}>{t('scan.openSettings')}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => requestPermission()} style={{ alignItems: 'center', padding: 24 }}>
              <Feather name="camera" size={42} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 220, marginTop: 12 }}>
                {t('scan.tapToAllow')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* scanned players — same grouped look as match-setup: partner alone, opponents in one box */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom > 0 ? insets.bottom + 14 : 22, gap: 8 }}>
          {mode === 'Doppel' ? (
            <>
              <SlotBox slots={[partner]} labels={[slotLabels[0]]} onRemove={removePlayer} />
              <SlotBox slots={opponents} labels={[slotLabels[1], slotLabels[2]]} onRemove={removePlayer} />
            </>
          ) : (
            <SlotBox slots={opponents} labels={slotLabels} onRemove={removePlayer} />
          )}
        </View>
      </View>

      {done ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <Animated.View
            entering={ZoomIn.duration(280)}
            style={{ width: 88, height: 88, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={40} color={colors.courtGreen} />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[{ position: 'absolute', width: 36, height: 36, borderColor: CORNER }, style]} />;
}

function SlotBox({ slots, labels, onRemove }: { slots: (DraftPlayer | null)[]; labels: string[]; onRemove: (id: string) => void }) {
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      {slots.map((p, i) => {
        const c = p ? avatarColors(p.profileId) : null;
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.10)' }}>
            {p ? (
              <Avatar initials={p.initials} uri={p.avatarUrl} size={38} bg={c!.bg} fg={c!.fg} />
            ) : (
              <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderStyle: 'dashed' }} />
            )}
            <Text style={{ flex: 1, fontFamily: p ? fonts.sansSemiBold : fonts.sansMedium, fontSize: 15, color: p ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {p ? p.name : labels[i]}
            </Text>
            {p ? (
              <Pressable onPress={() => onRemove(p.profileId)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
