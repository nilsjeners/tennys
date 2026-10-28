import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useToast } from '@/components/ui/Toast';
import { friendlyErrorMessage } from '@/lib/errorMessages';
import { useT } from '@/lib/i18n';
import { useAvatarUpload } from '@/lib/useAvatarUpload';
import { colors, fonts, radii } from '@/theme/tokens';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// Edit profile (PRD): photo with camera-badge overlay + display name only.
export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const me = useQuery(api.users.me, {});
  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage, takePhoto, uploadAvatar, uploading } = useAvatarUpload();
  const [photoSheet, setPhotoSheet] = useState(false);

  const changePhoto = async (source: 'camera' | 'library') => {
    setPhotoSheet(false);
    try {
      const img = await (source === 'camera' ? takePhoto() : pickImage());
      if (img) await uploadAvatar(img.uri, img.mimeType); // me.avatarUrl updates reactively
    } catch (e) {
      if (e instanceof Error && e.message === 'PHOTO_PERMISSION_DENIED') {
        toast.show(t('auth.setup.photoPermissionDenied'), 'info');
        return;
      }
      console.error('avatar upload failed', e);
      toast.show(friendlyErrorMessage(e, t('profile.edit.uploadFailed'), t));
    }
  };

  // null = untouched → falls back to the loaded profile name (no prefill effect)
  const [edited, setEdited] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const displayName = edited ?? me?.profile?.displayName ?? '';

  const canSave = displayName.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      router.back();
    } catch (e) {
      setBusy(false);
      toast.show(friendlyErrorMessage(e, t('profile.edit.saveFailed'), t));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('profile.edit.title')} onBack={() => router.back()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 24 }}>
          {/* photo with camera badge overlay */}
          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <Pressable onPress={() => setPhotoSheet(true)} disabled={uploading} style={{ opacity: uploading ? 0.6 : 1 }}>
              <Avatar
                uri={me?.avatarUrl ?? undefined}
                initials={me?.profile ? initials(me.profile.displayName) : '–'}
                size={96}
                display
              />
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.screen }}>
                <Feather name="camera" size={13} color={colors.ink} />
              </View>
            </Pressable>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSecondary, marginTop: 10 }}>
              {uploading ? t('profile.edit.uploading') : t('profile.edit.changePhoto')}
            </Text>
          </View>

          <SectionLabel>{t('auth.setup.displayName')}</SectionLabel>
          <View style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
            <TextInput
              value={displayName}
              onChangeText={setEdited}
              placeholder={t('auth.setup.namePlaceholder')}
              editable={!busy}
              placeholderTextColor={colors.inkMuted}
              style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
            />
          </View>

          <View style={{ flex: 1 }} />
          <PrimaryButton label={t('common.save')} onPress={save} disabled={!canSave} loading={busy} />
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
              <Pressable onPress={() => changePhoto('camera')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Feather name="camera" size={18} color={colors.courtGreen} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink }}>{t('profile.edit.camera')}</Text>
              </Pressable>
              <Pressable onPress={() => changePhoto('library')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
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
