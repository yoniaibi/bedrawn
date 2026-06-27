import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityTicker } from '../../components/ActivityTicker';
import { DrawCard } from '../../components/DrawCard';
import { LiveDot } from '../../components/LiveDot';
import { ProgressBar } from '../../components/ProgressBar';
import { activityMessages, currentUser, draws } from '../../data/mockData';
import { HomeStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const CATEGORIES = [
  { label: 'Fashion' },
  { label: 'Watches' },
  { label: 'Trainers' },
  { label: 'Bags' },
  { label: 'Luxury' },
  { label: 'Streetwear' },
];

const FILTERS = ['Tonight', 'Womenswear', 'Menswear', 'High Value', 'Bundles', 'Just Listed'];

const womenswear = draws.filter(d => d.style === 'Womenswear' || d.category === 'Bags').slice(0, 4);
const menswear = draws.filter(d => d.style === 'Menswear' || d.category === 'Streetwear').slice(0, 4);
const unisex = draws.filter(d => d.style === 'Unisex').slice(0, 4);
const heroDrawItem = draws[0];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState('Tonight');
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentUser.streak >= 2) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(streakScale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(streakScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [streakScale]);

  const goToDetail = (draw: typeof draws[0]) => {
    navigation.navigate('DrawDetail', { draw });
  };

  const balancePounds = (currentUser.balance / 100).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* NavBar */}
        <View style={styles.navbar}>
          <Text style={styles.logo}>DRAWN</Text>
          <View style={styles.navRight}>
            <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakScale }] }]}>
              <Text style={styles.streakText}>{currentUser.streak} day streak</Text>
            </Animated.View>
            <TouchableOpacity
              style={styles.walletPill}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.searchIcon}>Search</Text>
            </TouchableOpacity>
            <View style={styles.walletPill}>
              <Text style={styles.walletText}>£{balancePounds}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ActivityTicker messages={activityMessages} />
        </View>

        {/* Won Banner */}
        <TouchableOpacity style={styles.wonBanner} activeOpacity={0.85}>
          <Text style={styles.wonText}>You won! Air Jordan 1 Retro High OG</Text>
          <Text style={styles.wonSub}>Tap to view your order →</Text>
        </TouchableOpacity>

        {/* Hero draw */}
        <View style={styles.section}>
          <View style={styles.heroCard}>
            <View style={[styles.heroImage, { backgroundColor: heroDrawItem.imageColor }]}>
              <View style={styles.closingPill}>
                <LiveDot />
                <Text style={styles.closingText}>CLOSING TONIGHT · 9PM</Text>
              </View>
              <View style={styles.watchingRow}>
                <Text style={styles.watchingText}>247 watching</Text>
              </View>
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{heroDrawItem.title}</Text>
              <Text style={styles.heroSeller}>{heroDrawItem.seller}</Text>
              <View style={styles.heroRow}>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>
                    {heroDrawItem.ticketPrice}p → £{heroDrawItem.retailValue.toLocaleString()}
                  </Text>
                </View>
              </View>
              <ProgressBar percent={67} height={5} />
              <Text style={styles.heroPercent}>67% sold · 330 tickets left</Text>
              <TouchableOpacity
                style={styles.enterBtn}
                onPress={() => goToDetail(heroDrawItem)}
                activeOpacity={0.85}
              >
                <Text style={styles.enterBtnText}>Enter draw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent winner */}
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>
            <Text style={styles.winnerHandle}>@sarah_j</Text> just won Air Jordan 1 · paid 50p · worth{' '}
            <Text style={styles.winnerValue}>£185</Text>
          </Text>
        </View>

        {/* Tonight strip */}
        <View style={styles.tonightStrip}>
          <View style={styles.tonightLeft}>
            <LiveDot />
            <Text style={styles.tonightText}>8 draws tonight at 9pm · you're in 3</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.tonightLink}>Watch live →</Text>
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          style={styles.section}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.label} style={styles.catPill}>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Curated row: Womenswear */}
        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>Womenswear & Accessories</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCards}
          >
            {womenswear.map(draw => (
              <View key={draw.id} style={styles.horizontalCardWrapper}>
                <DrawCard draw={draw} onPress={() => goToDetail(draw)} fullWidth />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Curated row: Menswear */}
        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>Menswear & Streetwear</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCards}
          >
            {menswear.map(draw => (
              <View key={draw.id} style={styles.horizontalCardWrapper}>
                <DrawCard draw={draw} onPress={() => goToDetail(draw)} fullWidth />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Curated row: Unisex */}
        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>Unisex & Everything Else</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCards}
          >
            {unisex.map(draw => (
              <View key={draw.id} style={styles.horizontalCardWrapper}>
                <DrawCard draw={draw} onPress={() => goToDetail(draw)} fullWidth />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 2-col grid */}
        <View style={styles.section}>
          <Text style={styles.rowTitle}>All draws</Text>
          <View style={styles.grid}>
            {draws.map(draw => (
              <DrawCard key={draw.id} draw={draw} onPress={() => goToDetail(draw)} />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All items verified · 100% authentic · Draws at 9pm nightly
          </Text>
          <Text style={styles.footerSub}>Winners announced live on DRAWN</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.md,
  },
  logo: { fontFamily: 'serif', fontSize: 26, fontStyle: 'italic', color: C.PURPLE, fontWeight: '700' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  streakBadge: {
    backgroundColor: C.PURPLE_LIGHT,
    borderWidth: 1,
    borderColor: C.PURPLE,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
  },
  streakText: { color: C.PURPLE, fontSize: 12, fontWeight: '700' },
  walletPill: {
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  searchIcon: { fontSize: 12, color: C.GREY, fontWeight: '600' },
  walletText: { color: C.TEXT, fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: S.xl, marginBottom: S.lg },
  wonBanner: {
    marginHorizontal: S.xl,
    marginBottom: S.md,
    backgroundColor: C.GOLD_LIGHT,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 12,
    padding: S.md,
  },
  wonText: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  wonSub: { color: C.GREY, fontSize: 12, marginTop: 2 },
  heroCard: {
    backgroundColor: C.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
  },
  heroImage: { height: 220, justifyContent: 'space-between', padding: S.md },
  closingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236,72,153,0.2)',
    borderWidth: 1,
    borderColor: C.PINK,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
  },
  closingText: { color: C.PINK, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  watchingRow: { alignSelf: 'flex-end' },
  watchingText: { color: C.WHITE, fontSize: 12, fontWeight: '600', opacity: 0.9 },
  heroContent: { padding: S.lg },
  heroTitle: { fontSize: 18, fontWeight: '800', color: C.TEXT, marginBottom: 4, fontFamily: 'serif' },
  heroSeller: { color: C.GREY, fontSize: 13, marginBottom: S.sm },
  heroRow: { flexDirection: 'row', marginBottom: S.sm },
  pricePill: {
    backgroundColor: C.PURPLE_DARK,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  priceText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
  heroPercent: { color: C.GREY, fontSize: 12, marginTop: S.xs, marginBottom: S.sm },
  enterBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.md,
    alignItems: 'center',
    marginTop: S.sm,
  },
  enterBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
  winnerBanner: {
    marginHorizontal: S.xl,
    marginBottom: S.md,
    backgroundColor: C.CARD2,
    borderRadius: 10,
    padding: S.md,
  },
  winnerText: { color: C.GREY, fontSize: 13 },
  winnerHandle: { color: C.PURPLE, fontWeight: '700' },
  winnerValue: { color: C.GREEN, fontWeight: '700' },
  tonightStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: S.xl,
    marginBottom: S.lg,
    backgroundColor: C.CARD,
    borderRadius: 10,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  tonightLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  tonightText: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  tonightLink: { color: C.PURPLE, fontSize: 13, fontWeight: '600' },
  catRow: { gap: S.sm, paddingRight: S.xl },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  catLabel: { color: C.GREY, fontSize: 13, fontWeight: '500' },
  filterRow: { paddingHorizontal: S.xl, gap: S.sm, marginBottom: S.lg },
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
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.md,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: C.TEXT },
  seeAll: { color: C.PURPLE, fontSize: 13 },
  horizontalCards: { gap: S.md, paddingRight: S.xl },
  horizontalCardWrapper: { width: 220 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: S.md,
  },
  footer: { paddingHorizontal: S.xl, paddingVertical: S.xxl, alignItems: 'center' },
  footerText: { color: C.MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footerSub: { color: C.MUTED, fontSize: 11, marginTop: S.xs },
});
