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
import { currentUser, walletTransactions } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const TOP_UP_OPTIONS = [500, 1000, 2000, 5000]; // pence

type FlashState = { amount: number; visible: boolean };

const TX_ICONS: Record<string, string> = {
  topup: '💳',
  spend: '🎫',
  win: '🏆',
  refund: '↩️',
};

export function WalletScreen() {
  const navigation = useNavigation();
  const [balance, setBalance] = useState(currentUser.balance);
  const [flash, setFlash] = useState<FlashState>({ amount: 0, visible: false });

  const handleTopUp = (pence: number) => {
    setBalance(prev => prev + pence);
    setFlash({ amount: pence, visible: true });
    setTimeout(() => setFlash({ amount: 0, visible: false }), 2000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Wallet</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>£{(balance / 100).toFixed(2)}</Text>
          {flash.visible && (
            <View style={styles.flashBadge}>
              <Text style={styles.flashText}>+£{(flash.amount / 100).toFixed(2)} added ✓</Text>
            </View>
          )}
        </View>

        {/* Top-up grid */}
        <View style={styles.topUpSection}>
          <Text style={styles.sectionTitle}>Top up</Text>
          <View style={styles.topUpGrid}>
            {TOP_UP_OPTIONS.map(pence => (
              <TouchableOpacity
                key={pence}
                style={styles.topUpCard}
                onPress={() => handleTopUp(pence)}
                activeOpacity={0.8}
              >
                <Text style={styles.topUpAmount}>£{(pence / 100).toFixed(0)}</Text>
                <Text style={styles.topUpSub}>{pence / 10} tickets</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction history */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Transaction history</Text>
          {walletTransactions.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}>
                <Text style={styles.txIconText}>{TX_ICONS[tx.type]}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                tx.amount > 0 ? styles.txAmountCredit : styles.txAmountDebit
              ]}>
                {tx.amount > 0 ? '+' : ''}£{Math.abs(tx.amount / 100).toFixed(2)}
              </Text>
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
  },
  back: { color: C.GREY, fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: C.WHITE },
  balanceCard: {
    marginHorizontal: S.xl,
    backgroundColor: C.CARD2,
    borderRadius: 20,
    padding: S.xxl,
    alignItems: 'center',
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  balanceLabel: { color: C.GREY, fontSize: 13, marginBottom: S.sm },
  balanceAmount: { fontSize: 44, fontWeight: '800', color: C.WHITE, fontFamily: 'serif' },
  flashBadge: {
    marginTop: S.md,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: C.GREEN,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
  },
  flashText: { color: C.GREEN, fontWeight: '700', fontSize: 13 },
  topUpSection: { paddingHorizontal: S.xl, marginBottom: S.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.WHITE, marginBottom: S.md },
  topUpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  topUpCard: {
    width: '47%',
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  topUpAmount: { fontSize: 24, fontWeight: '800', color: C.WHITE },
  topUpSub: { color: C.GREY, fontSize: 12, marginTop: 2 },
  historySection: { paddingHorizontal: S.xl, marginBottom: S.xxl },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.CARD2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txDesc: { color: C.WHITE, fontSize: 13 },
  txDate: { color: C.MUTED, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txAmountCredit: { color: C.GREEN },
  txAmountDebit: { color: C.RED },
});
