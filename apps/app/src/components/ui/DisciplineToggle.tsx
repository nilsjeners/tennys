import { SegmentedIcons, type SegVariant } from '@/components/ui/SegmentedIcons';
import { SinglesIcon, DoublesIcon } from '@/components/ui/icons';

export type Discipline = 'singles' | 'doubles';

// Einzel/Doppel toggle — same one-circle/two-circles icon style as the
// Einzel/Doppel switch on "Neues Spiel anlegen", for consistency everywhere
// discipline can be chosen. Drives which rating (ratingSingles/ratingDoubles)
// is shown. `onDark` for court-green headers, `onLight` for light surfaces.
export function DisciplineToggle({
  value,
  onChange,
  variant = 'onDark',
}: {
  value: Discipline;
  onChange: (d: Discipline) => void;
  variant?: SegVariant;
}) {
  return (
    <SegmentedIcons
      activeIndex={value === 'singles' ? 0 : 1}
      onChange={(i) => onChange(i === 0 ? 'singles' : 'doubles')}
      variant={variant}
      renderLeft={(s) => <SinglesIcon size={16} color={s.stroke} fill={s.fill} />}
      renderRight={(s) => <DoublesIcon size={16} color={s.stroke} fill={s.fill} />}
    />
  );
}
