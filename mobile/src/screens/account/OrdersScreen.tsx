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
import { apiGet } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Entry {
  drawId: string;
  drawTitle: string;
  drawImageUrl: string;
  ticketCount: number;
  ticketPricePence: number;
  enteredAt: string;
  closingDate: string;
  status: string;
  isWinner: boolean;
}

const TABS = ['All', 'Active', 'Won'];

const entryLabel = (e: Entry): { label: string; color: string; bg: string } => {
  if (e.isWinner) return { label: 'Won', color: C.GOLD, bg: C.GOLD_LIGHT };
  if (e.status === 'open') return { label: 'Active', color: C.PURPLE, bg: C.PURPLE_LIGHT };
  return { label: 'Completed', color: C.GREY, bg: C.CARD2 };
};

export function OrdersScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    apiGet<{ entries: Entry[] }>('/me/entries')
      .then(data => setEntries(data.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return e.status === 'open' && !e.isWinner;
    if (activeTab === 'Won') return e.isWinner;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.PURPLE} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No orders</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Won' ? 'No wins yet — keep entering!' : 'Enter a draw to see your orders here'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {filtered.map(entry => {
            const badge = entryLabel(entry);
            const total = entry.ticketCount * entry.ticketPricePence;
            return (
              <View key={entry.drawId} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.thumbnail, { backgroundColor: C.CARD2 }]}>
                    <Text style={{ color: C.MUTED, fontSize: 20 }}>◻</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={2}>{entry.drawTitle}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <Text style={styles.orderDate}>{entry.closingDate}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tickets</Text>
                    <Text style={styles.detailValue}>{entry.ticketCount}</Text>
                  </View>
                  {total > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total paid</Text>
                      <Text style={styles.detailValue}>£{(total / 100).toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.xl, paddingVertical: S.lg,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  back: { color: C.GREY, fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: C.TEXT },
  tabs: { flexDirection: 'row', paddingHorizontal: S.xl, paddingVertical: S.md, gap: S.sm },
  tab: { borderRadius: 999, paddingHorizontal: S.lg, paddingVertical: S.sm, borderWidth: 1, borderColor: C.BORDER },
  tabActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  tabText: { color: C.GREY, fontSize: 14 },
  tabTextActive: { color: C.PURPLE, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.TEXT, marginBottom: S.sm },
  emptySubtitle: { fontSize: 14, color: C.GREY, textAlign: 'center' },
  content: { padding: S.xl, gap: S.md },
  card: { backgroundColor: C.CARD, borderRadius: 14, borderWidth: 1, borderColor: C.BORDER, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', gap: S.md, padding: S.lg },
  thumbnail: { width: 64, height: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1, gap: S.xs },
  orderTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: S.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  orderDate: { color: C.MUTED, fontSize: 12 },
  cardDetails: { borderTopWidth: 1, borderTopColor: C.BORDER, padding: S.lg, gap: S.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: C.GREY, fontSize: 13 },
  detailValue: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
});
