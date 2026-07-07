import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet, apiPost } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = {
  route: { params: { draw: any } };
  navigation: any;
};

const QUICK_QTYS = [1, 5, 10, 25];

function formatPrice(pence: number): string {
  return pence >= 100 ? `£${(pence / 100).toFixed(2)}` : `${pence}p`;
}

export function PurchaseScreen({ route, navigation }: Props) {
  const { draw } = route.params;
  const [qty, setQty] = useState(1);
  const [inputVal, setInputVal] = useState('1');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ balancePence: number }>('/wallet/balance')
      .then(d => setWalletBalance(d.balancePence))
      .catch(() => {});
  }, []);

  const totalPence = qty * draw.ticketPrice;
  const balancePence = walletBalance ?? 0;
  const hasSufficientBalance = walletBalance !== null && balancePence >= totalPence;

  const handleQtyInput = (text: string) => {
    setInputVal(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n > 0) setQty(n);
  };

  const handleQuickQty = (n: number) => {
    setQty(n);
    setInputVal(String(n));
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPost(`/draws/${draw.id}/enter`, { ticketCount: qty });
      navigation.navigate('PurchaseSuccess', {
        draw,
        ticketCount: qty,
        totalPence,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Purchase failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    Linking.openURL('https://www.bedrawn.app/account/wallet');
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
          <View style={[styles.drawThumb, { backgroundColor: draw.imageColor ?? C.CARD2 }]} />
          <View style={styles.drawInfo}>
            <Text style={styles.drawTitle} numberOfLines={2}>{draw.title}</Text>
            <Text style={styles.drawSeller}>{draw.seller}</Text>
            <Text style={styles.drawPrice}>{formatPrice(draw.ticketPrice)} per ticket · £{draw.retailValue?.toLocaleString()} RRP</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Trust reassurance */}
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>{draw.isClosingTonight ? 'Drawing tonight at 9pm' : draw.closingDate ? `Draws ${draw.closingDate} at 9pm` : 'Open until reserve is met'} · Full refund if draw doesn&apos;t reach reserve · Free postal entry available</Text>
        </View>

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
            <Text style={styles.totalValue}>{formatPrice(totalPence)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <Text style={[styles.balanceValue, hasSufficientBalance ? styles.balanceOk : styles.balanceLow]}>
              {walletBalance === null ? '…' : formatPrice(balancePence)}
            </Text>
          </View>
          {walletBalance !== null && !hasSufficientBalance && (
            <Text style={styles.insufficientText}>
              Need {formatPrice(totalPence - balancePence)} more — tap below to top up
            </Text>
          )}
        </View>

        {/* Odds preview */}
        <View style={styles.oddsCard}>
          <View style={styles.oddsInfo}>
            <Text style={styles.oddsTitle}>Your odds</Text>
            <Text style={styles.oddsValue}>
              1 in {Math.round(draw.totalTickets / (draw.soldTickets + qty))} · {((qty / draw.totalTickets) * 100).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fine print */}
        <Text style={styles.finePrint}>
          By confirming, you agree to bedrawn&apos;s Terms of Service. No refunds after purchase unless the draw is cancelled. Postal entry available — see T&Cs.
        </Text>
      </ScrollView>

      {/* Sticky confirm / top up button */}
      <View style={styles.stickyBottom}>
        {hasSufficientBalance ? (
          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.WHITE} />
              : <Text style={styles.confirmBtnText}>Confirm · {formatPrice(totalPence)} for {qty} ticket{qty !== 1 ? 's' : ''}</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.confirmBtn, styles.topUpBtn]} onPress={handleTopUp} activeOpacity={0.85}>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.TEXT },
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
  drawTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  drawSeller: { color: C.GREY, fontSize: 12 },
  drawPrice: { color: C.PURPLE, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.BORDER, marginBottom: S.md },
  trustRow: { marginBottom: S.xl },
  trustText: { color: C.MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center' },
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
  qtyPillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
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
  manualBtnText: { color: C.TEXT, fontSize: 22, fontWeight: '300' },
  manualInput: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.PURPLE,
    color: C.TEXT,
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
  totalValue: { color: C.TEXT, fontSize: 20, fontWeight: '800' },
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
  oddsInfo: {},
  oddsTitle: { color: C.GREY, fontSize: 12 },
  oddsValue: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.RED,
    padding: S.md,
    marginBottom: S.lg,
  },
  errorText: { color: C.RED, fontSize: 13 },
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
  confirmBtnDisabled: { opacity: 0.6 },
  topUpBtn: { backgroundColor: C.GREEN },
  confirmBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
});
