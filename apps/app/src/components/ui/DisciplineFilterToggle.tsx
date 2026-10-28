import { Pressable, View } from 'react-native';
import { SinglesIcon, DoublesIcon } from '@/components/ui/icons';
import { colors } from '@/theme/tokens';

export type DisciplineFilter = 'both' | 'singles' | 'doubles';

const NEXT: Record<DisciplineFilter, DisciplineFilter> = { both: 'singles', singles: 'doubles', doubles: 'both' };

// Feed filter for the "Spiele" list: one tap cycles both → Einzel → Doppel →
// both, rather than two independently-pressable segments (that's SegmentedIcons,
// used elsewhere for a strict either/or choice).
export function DisciplineFilterToggle({ value, onChange }: { value: DisciplineFilter; onChange: (v: DisciplineFilter) => void }) {
  const singlesActive = value !== 'doubles';
  const doublesActive = value !== 'singles';
  return (
    <Pressable
      onPress={() => onChange(NEXT[value])}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 5 }}>
      <SinglesIcon size={15} color={singlesActive ? colors.lime : 'rgba(255,255,255,0.35)'} fill={singlesActive ? 'rgba(201,241,53,0.25)' : 'none'} />
      <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.15)' }} />
      <DoublesIcon size={15} color={doublesActive ? colors.lime : 'rgba(255,255,255,0.35)'} fill={doublesActive ? 'rgba(201,241,53,0.25)' : 'none'} />
    </Pressable>
  );
}
