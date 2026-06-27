import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawCard } from '../../components/DrawCard';
import { draws } from '../../data/mockData';
import { HomeStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const FILTERS = ['All', 'Tonight', 'Bundles', 'High Value', 'Just Listed'];
const CATEGORIES = [
  { label: 'Fashion' },
  { label: 'Watches' },
  { label: 'Trainers' },
  { label: 'Bags' },
  { label: 'Luxury' },
  { label: 'Streetwear' },
];
const TRENDING = ['Chanel', 'Rolex', 'Jordan 1', 'Supreme', 'Louis Vuitton', 'Off-White'];
const RECENT_SEARCHES = ['Vintage Levi\'s', 'AP Royal Oak', 'Prada bag'];

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const filteredDraws = draws.filter(draw => {
    if (!query) return false;
    const q = query.toLowerCase();
    return (
      draw.title.toLowerCase().includes(q) ||
      draw.seller.toLowerCase().includes(q) ||
      draw.category.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search draws, brands, sellers…"
          placeholderTextColor={C.MUTED}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {query.length === 0 ? (
          <View style={styles.emptyStateContent}>
            {/* Browse categories */}
            <Text style={styles.sectionTitle}>Browse categories</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.label} style={styles.categoryCard}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending */}
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.trendingRow}>
              {TRENDING.map(term => (
                <TouchableOpacity
                  key={term}
                  style={styles.trendingChip}
                  onPress={() => setQuery(term)}
                >
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent searches */}
            <Text style={styles.sectionTitle}>Recent searches</Text>
            {RECENT_SEARCHES.map(term => (
              <TouchableOpacity
                key={term}
                style={styles.recentRow}
                onPress={() => setQuery(term)}
              >
                <Text style={styles.recentIcon}>↺</Text>
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsLabel}>
              {filteredDraws.length} result{filteredDraws.length !== 1 ? 's' : ''} for "{query}"
            </Text>
            <View style={styles.resultsGrid}>
              {filteredDraws.map(draw => (
                <DrawCard
                  key={draw.id}
                  draw={draw}
                  onPress={() => navigation.navigate('DrawDetail', { draw })}
                />
              ))}
              {filteredDraws.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No draws found</Text>
                  <Text style={styles.noResultsSub}>Try a different search term</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  searchIcon: { fontSize: 18, color: C.GREY },
  searchInput: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    color: C.TEXT,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  clearBtn: { color: C.MUTED, fontSize: 16, padding: 4 },
  cancelBtn: { paddingLeft: S.sm },
  cancelText: { color: C.PURPLE, fontSize: 14, fontWeight: '600' },
  filterRow: { paddingHorizontal: S.xl, paddingVertical: S.md, gap: S.sm },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderWidth: 1,
    borderColor: C.BORDER,
    backgroundColor: C.CARD,
  },
  filterChipActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  filterText: { color: C.GREY, fontSize: 13 },
  filterTextActive: { color: C.PURPLE, fontWeight: '600' },
  emptyStateContent: { padding: S.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.md, marginTop: S.lg },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.sm },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: C.CARD,
    borderRadius: 10,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  categoryLabel: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  trendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  trendingChip: {
    backgroundColor: C.CARD2,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  trendingText: { color: C.TEXT, fontSize: 13 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  recentIcon: { fontSize: 16, color: C.MUTED },
  recentText: { color: C.GREY, fontSize: 14 },
  resultsSection: { padding: S.xl },
  resultsLabel: { color: C.GREY, fontSize: 13, marginBottom: S.lg },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  noResults: { width: '100%', alignItems: 'center', paddingTop: S.xxxl },
  noResultsText: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: S.sm },
  noResultsSub: { color: C.GREY, fontSize: 14 },
});
