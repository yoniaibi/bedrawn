import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveDot } from '../../components/LiveDot';
import { ProgressBar } from '../../components/ProgressBar';
import { grandDraw as mockGrandDraw } from '../../data/mockData';
import { apiGet, apiPost } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface GrandDrawConfig {
  prize: string;
  value: number;
  imageUrl?: string;
  emoji?: string;
  totalEntries: number;
}

interface GrandDrawData {
  config: GrandDrawConfig;
  userEntries: number;
  claimedToday: boolean;
  streak: number;
  loginDays: number[];
}

function getDaysUntilEndOfMonth(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const diff = Math.max(0, endOfMonth.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

function LoginCalendar({ loginDays }: { loginDays: number[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const loginSet = new Set(loginDays);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.calendarGrid}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <Text key={`h${i}`} style={styles.calDayHeader}>{d}</Text>
      ))}
      {/* Empty cells for start of month alignment */}
      {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }, (_, i) => (
        <View key={`e${i}`} style={styles.calCell} />
      ))}
      {days.map(day => {
        const isPast = day < today;
        const isToday = day === today;
        const isLoggedIn = loginSet.has(day);
        const isMissed = isPast && !isLoggedIn;

        return (
          <View
            key={day}
            style={[
              styles.calCell,
              isLoggedIn && styles.calCellGold,
              isToday && styles.calCellToday,
              isMissed && styles.calCellMissed,
            ]}
          >
            <Text style={[
              styles.calDayText,
              isLoggedIn && styles.calDayTextGold,
              isToday && styles.calDayTextToday,
              isMissed && styles.calDayTextMissed,
            ]}>
              {day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const ACHIEVEMENTS_BADGES = [
  { label: '7-day streak', color: C.GOLD },
  { label: '30-day', color: '#F97316', locked: true },
];

export function GrandDrawScreen() {
  const [apiData, setApiData] = useState<GrandDrawData | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { days, hours, minutes } = getDaysUntilEndOfMonth();

  const month = new Date().toLocaleString('default', { month: 'long' });

  // Derived values — API data with mock fallback
  const config = apiData?.config ?? {
    prize: mockGrandDraw.prize,
    value: mockGrandDraw.value,
    totalEntries: mockGrandDraw.totalEntries,
    emoji: mockGrandDraw.emoji,
  };
  const userEntries = apiData?.userEntries ?? 0;
  const streak = apiData?.streak ?? 0;
  const loginDays = apiData?.loginDays ?? [];
  const claimedToday = claimed || (apiData?.claimedToday ?? false);

  const totalEntries = config.totalEntries;
  const oddsIn = userEntries > 0 ? Math.round(totalEntries / userEntries) : null;
  const entriesPercent = totalEntries > 0 ? Math.round((userEntries / totalEntries) * 100) : 0;

  const fetchData = useCallback(() => {
    apiGet<GrandDrawData>('/grand-draw')
      .then(d => {
        setApiData(d);
        setClaimed(d.claimedToday);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      await apiPost('/grand-draw/claim', {});
      setClaimed(true);
      // Refresh to get updated userEntries
      apiGet<GrandDrawData>('/grand-draw')
        .then(d => setApiData(d))
        .catch(() => {});
    } catch {
      // 409 already claimed or network error — mark button as claimed
      setClaimed(true);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>bedrawn</Text>
          <Text style={styles.monthLabel}>{month}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.PURPLE} style={{ marginTop: S.xxl }} />
        ) : (
          <>
            {/* Prize card */}
            <View style={styles.prizeCard}>
              <View style={styles.grandBadge}>
                <LiveDot />
                <Text style={styles.grandBadgeText}>GRAND DRAW</Text>
              </View>
              <Text style={styles.prizeName}>{config.prize}</Text>
              <View style={styles.valueRow}>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueText}>Worth £{config.value.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Countdown card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Draw resolves in</Text>
              <View style={styles.countdownRow}>
                <View style={styles.countdownUnit}>
                  <Text style={styles.countdownNum}>{String(days).padStart(2, '0')}</Text>
                  <Text style={styles.countdownLabel}>days</Text>
                </View>
                <Text style={styles.countdownSep}>:</Text>
                <View style={styles.countdownUnit}>
                  <Text style={styles.countdownNum}>{String(hours).padStart(2, '0')}</Text>
                  <Text style={styles.countdownLabel}>hours</Text>
                </View>
                <Text style={styles.countdownSep}>:</Text>
                <View style={styles.countdownUnit}>
                  <Text style={styles.countdownNum}>{String(minutes).padStart(2, '0')}</Text>
                  <Text style={styles.countdownLabel}>mins</Text>
                </View>
              </View>
            </View>

            {/* Entries card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Your entries</Text>
              <Text style={styles.entriesNum}>{userEntries}</Text>
              {oddsIn !== null && (
                <Text style={styles.oddsText}>Your odds: 1 in {oddsIn}</Text>
              )}
              {userEntries === 0 && (
                <Text style={styles.oddsText}>Log in daily to earn free entries</Text>
              )}
              <ProgressBar percent={entriesPercent} height={6} />
              <Text style={styles.totalEntries}>{totalEntries.toLocaleString()} total entries</Text>
            </View>

            {/* Claim button */}
            <TouchableOpacity
              style={[styles.claimBtn, claimedToday && styles.claimBtnClaimed]}
              onPress={handleClaim}
              disabled={claimedToday || claimLoading}
              activeOpacity={0.85}
            >
              {claimLoading
                ? <ActivityIndicator color={C.WHITE} />
                : (
                  <Text style={styles.claimBtnText}>
                    {claimedToday ? '+1 ticket claimed ✓' : "Claim today's ticket"}
                  </Text>
                )
              }
            </TouchableOpacity>

            {/* Streak card */}
            <View style={styles.card}>
              <View style={styles.streakRow}>
                <Text style={styles.streakNum}>{streak}</Text>
                <Text style={styles.streakSub}>day streak</Text>
              </View>
              {/* Achievement badges */}
              <View style={styles.achievementRow}>
                {ACHIEVEMENTS_BADGES.map(badge => (
                  <View
                    key={badge.label}
                    style={[styles.achievementBadge, badge.locked && styles.achievementLocked]}
                  >
                    <Text style={[styles.achievementLabel, { color: badge.locked ? C.MUTED : badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Login calendar */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Login calendar — {month}</Text>
              <Text style={styles.calSubtitle}>Log in daily to earn free entries</Text>
              <LoginCalendar loginDays={loginDays} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingVertical: S.lg,
  },
  logo: { fontFamily: 'serif', fontSize: 24, fontStyle: 'italic', color: C.PURPLE, fontWeight: '700' },
  monthLabel: { color: C.GREY, fontSize: 16, fontWeight: '600' },
  prizeCard: {
    marginHorizontal: S.xl,
    marginBottom: S.lg,
    backgroundColor: C.CARD2,
    borderRadius: 20,
    padding: S.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.PURPLE,
    position: 'relative',
    overflow: 'hidden',
  },
  grandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: C.PURPLE_LIGHT,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    marginBottom: S.lg,
  },
  grandBadgeText: { color: C.PURPLE, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  prizeName: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: S.md,
    textAlign: 'center',
  },
  valueRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap', justifyContent: 'center' },
  valueBadge: {
    backgroundColor: 'rgba(252,211,77,0.15)',
    borderWidth: 1,
    borderColor: C.GOLD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
  },
  valueText: { color: C.GOLD, fontSize: 12, fontWeight: '700' },
  card: {
    marginHorizontal: S.xl,
    marginBottom: S.lg,
    backgroundColor: C.CARD,
    borderRadius: 16,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  cardLabel: { color: C.GREY, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: S.sm },
  cardTitle: { color: C.TEXT, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm },
  countdownUnit: { alignItems: 'center' },
  countdownNum: { fontFamily: 'serif', fontSize: 36, fontWeight: '800', color: C.TEXT },
  countdownLabel: { color: C.GREY, fontSize: 11, marginTop: 2 },
  countdownSep: { fontSize: 28, color: C.MUTED, marginBottom: 8 },
  entriesNum: { fontFamily: 'serif', fontSize: 48, fontWeight: '800', color: C.GOLD, textAlign: 'center' },
  oddsText: { color: C.GREY, fontSize: 13, textAlign: 'center', marginBottom: S.md },
  totalEntries: { color: C.MUTED, fontSize: 11, textAlign: 'right', marginTop: S.xs },
  claimBtn: {
    marginHorizontal: S.xl,
    marginBottom: S.lg,
    backgroundColor: C.GREEN,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  claimBtnClaimed: { backgroundColor: C.MUTED },
  claimBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  streakNum: { fontSize: 40, fontWeight: '800', color: C.TEXT, fontFamily: 'serif' },
  streakSub: { color: C.GREY, fontSize: 13 },
  achievementRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: 'rgba(252,211,77,0.10)',
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.GOLD,
  },
  achievementLocked: { borderColor: C.BORDER, backgroundColor: C.CARD2 },
  achievementLabel: { fontSize: 12, fontWeight: '600' },
  calSubtitle: { color: C.GREY, fontSize: 12, marginBottom: S.md },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calDayHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: C.MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  calCell: {
    width: `${100 / 7 - 0.6}%`,
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.CARD2,
  },
  calCellGold: { backgroundColor: 'rgba(252,211,77,0.20)' },
  calCellToday: { borderWidth: 2, borderColor: C.PINK },
  calCellMissed: { backgroundColor: 'rgba(248,113,113,0.10)' },
  calDayText: { color: C.MUTED, fontSize: 12 },
  calDayTextGold: { color: C.GOLD, fontWeight: '700' },
  calDayTextToday: { color: C.PINK, fontWeight: '800' },
  calDayTextMissed: { color: C.RED },
});
