import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ProgressBar';
import { draws, ticketHoldings } from '../../data/mockData';
import { TicketsStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<TicketsStackParamList>;

export function TicketsScreen() {
  const navigation = useNavigation<Nav>();
  const totalTickets = ticketHoldings.reduce((s, t) => s + t.ticketCount, 0);
  const totalValue = ticketHoldings.reduce((s, t) => {
    const draw = draws.find(d => d.id === t.drawId);
    return s + (draw?.retailValue ?? 0);
  }, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Tickets</Text>
        </View>

        {/* Summary strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTickets}</Text>
            <Text style={styles.statLabel}>tickets</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>£{totalValue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>in draws</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ticketHoldings.length}</Text>
            <Text style={styles.statLabel}>draws</Text>
          </View>
        </View>

        {/* Callout */}
        <View style={styles.callout}>
          <Text style={styles.calloutEmoji}>⚡</Text>
          <Text style={styles.calloutText}>
            Win up to{' '}
            <Text style={styles.calloutBold}>£{totalValue.toLocaleString()}</Text>
            {' '}for as little as{' '}
            <Text style={styles.calloutBold}>10p</Text>
          </Text>
        </View>

        {/* Ticket cards */}
        <View style={styles.cardsSection}>
          {ticketHoldings.map(holding => {
            const draw = draws.find(d => d.id === holding.drawId)!;
            const pct = Math.round((holding.soldTickets / holding.totalTickets) * 100);
            const odds = ((holding.ticketCount / holding.totalTickets) * 100).toFixed(1);
            const oddsNum = parseFloat(odds);

            return (
              <TouchableOpacity
                key={holding.id}
                style={styles.ticketCard}
                onPress={() => navigation.navigate('DrawDetail', { draw })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.thumbnail, { backgroundColor: draw.imageColor }]} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{draw.title}</Text>
                    <Text style={styles.cardSeller}>{draw.sellerEmoji} {draw.seller}</Text>
                    <View style={styles.oddsRow}>
                      <Text style={[
                        styles.oddsText,
                        oddsNum >= 1 ? styles.oddsGold : oddsNum >= 0.5 ? styles.oddsLilac : styles.oddsGrey
                      ]}>
                        {odds}% odds
                      </Text>
                      <View style={[styles.nightBadge, holding.isTonight ? styles.nightBadgePink : styles.nightBadgePurple]}>
                        <Text style={[styles.nightBadgeText, holding.isTonight ? styles.nightBadgeTextPink : styles.nightBadgeTextPurple]}>
                          {holding.isTonight ? 'Draws tonight at 9pm' : 'Draws tomorrow'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <ProgressBar percent={pct} height={4} />

                <View style={styles.cardFooter}>
                  <Text style={styles.footerStat}>
                    {holding.ticketCount} tickets · {holding.ticketPrice}p each
                  </Text>
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => navigation.navigate('Purchase', { draw })}
                  >
                    <Text style={styles.moreBtnText}>+ More</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty state placeholder */}
        {ticketHoldings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎫</Text>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse draws and enter for as little as 10p.
            </Text>
            <TouchableOpacity style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse draws</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: { paddingHorizontal: S.xl, paddingTop: S.lg, paddingBottom: S.md },
  title: { fontSize: 24, fontWeight: '800', color: C.WHITE },
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
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginHorizontal: S.xl,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: C.PURPLE,
    borderRadius: 10,
    padding: S.md,
    marginBottom: S.xl,
  },
  calloutEmoji: { fontSize: 18 },
  calloutText: { color: C.GREY, fontSize: 13, flex: 1, lineHeight: 18 },
  calloutBold: { color: C.WHITE, fontWeight: '700' },
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
  thumbnail: { width: 72, height: 72, borderRadius: 10 },
  cardInfo: { flex: 1, gap: S.xs },
  cardTitle: { color: C.WHITE, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  cardSeller: { color: C.GREY, fontSize: 12 },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  oddsText: { fontSize: 12, fontWeight: '700' },
  oddsGold: { color: C.GOLD },
  oddsLilac: { color: '#A78BFA' },
  oddsGrey: { color: C.GREY },
  nightBadge: { borderRadius: 999, paddingHorizontal: S.sm, paddingVertical: 3 },
  nightBadgePink: { backgroundColor: 'rgba(236,72,153,0.15)', borderWidth: 1, borderColor: C.PINK },
  nightBadgePurple: { backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: C.PURPLE },
  nightBadgeText: { fontSize: 10, fontWeight: '600' },
  nightBadgeTextPink: { color: C.PINK },
  nightBadgeTextPurple: { color: C.PURPLE },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerStat: { color: C.GREY, fontSize: 12 },
  moreBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 5,
  },
  moreBtnText: { color: C.WHITE, fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: S.xxxl, paddingHorizontal: S.xl },
  emptyEmoji: { fontSize: 56, marginBottom: S.lg },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.WHITE, marginBottom: S.sm },
  emptySubtitle: { fontSize: 14, color: C.GREY, textAlign: 'center', marginBottom: S.xl },
  browseBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.md,
    paddingHorizontal: S.xxl,
  },
  browseBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
});
