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
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const CATEGORIES = [
  {
    label: 'Bags',
    description: 'Chanel, LV, Prada, Bottega & more',
    accent: '#F472B6',
    drawCount: 24,
  },
  {
    label: 'Watches',
    description: 'Rolex, AP, Omega, Cartier',
    accent: '#FCD34D',
    drawCount: 11,
  },
  {
    label: 'Trainers',
    description: 'Nike, Jordan, Adidas, New Balance',
    accent: '#C4B5FD',
    drawCount: 31,
  },
  {
    label: 'Fashion',
    description: 'Designer clothing & accessories',
    accent: '#F472B6',
    drawCount: 18,
  },
  {
    label: 'Streetwear',
    description: 'Supreme, Palace, Off-White & more',
    accent: '#3B82F6',
    drawCount: 15,
  },
  {
    label: 'Luxury',
    description: 'Ultra-premium, high-value items',
    accent: '#FCD34D',
    drawCount: 7,
  },
  {
    label: 'Jewellery',
    description: 'Fine and fashion jewellery',
    accent: '#A78BFA',
    drawCount: 9,
  },
  {
    label: 'Vintage',
    description: 'Archive, vintage & rare pieces',
    accent: '#C49A3C',
    drawCount: 13,
  },
];

const COMING_SOON = [
  { label: 'Art & Prints' },
  { label: 'Tech' },
  { label: 'Homeware' },
];

export function CategoriesScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Browse by category</Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.label} style={styles.categoryCard} activeOpacity={0.8}>
              <View style={[styles.accentBar, { backgroundColor: cat.accent }]} />
              <View style={styles.categoryContent}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.label}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{cat.drawCount}</Text>
                  <Text style={styles.countLabel}>draws</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming soon */}
        <Text style={[styles.sectionLabel, { marginTop: S.xl }]}>Coming soon</Text>
        <View style={styles.comingSoonRow}>
          {COMING_SOON.map(cat => (
            <View key={cat.label} style={styles.comingSoonCard}>
              <Text style={styles.comingSoonLabel}>{cat.label}</Text>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </View>
          ))}
        </View>

        {/* Suggest card */}
        <View style={styles.suggestCard}>
          <Text style={styles.suggestTitle}>Don't see your category?</Text>
          <Text style={styles.suggestText}>
            We add new categories based on community demand. Let us know what you'd like to see!
          </Text>
          <TouchableOpacity style={styles.suggestBtn}>
            <Text style={styles.suggestBtnText}>Suggest a category →</Text>
          </TouchableOpacity>
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
  title: { fontSize: 17, fontWeight: '700', color: C.TEXT },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.GREY, letterSpacing: 0.5, marginBottom: S.md },
  categoryGrid: { gap: S.md },
  categoryCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 4 },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: S.lg,
    gap: S.md,
  },
  categoryInfo: { flex: 1 },
  categoryName: { color: C.TEXT, fontWeight: '700', fontSize: 15 },
  categoryDesc: { color: C.GREY, fontSize: 12, marginTop: 2 },
  countBadge: { alignItems: 'center' },
  countText: { color: C.TEXT, fontWeight: '800', fontSize: 18 },
  countLabel: { color: C.MUTED, fontSize: 10 },
  comingSoonRow: { flexDirection: 'row', gap: S.md },
  comingSoonCard: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    alignItems: 'center',
    opacity: 0.5,
    gap: S.xs,
  },
  comingSoonLabel: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  comingSoonBadge: {
    backgroundColor: C.CARD2,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    fontSize: 10,
    color: C.MUTED,
    overflow: 'hidden',
  },
  suggestCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.PURPLE,
    padding: S.lg,
    marginTop: S.xl,
    gap: S.sm,
  },
  suggestTitle: { color: C.TEXT, fontWeight: '700', fontSize: 15 },
  suggestText: { color: C.GREY, fontSize: 13, lineHeight: 18 },
  suggestBtn: { alignSelf: 'flex-start' },
  suggestBtnText: { color: C.PURPLE, fontWeight: '600', fontSize: 13 },
});
