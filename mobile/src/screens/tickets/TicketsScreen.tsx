import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ProgressBar';
import { apiGet } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Entry {
  drawId: string;
  drawTitle: string;
  drawImageUrl?: string;
  ticketCount: number;
  ticketPricePence: number;
  enteredAt: string;
  closingDate: string;
  status: string;
  isWinner: boolean;
  soldTickets?: number;
  totalTickets?: number;
}

export function TicketsScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ entries: Entry[] }>('/me/entries')
      .then(d => setEntries((d.entries ?? []).filter(e => e.status === 'open' && !e.isWinner)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalTickets = entries.reduce((s, e) => s + e.ticketCount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Tickets</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.PURPLE} />
          </View>
        ) : (
          <>
            {/* Summary strip */}
            <View style={styles.summaryStrip}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalTickets}</Text>
                <Text style={styles.statLabel}>tickets</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{entries.length}</Text>
                <Text style={styles.statLabel}>draws</Text>
              </View>
            </View>

            {/* Ticket cards */}
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No active tickets</Text>
                <Text style={styles.emptySubtitle}>
                  Browse draws and enter for as little as 10p.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsSection}>
                {entries.map(entry => {
                  const pct = entry.totalTickets
                    ? Math.round(((entry.soldTickets ?? 0) / entry.totalTickets) * 100)
                    : 0;
                  const odds = entry.totalTickets
                    ? ((entry.ticketCount / entry.totalTickets) * 100).toFixed(1)
                    : '?';
                  const oddsNum = parseFloat(odds);

                  return (
                    <View key={entry.drawId} style={styles.ticketCard}>
                      <View style={styles.cardTop}>
                        <View style={styles.thumbnail}>
                          {entry.drawImageUrl ? (
                            <Image source={{ uri: entry.drawImageUrl }} style={styles.thumbnailImg} />
                          ) : (
                            <Text style={styles.thumbnailEmoji}>🎟</Text>
                          )}
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={2}>{entry.drawTitle}</Text>
                          <View style={styles.oddsRow}>
                            {!isNaN(oddsNum) && (
                              <Text style={[
                                styles.oddsText,
                                oddsNum >= 1 ? styles.oddsGold : oddsNum >= 0.5 ? styles.oddsLilac : styles.oddsGrey,
                              ]}>
                                {odds}% odds
                              </Text>
                            )}
                            <View style={styles.nightBadgePurple}>
                              <Text style={styles.nightBadgeTextPurple}>Draws tonight at 9pm</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {pct > 0 && <ProgressBar percent={pct} height={4} />}

                      <View style={styles.cardFooter}>
                        <Text style={styles.footerStat}>
                          {entry.ticketCount} tickets · {entry.ticketPricePence}p each
                        </Text>
                        <Text style={styles.closingDate}>{entry.closingDate}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: { paddingHorizontal: S.xl, paddingTop: S.lg, paddingBottom: S.md },
  title: { fontSize: 24, fontWeight: '800', color: C.TEXT },
  center: { padding: S.xxl, alignItems: 'center' },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: C.CARD,
    marginHorizontal: S.xl,
    borderRadius: 12,
    padding: S.lg,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: C.GOLD },
  statLabel: { fontSize: 11, color: C.GREY, marginTop: 2 },
  divider: { width: 1, backgroundColor: C.BORDER },
  cardsSection: { paddingHorizontal: S.xl, gap: S.md, marginBottom: S.xxl },
  ticketCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    gap: S.md,
  },
  cardTop: { flexDirection: 'row', gap: S.md },
  thumbnail: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.CARD2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbnailImg: { width: 72, height: 72, borderRadius: 10 },
  thumbnailEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: S.xs },
  cardTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  oddsText: { fontSize: 12, fontWeight: '700' },
  oddsGold: { color: C.GOLD },
  oddsLilac: { color: '#A78BFA' },
  oddsGrey: { color: C.GREY },
  nightBadgePurple: {
    backgroundColor: C.PURPLE_LIGHT,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  nightBadgeTextPurple: { color: C.PURPLE, fontSize: 10, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerStat: { color: C.GREY, fontSize: 12 },
  closingDate: { color: C.MUTED, fontSize: 11 },
  emptyState: { alignItems: 'center', paddingTop: S.xxxl, paddingHorizontal: S.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.TEXT, marginBottom: S.sm },
  emptySubtitle: { fontSize: 14, color: C.GREY, textAlign: 'center', marginBottom: S.xl },
});
