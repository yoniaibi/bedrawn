import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityTicker } from '../../components/ActivityTicker';
import { activityMessages, currentUser } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = {
  route: { params: { draw: any } };
  navigation: any;
};

const QUICK_QTYS = [1, 5, 10, 25];

export function PurchaseScreen({ route, navigation }: Props) {
  const { draw } = route.params;
  const [qty, setQty] = useState(1);
  const [inputVal, setInputVal] = useState('1');

  const totalPence = qty * draw.ticketPrice;
  const totalPounds = (totalPence / 100).toFixed(2);
  const balancePence = currentUser.balance;
  const balancePounds = (balancePence / 100).toFixed(2);
  const hasSufficientBalance = balancePence >= totalPence;

  const handleQtyInput = (text: string) => {
    setInputVal(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n > 0) setQty(n);
  };

  const handleQuickQty = (n: number) => {
    setQty(n);
    setInputVal(String(n));
  };

  const handleConfirm = () => {
    navigation.navigate('PurchaseSuccess', {
      draw,
      ticketCount: qty,
      totalPence,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter draw</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Draw summary */}
        <View style={styles.drawSummary}>
          <View style={[styles.drawThumb, { backgroundColor: draw.imageColor }]} />
          <View style={styles.drawInfo}>
            <Text style={styles.drawTitle} numberOfLines={2}>{draw.title}</Text>
            <Text style={styles.drawSeller}>{draw.sellerEmoji} {draw.seller}</Text>
            <Text style={styles.drawPrice}>{draw.ticketPrice}p per ticket · £{draw.retailValue.toLocaleString()} RRP</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Qty section */}
        <Text style={styles.sectionLabel}>How many tickets?</Text>

        {/* Quick qty pills */}
        <View style={styles.quickQtyRow}>
          {QUICK_QTYS.map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.qtyPill, qty === n && styles.qtyPillActive]}
              onPress={() => handleQuickQty(n)}
            >
              <Text style={[styles.qtyPillText, qty === n && styles.qtyPillTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual input */}
        <View style={styles.manualInputRow}>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => {
              const n = Math.max(1, qty - 1);
              setQty(n);
              setInputVal(String(n));
            }}
          >
            <Text style={styles.manualBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.manualInput}
            value={inputVal}
            onChangeText={handleQtyInput}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => {
              const n = qty + 1;
              setQty(n);
              setInputVal(String(n));
            }}
          >
            <Text style={styles.manualBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{qty} ticket{qty !== 1 ? 's' : ''}</Text>
            <Text style={styles.totalValue}>£{totalPounds}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <Text style={[styles.balanceValue, hasSufficientBalance ? styles.balanceOk : styles.balanceLow]}>
              £{balancePounds}
            </Text>
          </View>
          {!hasSufficientBalance && (
            <Text style={styles.insufficientText}>
              ⚠️ Insufficient balance · Top up needed: £{((totalPence - balancePence) / 100).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Odds preview */}
        <View style={styles.oddsCard}>
          <Text style={styles.oddsIcon}>🎯</Text>
          <View style={styles.oddsInfo}>
            <Text style={styles.oddsTitle}>Your odds</Text>
            <Text style={styles.oddsValue}>
              1 in {Math.round(draw.totalTickets / (draw.soldTickets + qty))} · {((qty / draw.totalTickets) * 100).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Activity ticker */}
        <ActivityTicker messages={activityMessages} />

        {/* Fine print */}
        <Text style={styles.finePrint}>
          By confirming, you agree to DRAWN's Terms of Service. Draw closes tonight at 9pm. No refunds after purchase. Postal entry available — see T&Cs.
        </Text>
      </ScrollView>

      {/* Sticky confirm button */}
      <View style={styles.stickyBottom}>
        {hasSufficientBalance ? (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              Confirm · £{totalPounds} for {qty} ticket{qty !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.confirmBtn, styles.topUpBtn]}>
            <Text style={styles.confirmBtnText}>Top up wallet →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  scrollContent: { padding: S.xl, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.xl,
  },
  back: { color: C.GREY, fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.WHITE },
  drawSummary: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  drawThumb: { width: 72, height: 72, borderRadius: 10 },
  drawInfo: { flex: 1, gap: S.xs },
  drawTitle: { color: C.WHITE, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  drawSeller: { color: C.GREY, fontSize: 12 },
  drawPrice: { color: C.PURPLE, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.BORDER, marginBottom: S.xl },
  sectionLabel: { color: C.GREY, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: S.md },
  quickQtyRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.xl },
  qtyPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: S.md,
    alignItems: 'center',
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  qtyPillActive: { borderColor: C.PURPLE, backgroundColor: 'rgba(139,92,246,0.2)' },
  qtyPillText: { color: C.GREY, fontSize: 16, fontWeight: '700' },
  qtyPillTextActive: { color: C.PURPLE },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginBottom: S.xl,
  },
  manualBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  manualBtnText: { color: C.WHITE, fontSize: 22, fontWeight: '300' },
  manualInput: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.PURPLE,
    color: C.WHITE,
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: S.sm,
    height: 56,
  },
  totalCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    marginBottom: S.lg,
    gap: S.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: C.GREY, fontSize: 14 },
  totalValue: { color: C.WHITE, fontSize: 20, fontWeight: '800' },
  balanceLabel: { color: C.GREY, fontSize: 14 },
  balanceValue: { fontSize: 16, fontWeight: '700' },
  balanceOk: { color: C.GREEN },
  balanceLow: { color: C.RED },
  insufficientText: { color: C.RED, fontSize: 12, marginTop: S.xs },
  oddsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.CARD2,
    borderRadius: 12,
    padding: S.md,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  oddsIcon: { fontSize: 24 },
  oddsInfo: {},
  oddsTitle: { color: C.GREY, fontSize: 12 },
  oddsValue: { color: C.WHITE, fontWeight: '700', fontSize: 14 },
  finePrint: { color: C.MUTED, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: S.lg },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.BG,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    padding: S.xl,
    paddingBottom: S.xxl,
  },
  confirmBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  topUpBtn: { backgroundColor: C.GREEN },
  confirmBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
});
