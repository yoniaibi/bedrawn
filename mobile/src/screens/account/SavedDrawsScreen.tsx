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

interface SavedDraw {
  drawId: string;
  title: string;
  imageUrl?: string;
  ticketPricePence: number;
  retailValuePence: number;
  soldTickets: number;
  totalTickets: number;
  closingDate: string;
}

export function SavedDrawsScreen() {
  const navigation = useNavigation();
  const [draws, setDraws] = useState<SavedDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ draws: SavedDraw[] }>('/me/saved')
      .then(d => setDraws(d.draws ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          Saved Draws{loading ? '' : ` (${draws.length})`}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.PURPLE} />
        </View>
      ) : draws.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No saved draws yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the ☆ on any draw card to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {draws.map(draw => {
              const percent = Math.round((draw.soldTickets / draw.totalTickets) * 100);
              return (
                <View key={draw.drawId} style={styles.card}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>◻</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.drawTitle} numberOfLines={2}>{draw.title}</Text>
                    <View style={styles.pricePill}>
                      <Text style={styles.priceText}>
                        {draw.ticketPricePence}p → £{(draw.retailValuePence / 100).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
                    </View>
                    <Text style={styles.progressLabel}>{percent}% sold</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
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
  title: { fontSize: 17, fontWeight: '700', color: C.TEXT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.TEXT, marginBottom: S.sm },
  emptySubtitle: { fontSize: 14, color: C.GREY, textAlign: 'center' },
  content: { padding: S.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: C.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
    marginBottom: S.md,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: C.CARD2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 32, color: C.MUTED },
  cardContent: { padding: S.md, gap: S.xs },
  drawTitle: { fontSize: 13, fontWeight: '700', color: C.TEXT, lineHeight: 18 },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: C.PURPLE_LIGHT,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  priceText: { fontSize: 11, fontWeight: '600', color: C.PURPLE },
  progressBar: {
    height: 3,
    backgroundColor: C.BORDER,
    borderRadius: 2,
    marginTop: S.xs,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: C.PURPLE, borderRadius: 2 },
  progressLabel: { fontSize: 10, color: C.MUTED },
});
