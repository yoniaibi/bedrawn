import { useNavigation } from '@react-navigation/native';
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
import { apiGet } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Transaction {
  id: string;
  type: 'topup' | 'spend' | 'win' | 'refund';
  description: string;
  amountPence: number;
  createdAt: string;
}

const TX_ICONS: Record<string, string> = {
  topup: '+',
  purchase: '-',
  spend: '-',   // legacy alias
  win: '★',
  refund: '↩',
};

export function WalletScreen() {
  const navigation = useNavigation();
  const [balancePence, setBalancePence] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(() => {
    apiGet<{ balancePence: number }>('/wallet/balance')
      .then(d => setBalancePence(d.balancePence))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBalance();
    apiGet<{ transactions: Transaction[] }>('/wallet/transactions')
      .then(d => setTransactions(d.transactions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchBalance]);

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
          <Text style={styles.balanceAmount}>
            {balancePence === null ? '...' : `£${(balancePence / 100).toFixed(2)}`}
          </Text>
        </View>

        {/* Top-up notice */}
        <View style={styles.topUpSection}>
          <Text style={styles.sectionTitle}>Top up</Text>
          <View style={styles.topUpNotice}>
            <Text style={styles.topUpNoticeText}>
              To top up your wallet, visit{'\n'}
              <Text style={styles.topUpLink}>bedrawn.app/account/wallet</Text>
              {'\n'}on your browser.
            </Text>
          </View>
        </View>

        {/* Transaction history */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Transaction history</Text>
          {loading ? (
            <ActivityIndicator color={C.PURPLE} style={{ marginTop: S.xl }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            transactions.map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txIcon}>
                  <Text style={styles.txIconText}>{TX_ICONS[tx.type] ?? '·'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txDate}>{tx.createdAt}</Text>
                </View>
                <Text style={[
                  styles.txAmount,
                  tx.amountPence > 0 ? styles.txAmountCredit : styles.txAmountDebit,
                ]}>
                  {tx.amountPence > 0 ? '+' : ''}£{Math.abs(tx.amountPence / 100).toFixed(2)}
                </Text>
              </View>
            ))
          )}
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
  title: { fontSize: 18, fontWeight: '700', color: C.TEXT },
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
  balanceAmount: { fontSize: 44, fontWeight: '800', color: C.TEXT },
  topUpSection: { paddingHorizontal: S.xl, marginBottom: S.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.md },
  topUpNotice: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
    alignItems: 'center',
  },
  topUpNoticeText: { color: C.GREY, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  topUpLink: { color: C.PURPLE, fontWeight: '700' },
  historySection: { paddingHorizontal: S.xl, marginBottom: S.xxl },
  emptyText: { color: C.MUTED, fontSize: 14, textAlign: 'center', marginTop: S.xl },
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
  txIconText: { fontSize: 18, color: C.TEXT, fontWeight: '700' },
  txInfo: { flex: 1 },
  txDesc: { color: C.TEXT, fontSize: 13 },
  txDate: { color: C.MUTED, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txAmountCredit: { color: C.GREEN },
  txAmountDebit: { color: C.RED },
});
