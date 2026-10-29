import { Text, View } from 'react-native';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme/tokens';

// Normalized win/loss split bar. Shows ONLY percentage values inside the bar
// (PRD), e.g. "80 %" — absolute numbers go into the surrounding card's subtext.
export function WinLossBar({ wins, losses, compact }: { wins: number; losses: number; compact?: boolean }) {
  const total = Math.max(wins + losses, 1);
  const winPct = Math.round((wins / total) * 100);
  const lossPct = 100 - winPct;
  const h = compact ? 12 : 16;
  const showWin = wins > 0 && winPct >= 12;
  const showLoss = losses > 0 && lossPct >= 12;
  return (
    <View style={{ flexDirection: 'row', height: h, borderRadius: 999, overflow: 'hidden' }}>
      {wins > 0 ? (
        <View
          style={{
            flex: wins,
            backgroundColor: colors.skyLight,
            borderRightWidth: losses > 0 ? 1 : 0,
            borderRightColor: '#fff',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 9,
          }}>
          {!compact && showWin ? <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 13, color: colors.ink }}>{winPct} %</Text> : null}
        </View>
      ) : null}
      {losses > 0 ? (
        <View style={{ flex: losses, backgroundColor: colors.coralLight, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 9 }}>
          {!compact && showLoss ? <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 13, color: colors.ink }}>{lossPct} %</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

// The one balance card used identically on profile + match detail (PRD):
// title left, base ("X Spiele") right, percentage bar, subtext below.
// `title` defaults to the translated "Bilanz"/"Record" label.
export function BalanceCard({ wins, losses, title }: { wins: number; losses: number; title?: string }) {
  const t = useT();
  const total = wins + losses;
  return (
    <View
      style={{
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{title ?? t('balance.title')}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>{t('common.matches', { n: total })}</Text>
      </View>
      <WinLossBar wins={wins} losses={losses} />
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted, marginTop: 8 }}>
        {t('balance.sub', { wins, losses })}
      </Text>
    </View>
  );
}
