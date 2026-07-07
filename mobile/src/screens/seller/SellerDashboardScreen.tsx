import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface DrawStat {
  drawId?: string;
  id?: string;  // API returns 'id', we normalise below
  title: string;
  status: string; // API: 'open'|'resolved'|'cancelled'; we map to display label
  soldTickets: number;
  totalTickets: number;
  earningsPence?: number;
  sellerRevenuePence?: number; // API returns this name
}

interface SellerStats {
  totalEarningsPence: number;
  pendingEarningsPence?: number;
  pendingPayoutPence?: number; // API returns this name
  draws: DrawStat[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Live', color: C.PINK, bg: 'rgba(255,35,86,0.08)' },
  live: { label: 'Live', color: C.PINK, bg: 'rgba(255,35,86,0.08)' },
  resolved: { label: 'Completed ✓', color: C.GREEN, bg: 'rgba(74,222,128,0.10)' },
  completed: { label: 'Completed ✓', color: C.GREEN, bg: 'rgba(74,222,128,0.10)' },
  cancelled: { label: 'Cancelled', color: C.MUTED, bg: C.CARD2 },
  pending: { label: 'Pending', color: C.GOLD, bg: 'rgba(252,211,77,0.10)' },
};

export function SellerDashboardScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<SellerStats>('/seller/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          </View>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.PURPLE} />
          </View>
        ) : (
          <>
            {/* Earnings cards */}
            <View style={styles.earningsRow}>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Total earned</Text>
                <Text style={styles.earningsValue}>
                  £{stats ? (stats.totalEarningsPence / 100).toFixed(2) : '0.00'}
                </Text>
                <Text style={styles.earningsCaption}>Since joining</Text>
              </View>
              <View style={[styles.earningsCard, styles.earningsPending]}>
                <Text style={styles.earningsLabel}>Pending</Text>
                <Text style={[styles.earningsValue, styles.earningsPendingValue]}>
                  £{stats ? ((stats.pendingEarningsPence ?? stats.pendingPayoutPence ?? 0) / 100).toFixed(2) : '0.00'}
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
            {stats && stats.draws.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your draws</Text>
                {stats.draws.map(item => {
                  const pct = Math.round((item.soldTickets / item.totalTickets) * 100);
                  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
                  return (
                    <View key={item.drawId ?? item.id} style={styles.drawCard}>
                      <View style={styles.drawTop}>
                        <View style={styles.drawThumb} />
                        <View style={styles.drawInfo}>
                          <Text style={styles.drawTitle} numberOfLines={2}>{item.title}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.drawEarnings}>
                          £{((item.earningsPence ?? item.sellerRevenuePence ?? 0) / 100).toFixed(2)}
                        </Text>
                      </View>
                      <ProgressBar percent={pct} height={4} />
                      <Text style={styles.drawStats}>
                        {item.soldTickets} / {item.totalTickets} tickets · {pct}% sold
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* Performance tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Seller tips</Text>
              {[
                'Add more photos to increase trust and ticket sales',
                'Draws drawing tonight get 3× more entries',
                'Bundles earn 40% more on average',
              ].map((tip, i) => (
                <View key={i} style={styles.tip}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
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
  center: { padding: S.xxl, alignItems: 'center' },
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
  earningsValue: { color: C.TEXT, fontSize: 26, fontWeight: '800' },
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
  drawThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: C.CARD2 },
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
