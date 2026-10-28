import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useToast } from '@/components/ui/Toast';
import { friendlyErrorMessage } from '@/lib/errorMessages';
import { useT } from '@/lib/i18n';
import { useAvatarUpload, type PickedImage } from '@/lib/useAvatarUpload';
import { colors, fonts, radii } from '@/theme/tokens';

// Frictionless onboarding (PRD): photo optional, display name is the ONLY
// required field. Save button stays disabled until at least one character.
export default function ProfileSetup() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const me = useQuery(api.users.me, {});
  const createProfile = useMutation(api.users.createProfile);
  const seed = useMutation(api.seed.run);
  const { pickImage, takePhoto, uploadAvatar } = useAvatarUpload();

  const [displayName, setDisplayName] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Social sign-in (Google/Apple) already gave us a name + photo — prefill
  // once instead of making the user retype what they just handed over.
  useEffect(() => {
    if (!me || prefilled) return;
    if (me.socialName) setDisplayName(me.socialName);
    if (me.socialImage) setPhoto({ uri: me.socialImage });
    setPrefilled(true);
  }, [me, prefilled]);

  const choosePhoto = async (source: 'camera' | 'library') => {
    setPhotoSheet(false);
    try {
      const picked = await (source === 'camera' ? takePhoto() : pickImage());
      if (picked) setPhoto(picked);
    } catch (e) {
      if (e instanceof Error && e.message === 'PHOTO_PERMISSION_DENIED') {
        toast.show(t('auth.setup.photoPermissionDenied'), 'info');
        return;
      }
      toast.show(friendlyErrorMessage(e, t('auth.setup.photoFailed'), t));
    }
  };

  const canSave = displayName.trim().length > 0;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await createProfile({ displayName: displayName.trim() });
      if (photo) await uploadAvatar(photo.uri, photo.mimeType); // profile now exists
      await seed({});
      router.replace('/(auth)/done');
    } catch (e) {
      setBusy(false);
      toast.show(friendlyErrorMessage(e, t('auth.setup.failed'), t));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('auth.setup.title')} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <Pressable
              onPress={() => setPhotoSheet(true)}
              style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.white, borderWidth: photo ? 0 : 2, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={{ width: 96, height: 96, borderRadius: 48 }} contentFit="cover" />
              ) : (
                <Feather name="camera" size={30} color={colors.inkMuted} />
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.screen }}>
                <Feather name={photo ? 'check' : 'plus'} size={14} color={colors.ink} />
              </View>
            </Pressable>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSecondary, marginTop: 10 }}>
              {photo ? t('auth.setup.photoPicked') : t('auth.setup.addPhoto')}
            </Text>
          </View>

          <SectionLabel>{t('auth.setup.displayName')}</SectionLabel>
          <View style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('auth.setup.namePlaceholder')}
              editable={!busy}
              placeholderTextColor={colors.inkMuted}
              style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
            />
          </View>

          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('auth.setup.submit')} onPress={submit} disabled={!canSave} loading={busy} />
        </View>
      </KeyboardAvoidingView>

      {/* photo source action sheet, bottom-anchored per platform convention */}
      <Modal visible={photoSheet} transparent animationType="slide" onRequestClose={() => setPhotoSheet(false)}>
        <Pressable
          onPress={() => setPhotoSheet(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{ paddingBottom: 34 }}>
            <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden' }}>
              <Pressable onPress={() => choosePhoto('camera')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Feather name="camera" size={18} color={colors.courtGreen} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink }}>{t('profile.edit.camera')}</Text>
              </Pressable>
              <Pressable onPress={() => choosePhoto('library')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
                <Feather name="image" size={18} color={colors.courtGreen} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink }}>{t('profile.edit.library')}</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 8, backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden' }}>
              <Pressable onPress={() => setPhotoSheet(false)} style={{ paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.inkSecondary }}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
