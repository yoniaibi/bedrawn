import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orders } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const STATUS_CONFIG = {
  won: { label: 'Won 🏆', color: C.GOLD, bg: 'rgba(245,158,11,0.1)' },
  active: { label: 'Active', color: C.PURPLE, bg: 'rgba(139,92,246,0.1)' },
  delivered: { label: 'Delivered ✓', color: C.GREEN, bg: 'rgba(16,185,129,0.1)' },
};

const TABS = ['All', 'Active', 'Won'];

export function OrdersScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All');

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return o.status === 'active';
    if (activeTab === 'Won') return o.status === 'won' || o.status === 'delivered';
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

      {/* Tabs */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {filtered.map(order => {
          const config = STATUS_CONFIG[order.status];
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.cardTop}>
                <View style={[styles.thumbnail, { backgroundColor: order.imageColor }]} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle} numberOfLines={2}>{order.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                  </View>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tickets</Text>
                  <Text style={styles.detailValue}>{order.ticketCount} × {order.ticketPrice}p</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total paid</Text>
                  <Text style={styles.detailValue}>
                    £{((order.ticketCount * order.ticketPrice) / 100).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Retail value</Text>
                  <Text style={[styles.detailValue, styles.detailValueGold]}>
                    £{order.retailValue.toLocaleString()}
                  </Text>
                </View>
                {order.trackingCode && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tracking</Text>
                    <Text style={[styles.detailValue, styles.trackingCode]}>{order.trackingCode}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
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
  title: { fontSize: 17, fontWeight: '700', color: C.WHITE },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    gap: S.sm,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  tabActive: { borderColor: C.PURPLE, backgroundColor: 'rgba(139,92,246,0.15)' },
  tabText: { color: C.GREY, fontSize: 14 },
  tabTextActive: { color: C.PURPLE, fontWeight: '600' },
  content: { padding: S.xl, gap: S.md },
  orderCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    gap: S.md,
    padding: S.lg,
  },
  thumbnail: { width: 72, height: 72, borderRadius: 10 },
  orderInfo: { flex: 1, gap: S.xs },
  orderTitle: { color: C.WHITE, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDate: { color: C.MUTED, fontSize: 12 },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    padding: S.lg,
    gap: S.xs,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: C.GREY, fontSize: 13 },
  detailValue: { color: C.WHITE, fontSize: 13, fontWeight: '600' },
  detailValueGold: { color: C.GOLD },
  trackingCode: { color: C.PURPLE, fontFamily: 'monospace', fontSize: 12 },
});
