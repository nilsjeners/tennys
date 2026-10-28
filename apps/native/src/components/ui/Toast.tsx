import { Feather } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '@/theme/tokens';

export type ToastKind = 'error' | 'success' | 'info';
type ToastState = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ show: (message: string, kind?: ToastKind) => void } | null>(null);

// System-wide top-toast (PRD): pops in from the top edge, auto-dismisses.
// Use for server/system errors and confirmations; pure format errors get a red
// input outline instead.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = 'error') => {
    nextId.current += 1;
    setToast({ id: nextId.current, kind, message });
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} onDone={() => setToast(null)} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  error: { bg: colors.redDark, fg: '#fff', icon: 'alert-circle' },
  success: { bg: colors.courtGreen, fg: colors.lime, icon: 'check-circle' },
  info: { bg: colors.courtGreen, fg: '#fff', icon: 'info' },
};

function ToastView({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  // lazy state init instead of useRef(...).current — keeps the React Compiler happy
  const [slide] = useState(() => new Animated.Value(-120));

  useEffect(() => {
    Animated.spring(slide, { toValue: 0, useNativeDriver: false, friction: 9 }).start();
    const t = setTimeout(() => {
      Animated.timing(slide, { toValue: -140, duration: 200, useNativeDriver: false }).start(() => onDone());
    }, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = KIND_STYLE[toast.kind];
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: [{ translateY: slide }], zIndex: 1000, alignItems: 'center' }}>
      <Pressable
        onPress={onDone}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          marginTop: insets.top + 10,
          marginHorizontal: 16,
          maxWidth: 420,
          backgroundColor: s.bg,
          borderRadius: radii.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}>
        <Feather name={s.icon} size={17} color={s.fg} />
        <Text style={{ flexShrink: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: s.fg, lineHeight: 18 }}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}
