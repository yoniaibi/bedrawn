import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGetPublic } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface DrawResult {
  drawId: string;
  title: string;
  seller: string;
  ticketPricePence: number;
  retailValuePence: number;
  soldTickets: number;
  totalTickets: number;
}

const FILTERS = ['All', 'Tonight', 'Bundles', 'High Value', 'Just Listed'];
const CATEGORIES = ['Fashion', 'Watches', 'Trainers', 'Bags', 'Luxury', 'Streetwear'];
const TRENDING = ['Chanel', 'Rolex', 'Jordan 1', 'Supreme', 'Louis Vuitton', 'Off-White'];
const RECENT_SEARCHES = ["Vintage Levi's", 'AP Royal Oak', 'Prada bag'];

export function SearchScreen() {
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState<DrawResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const fetchResults = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    apiGetPublic<{ draws: DrawResult[] }>(`/draws?q=${encodeURIComponent(q)}`)
      .then(d => setResults(d.draws ?? []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(text), 350);
  };

  const handleTermPress = (term: string) => {
    setQuery(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchResults(term);
  };

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
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
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
            <Text style={styles.sectionTitle}>Browse categories</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={styles.categoryCard} onPress={() => handleTermPress(cat)}>
                  <Text style={styles.categoryLabel}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.trendingRow}>
              {TRENDING.map(term => (
                <TouchableOpacity key={term} style={styles.trendingChip} onPress={() => handleTermPress(term)}>
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent searches</Text>
            {RECENT_SEARCHES.map(term => (
              <TouchableOpacity key={term} style={styles.recentRow} onPress={() => handleTermPress(term)}>
                <Text style={styles.recentIcon}>↺</Text>
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.PURPLE} />
            <Text style={styles.searchingText}>Searching…</Text>
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsLabel}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </Text>
            {results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No draws found</Text>
                <Text style={styles.noResultsSub}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.resultsGrid}>
                {results.map(draw => {
                  const percent = Math.round((draw.soldTickets / draw.totalTickets) * 100);
                  return (
                    <View key={draw.drawId} style={styles.resultCard}>
                      <View style={styles.resultImagePlaceholder}>
                        <Text style={styles.resultImageText}>◻</Text>
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle} numberOfLines={2}>{draw.title}</Text>
                        <Text style={styles.resultSeller}>{draw.seller}</Text>
                        <View style={styles.pricePill}>
                          <Text style={styles.priceText}>
                            {draw.ticketPricePence}p → £{(draw.retailValuePence / 100).toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.percentText}>{percent}% sold</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
  center: { alignItems: 'center', paddingTop: S.xxl, gap: S.md },
  searchingText: { color: C.GREY, fontSize: 14 },
  emptyStateContent: { padding: S.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.md, marginTop: S.lg },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.sm },
  categoryCard: {
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
  resultCard: {
    width: '48%',
    backgroundColor: C.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
    marginBottom: S.md,
  },
  resultImagePlaceholder: {
    height: 100,
    backgroundColor: C.CARD2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImageText: { fontSize: 28, color: C.MUTED },
  resultContent: { padding: S.md, gap: 4 },
  resultTitle: { fontSize: 13, fontWeight: '700', color: C.TEXT, lineHeight: 18 },
  resultSeller: { fontSize: 11, color: C.GREY },
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
  percentText: { fontSize: 10, color: C.MUTED },
  noResults: { alignItems: 'center', paddingTop: S.xxl },
  noResultsText: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: S.sm },
  noResultsSub: { color: C.GREY, fontSize: 14 },
});
