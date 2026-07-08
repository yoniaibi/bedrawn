import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PAST_WINNERS } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

export function DrawsHistoryScreen({ navigation }: { navigation: any }) {
  const pastWins = MOCK_PAST_WINNERS as any[];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Draws</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {pastWins.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No past draws yet</Text>
            <Text style={styles.emptySub}>Check back after 9pm tonight</Text>
          </View>
        ) : (
          pastWins.map(item => (
            <View key={item.drawId ?? item.id} style={styles.card}>
              {/* Thumbnail */}
              <View style={[styles.thumb, { backgroundColor: item.imageColor ?? C.CARD2 }]} />

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.drawTitle} numberOfLines={2}>
                  {item.drawTitle ?? `${item.brand} ${item.model}`}
                </Text>
                <Text style={styles.brand}>{item.brand}</Text>
                <Text style={styles.winner}>
                  Won by {item.winnerHandle}
                </Text>
                <Text style={styles.stats}>
                  {item.retailValue != null
                    ? `£${item.retailValue.toLocaleString()} retail · `
                    : ''}
                  {item.ticketPrice}p/ticket
                </Text>

                {/* Verified pill */}
                {(item.resolvedAt ?? item.wonAt) && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>Verified ✓</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.TEXT },
  list: { padding: S.xl, gap: S.md },
  card: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    flexShrink: 0,
  },
  info: { flex: 1, gap: S.xs },
  drawTitle: { color: C.TEXT, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  brand: { color: C.LILAC, fontSize: 11, fontWeight: '500' },
  winner: { color: C.MUTED, fontSize: 12 },
  stats: { color: C.GREY, fontSize: 11 },
  verifiedPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(5,150,105,0.10)',
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  verifiedText: { color: C.GREEN, fontSize: 11, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: S.sm },
  emptyTitle: { color: C.TEXT, fontWeight: '700', fontSize: 16 },
  emptySub: { color: C.MUTED, fontSize: 14 },
});
