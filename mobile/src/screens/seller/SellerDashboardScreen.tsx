import { useNavigation } from '@react-navigation/native';
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
import { draws } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const SELLER_DRAWS = draws.filter(d => d.seller === 'luxe_resale').concat(draws.slice(0, 1));

const DRAW_STATS = [
  {
    draw: draws[0],
    status: 'live',
    tickets: 847,
    total: 1000,
    earnings: 84.7,
  },
  {
    draw: draws[6],
    status: 'live',
    tickets: 389,
    total: 500,
    earnings: 38.9,
  },
  {
    draw: draws[4],
    status: 'completed',
    tickets: 600,
    total: 600,
    earnings: 60.0,
  },
];

const STATUS_CONFIG = {
  live: { label: 'Live', color: C.PINK, bg: 'rgba(236,72,153,0.1)' },
  completed: { label: 'Completed ✓', color: C.GREEN, bg: 'rgba(16,185,129,0.1)' },
  pending: { label: 'Pending', color: C.GOLD, bg: 'rgba(245,158,11,0.1)' },
};

export function SellerDashboardScreen() {
  const navigation = useNavigation();

  const totalEarnings = DRAW_STATS.reduce((s, d) => s + d.earnings, 0);
  const pendingEarnings = DRAW_STATS.filter(d => d.status === 'live').reduce((s, d) => s + d.earnings, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>My Dashboard</Text>
            <Text style={styles.handle}>@yoniaibi</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Earnings cards */}
        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total earned</Text>
            <Text style={styles.earningsValue}>£{totalEarnings.toFixed(2)}</Text>
            <Text style={styles.earningsCaption}>Since joining</Text>
          </View>
          <View style={[styles.earningsCard, styles.earningsPending]}>
            <Text style={styles.earningsLabel}>Pending</Text>
            <Text style={[styles.earningsValue, styles.earningsPendingValue]}>
              £{pendingEarnings.toFixed(2)}
            </Text>
            <Text style={styles.earningsCaption}>From live draws</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.listBtn}
            onPress={() => (navigation as any).navigate('ListItem')}
            activeOpacity={0.85}
          >
            <Text style={styles.listBtnText}>+ List new item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payoutsBtn}>
            <Text style={styles.payoutsBtnText}>Payouts</Text>
          </TouchableOpacity>
        </View>

        {/* Draw items */}
        <Text style={styles.sectionTitle}>Your draws</Text>
        {DRAW_STATS.map(item => {
          const pct = Math.round((item.tickets / item.total) * 100);
          const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
          return (
            <View key={item.draw.id} style={styles.drawCard}>
              <View style={styles.drawTop}>
                <View style={[styles.drawThumb, { backgroundColor: item.draw.imageColor }]} />
                <View style={styles.drawInfo}>
                  <Text style={styles.drawTitle} numberOfLines={2}>{item.draw.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                <Text style={styles.drawEarnings}>£{item.earnings.toFixed(2)}</Text>
              </View>
              <ProgressBar percent={pct} height={4} />
              <Text style={styles.drawStats}>
                {item.tickets} / {item.total} tickets · {pct}% sold
              </Text>
            </View>
          );
        })}

        {/* Performance tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Seller tips</Text>
          {[
            'Add more photos to increase trust and ticket sales',
            'Closing tonight draws get 3× more entries',
            'Bundles earn 40% more on average',
          ].map((tip, i) => (
            <View key={i} style={styles.tip}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  back: { color: C.GREY, fontSize: 15 },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: C.TEXT },
  handle: { color: C.PURPLE, fontSize: 12 },
  earningsRow: {
    flexDirection: 'row',
    gap: S.md,
    paddingHorizontal: S.xl,
    paddingVertical: S.xl,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  earningsPending: { borderColor: C.GOLD },
  earningsLabel: { color: C.GREY, fontSize: 12, marginBottom: S.xs },
  earningsValue: { color: C.TEXT, fontSize: 26, fontWeight: '800', fontFamily: 'serif' },
  earningsPendingValue: { color: C.GOLD },
  earningsCaption: { color: C.MUTED, fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: S.md, paddingHorizontal: S.xl, marginBottom: S.xl },
  listBtn: {
    flex: 2,
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.md,
    alignItems: 'center',
  },
  listBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 14 },
  payoutsBtn: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingVertical: S.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  payoutsBtnText: { color: C.GREY, fontWeight: '600', fontSize: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.TEXT,
    paddingHorizontal: S.xl,
    marginBottom: S.md,
  },
  drawCard: {
    marginHorizontal: S.xl,
    marginBottom: S.md,
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    gap: S.md,
  },
  drawTop: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  drawThumb: { width: 56, height: 56, borderRadius: 10 },
  drawInfo: { flex: 1, gap: S.xs },
  drawTitle: { color: C.TEXT, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: S.sm, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  drawEarnings: { color: C.GREEN, fontWeight: '800', fontSize: 16 },
  drawStats: { color: C.MUTED, fontSize: 12 },
  tipsCard: {
    marginHorizontal: S.xl,
    marginBottom: S.xxl,
    marginTop: S.md,
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    gap: S.sm,
  },
  tipsTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, marginBottom: S.xs },
  tip: { flexDirection: 'row', gap: S.sm },
  tipBullet: { color: C.PURPLE, fontSize: 14 },
  tipText: { color: C.GREY, fontSize: 13, flex: 1, lineHeight: 18 },
});
