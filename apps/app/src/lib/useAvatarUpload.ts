import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { useState } from 'react';

import { api } from '@convex/_generated/api';

export type PickedImage = { uri: string; mimeType?: string };

// Avatar picking + uploading. `uploadAvatar` requires an existing profile, so
// onboarding picks first (holds the uri) and uploads after the profile is created.
export function useAvatarUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const setAvatar = useMutation(api.files.setAvatar);
  const [uploading, setUploading] = useState(false);

  // Permission denial and user cancellation must stay distinguishable to
  // callers (one is an error worth surfacing, the other is silent), so
  // denial throws instead of returning null like a cancel does.
  async function pickImage(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('PHOTO_PERMISSION_DENIED');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets[0]) return null;
    return { uri: res.assets[0].uri, mimeType: res.assets[0].mimeType };
  }

  async function takePhoto(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('PHOTO_PERMISSION_DENIED');
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets[0]) return null;
    return { uri: res.assets[0].uri, mimeType: res.assets[0].mimeType };
  }

  async function uploadAvatar(uri: string, mimeType?: string) {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      // Raw bytes, not a Blob: Expo's native fetch derives Content-Type from the
      // blob store entry (empty for file:// reads), which Convex rejects.
      const bytes = await (await fetch(uri)).arrayBuffer();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mimeType || 'image/jpeg' },
        body: bytes,
      });
      const body = await result.json();
      if (!result.ok || !body.storageId) {
        throw new Error(`Upload failed (${result.status}): ${JSON.stringify(body)}`);
      }
      await setAvatar({ storageId: body.storageId });
    } finally {
      setUploading(false);
    }
  }

  return { pickImage, takePhoto, uploadAvatar, uploading };
}
