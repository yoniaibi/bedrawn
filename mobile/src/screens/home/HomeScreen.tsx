import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
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
import { LAUNCH_BRANDS } from '../../config/brands';
import { isEnabled } from '../../config/featureFlags';
import { Draw, activityMessages } from '../../data/mockData';
import { apiGet, apiGetPublic } from '../../lib/api';
import { HomeStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const BRAND_CHIPS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'chanel', label: 'Chanel' },
  { id: 'lv', label: 'Louis Vuitton' },
  { id: 'bottega', label: 'Bottega Veneta' },
  { id: 'prada', label: 'Prada' },
  { id: 'celine', label: 'Celine' },
  { id: 'high_value', label: 'High value' },
  { id: 'just_listed', label: 'Just listed' },
];

const IMAGE_COLORS = [
  '#E8DDD3', '#D4C5B8', '#EDE5DC', '#C8B8A8', '#DDD0C4',
  '#E0D5CC', '#C4B5A5', '#D8CCB8', '#E5DAD0', '#CFC2B5',
];

interface ApiDraw {
  drawId: string;
  title: string;
  seller: string;
  ticketPricePence: number;
  retailValuePence: number;
  soldTickets: number;
  totalTickets: number;
  category?: string;
  style?: string;
  isBundle?: boolean;
  isClosingTonight?: boolean;
  isVerified?: boolean;
  description?: string;
  closingDate?: string;
  reserveTickets?: number;
}

// API returns the same shape as mock Draw (id not drawId; ticketPrice in pence; retailValue in pounds)
function adaptDraw(d: ApiDraw, index: number): Draw {
  return {
    id: (d as any).id ?? d.drawId,
    title: d.title,
    seller: d.seller,
    sellerEmoji: '✦',
    ticketPrice: (d as any).ticketPrice ?? d.ticketPricePence,
    retailValue: (d as any).retailValue ?? Math.round(d.retailValuePence / 100),
    totalTickets: d.totalTickets,
    soldTickets: d.soldTickets,
    category: d.category ?? '',
    style: d.style ?? '',
    condition: 'Excellent',
    isBundle: d.isBundle ?? false,
    isClosingTonight: d.isClosingTonight ?? false,
    isVerified: d.isVerified ?? true,
    description: d.description ?? '',
    imageColor: IMAGE_COLORS[index % IMAGE_COLORS.length],
    imageUrl: (d as any).imageUrl ?? undefined,
    closingDate: d.closingDate,
    reserveTickets: d.reserveTickets,
  };
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState('tonight');
  const [brandSheetVisible, setBrandSheetVisible] = useState(false);
  const [allDraws, setAllDraws] = useState<Draw[]>([]);
  const [drawsLoaded, setDrawsLoaded] = useState(false);
  const [balancePence, setBalancePence] = useState<number | null>(null);
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(streakScale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(streakScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [streakScale]);

  const fetchDraws = useCallback(() => {
    apiGetPublic<{ draws: ApiDraw[] }>('/draws')
      .then(d => setAllDraws((d.draws ?? []).map(adaptDraw)))
      .catch(() => {})
      .finally(() => setDrawsLoaded(true));
  }, []);

  useEffect(() => {
    fetchDraws();
    apiGet<{ balancePence: number }>('/wallet/balance')
      .then(d => setBalancePence(d.balancePence))
      .catch(() => {});
  }, [fetchDraws]);

  const heroDrawItem = allDraws.find(d => d.isClosingTonight) ?? allDraws[0];
  const tonightCount = allDraws.filter(d => d.isClosingTonight).length;

  // Filter draws based on active brand chip
  const filteredDraws = allDraws.filter(d => {
    if (activeFilter === 'tonight') return d.isClosingTonight;
    if (activeFilter === 'high_value') return d.retailValue >= 1000;
    if (activeFilter === 'just_listed') return true; // no date available in mock
    // brand filter
    return (d as any).brandId === activeFilter;
  });

  const drawingTonight = allDraws.filter(d => d.isClosingTonight).slice(0, 8);
  // Gate style rows
  const bagDraws = allDraws.filter(d => d.category === 'Bags').slice(0, 6);

  const goToDetail = (draw: Draw) => {
    navigation.navigate('DrawDetail', { draw });
  };

  const balanceLabel = balancePence === null ? '...' : `£${(balancePence / 100).toFixed(2)}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* NavBar */}
        <View style={styles.navbar}>
          <Text style={styles.logo}>bedrawn</Text>
          <View style={styles.navRight}>
            {isEnabled('LOGIN_STREAK') && (
              <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakScale }] }]}>
                <Text style={styles.streakText}>3 day streak</Text>
              </Animated.View>
            )}
            <TouchableOpacity
              style={styles.walletPill}
              onPress={() => {
                if (!isEnabled('SEARCH_SCREEN')) {
                  setBrandSheetVisible(true);
                } else {
                  navigation.navigate('Search');
                }
              }}
            >
              <Text style={styles.searchIcon}>Browse</Text>
            </TouchableOpacity>
            <View style={styles.walletPill}>
              <Text style={styles.walletText}>{balanceLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ActivityTicker messages={activityMessages} />
        </View>

        {/* Hero draw */}
        {heroDrawItem && (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <View style={[styles.heroImage, { backgroundColor: heroDrawItem.imageColor }]}>
                {heroDrawItem.imageUrl ? (
                  <Image
                    source={{ uri: heroDrawItem.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
                {heroDrawItem.isClosingTonight ? (
                  <View style={styles.closingPill}>
                    <LiveDot />
                    <Text style={styles.closingText}>DRAWING TONIGHT · 9PM</Text>
                  </View>
                ) : (
                  <View style={styles.openPill}>
                    <Text style={styles.openText}>OPEN · ACCEPTING ENTRIES</Text>
                  </View>
                )}
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
                <ProgressBar
                  percent={Math.round((heroDrawItem.soldTickets / heroDrawItem.totalTickets) * 100)}
                  height={5}
                />
                <Text style={styles.heroPercent}>
                  {Math.round((heroDrawItem.soldTickets / heroDrawItem.totalTickets) * 100)}% sold ·{' '}
                  {heroDrawItem.totalTickets - heroDrawItem.soldTickets} tickets left
                </Text>
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
        )}

        {/* Empty state — no draws yet */}
        {drawsLoaded && allDraws.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No draws yet</Text>
            <Text style={styles.emptyText}>
              Items go live once they hit their reserve. Check back soon — draws are added daily.
            </Text>
          </View>
        )}

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
            <Text style={styles.tonightText}>
              {tonightCount > 0
                ? `${tonightCount} draw${tonightCount > 1 ? 's' : ''} drawing tonight at 9pm`
                : 'No draws scheduled tonight yet'}
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.tonightLink}>Watch live →</Text>
          </TouchableOpacity>
        </View>

        {/* Brand chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {BRAND_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.filterChip, activeFilter === chip.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(chip.id)}
            >
              <Text style={[styles.filterText, activeFilter === chip.id && styles.filterTextActive]}>
                {chip.label}{chip.id === 'tonight' && tonightCount > 0 ? ` · ${tonightCount}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Drawing Tonight row */}
        {drawingTonight.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <View style={styles.rowTitleLive}>
                <LiveDot />
                <Text style={styles.rowTitle}>Drawing Tonight · 9pm</Text>
              </View>
              <Text style={styles.rowCount}>
                {drawingTonight.length} draw{drawingTonight.length > 1 ? 's' : ''}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCards}
            >
              {drawingTonight.map(draw => (
                <View key={draw.id} style={styles.horizontalCardWrapper}>
                  <DrawCard draw={draw} onPress={() => goToDetail(draw)} onSellerPress={() => draw.sellerId && navigation.navigate("SellerProfile", { sellerId: draw.sellerId })} fullWidth />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bags row — replaces Womenswear/Menswear/Unisex when STYLE_CATEGORIES is off */}
        {!isEnabled('STYLE_CATEGORIES') && bagDraws.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>Designer bags</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCards}
            >
              {bagDraws.map(draw => (
                <View key={draw.id} style={styles.horizontalCardWrapper}>
                  <DrawCard draw={draw} onPress={() => goToDetail(draw)} onSellerPress={() => draw.sellerId && navigation.navigate("SellerProfile", { sellerId: draw.sellerId })} fullWidth />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 2-col grid */}
        {filteredDraws.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.rowTitle}>
              {activeFilter === 'tonight' ? 'Drawing tonight' :
               activeFilter === 'high_value' ? 'High value draws' :
               activeFilter === 'just_listed' ? 'All draws' :
               LAUNCH_BRANDS.find(b => b.id === activeFilter)?.label ?? 'All draws'}
            </Text>
            <View style={styles.grid}>
              {filteredDraws.map(draw => (
                <DrawCard key={draw.id} draw={draw} onPress={() => goToDetail(draw)} onSellerPress={() => draw.sellerId && navigation.navigate("SellerProfile", { sellerId: draw.sellerId })} />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All items verified · 100% authentic · Draws at 9pm nightly
          </Text>
          <Text style={styles.footerSub}>Winners announced live on bedrawn</Text>
        </View>
      </ScrollView>

      {/* Brand Sheet — replaces search screen for MVP */}
      <Modal
        visible={brandSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBrandSheetVisible(false)}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setBrandSheetVisible(false)}>
          <View style={styles.sheetContainer}>
            <Text style={styles.sheetTitle}>Browse by brand</Text>
            {LAUNCH_BRANDS.map(brand => {
              const count = allDraws.filter(d => (d as any).brandId === brand.id).length;
              return (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.sheetRow}
                  onPress={() => { setActiveFilter(brand.id); setBrandSheetVisible(false); }}
                >
                  <View style={styles.sheetRowLeft}>
                    <Text style={styles.sheetBrandName}>{brand.label}</Text>
                    <Text style={styles.sheetBrandCount}>{count} draw{count !== 1 ? 's' : ''} live</Text>
                  </View>
                  <Text style={styles.sheetChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.sheetFooter}>More brands coming soon. Follow @bedrawn for announcements.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: 'rgba(244,114,182,0.20)',
    borderWidth: 1,
    borderColor: C.PINK,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
  },
  closingText: { color: C.PINK, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  openPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
  },
  openText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  watchingRow: { alignSelf: 'flex-end' },
  watchingText: { color: C.WHITE, fontSize: 12, fontWeight: '600', opacity: 0.9 },
  heroContent: { padding: S.lg },
  heroTitle: { fontSize: 18, fontWeight: '800', color: C.TEXT, marginBottom: 4 },
  heroSeller: { color: C.GREY, fontSize: 13, marginBottom: S.sm },
  heroRow: { flexDirection: 'row', marginBottom: S.sm },
  pricePill: {
    backgroundColor: 'rgba(255,35,86,0.08)',
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,35,86,0.22)',
  },
  priceText: { color: C.CORAL, fontSize: 13, fontWeight: '700' },
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
  rowTitleLive: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  rowCount: { color: C.MUTED, fontSize: 12 },
  seeAll: { color: C.PURPLE, fontSize: 13 },
  horizontalCards: { gap: S.md, paddingRight: S.xl },
  horizontalCardWrapper: { width: 220 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: S.md,
  },
  emptyState: { paddingHorizontal: S.xl, paddingVertical: S.xxl, alignItems: 'center' },
  emptyTitle: { color: C.TEXT, fontSize: 15, fontWeight: '700', marginBottom: S.xs },
  emptyText: { color: C.GREY, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  footer: { paddingHorizontal: S.xl, paddingVertical: S.xxl, alignItems: 'center' },
  footerText: { color: C.MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footerSub: { color: C.MUTED, fontSize: 11, marginTop: S.xs },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: C.CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: S.xl, paddingBottom: S.xxxl },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.TEXT, marginBottom: S.xl },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.lg, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  sheetRowLeft: { flex: 1 },
  sheetBrandName: { fontSize: 16, fontWeight: '700', color: C.TEXT },
  sheetBrandCount: { fontSize: 12, color: C.GREY, marginTop: 2 },
  sheetChevron: { fontSize: 22, color: C.MUTED },
  sheetFooter: { color: C.MUTED, fontSize: 12, textAlign: 'center', marginTop: S.xl, lineHeight: 18 },
});
