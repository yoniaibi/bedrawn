import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveDot } from '../../components/LiveDot';
import { ProgressBar } from '../../components/ProgressBar';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

// This screen is shared across multiple stacks so we use a loose param approach
type Props = {
  route: { params: { draw: any } };
  navigation: any;
};

export function DrawDetailScreen({ route, navigation }: Props) {
  const { draw } = route.params;
  const [descExpanded, setDescExpanded] = useState(false);

  const percent = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const watching = 247;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero image */}
        <View style={[styles.heroImage, { backgroundColor: draw.imageColor }]}>
          {draw.isClosingTonight && (
            <View style={styles.closingBadge}>
              <LiveDot />
              <Text style={styles.closingText}>CLOSING TONIGHT · 9PM</Text>
            </View>
          )}
          {draw.isBundle && (
            <View style={styles.bundleTag}>
              <Text style={styles.bundleText}>BUNDLE</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Badges row */}
          <View style={styles.badgesRow}>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{draw.condition}</Text>
            </View>
            {draw.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{draw.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{draw.title}</Text>

          {/* Seller row */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>{draw.seller.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.sellerName}>{draw.seller}</Text>
              <Text style={styles.sellerLabel}>Verified seller</Text>
            </View>
          </View>

          {/* Price pills */}
          <View style={styles.priceRow}>
            <View style={styles.ticketPricePill}>
              <Text style={styles.ticketPriceLabel}>Per ticket</Text>
              <Text style={styles.ticketPriceValue}>{draw.ticketPrice}p</Text>
            </View>
            <View style={styles.retailPill}>
              <Text style={styles.retailLabel}>RRP</Text>
              <Text style={styles.retailValue}>£{draw.retailValue.toLocaleString()}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{percent}% sold</Text>
              <Text style={styles.progressRemaining}>
                {draw.totalTickets - draw.soldTickets} tickets left
              </Text>
            </View>
            <ProgressBar percent={percent} height={6} />
            <View style={styles.ticketStats}>
              <Text style={styles.ticketStatText}>
                {draw.soldTickets.toLocaleString()} / {draw.totalTickets.toLocaleString()} tickets sold
              </Text>
              <Text style={styles.watchingText}>{watching} watching</Text>
            </View>
          </View>

          {/* Postal entry note */}
          <View style={styles.postalNote}>
            <Text style={styles.postalIcon}>✉</Text>
            <Text style={styles.postalText}>
              Free postal entry available. See our T&Cs for details.
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>About this item</Text>
            <Text
              style={styles.descText}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {draw.description}
            </Text>
            <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
              <Text style={styles.descToggle}>
                {descExpanded ? 'Show less ↑' : 'Read more ↓'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social proof */}
          <View style={styles.socialProof}>
            <Text style={styles.socialText}>
              <Text style={styles.socialHandle}>@emily</Text> just bought 5 tickets · 2 mins ago
            </Text>
          </View>

          <View style={styles.socialProof}>
            <Text style={styles.socialText}>
              {draw.soldTickets} people have already entered this draw
            </Text>
          </View>

          {/* Style & condition details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Item details</Text>
            {[
              { label: 'Category', value: draw.category },
              { label: 'Style', value: draw.style },
              { label: 'Condition', value: draw.condition },
              { label: 'Ticket price', value: `${draw.ticketPrice}p` },
              { label: 'Total tickets', value: draw.totalTickets.toLocaleString() },
              { label: 'Draw closes', value: draw.isClosingTonight ? 'Tonight at 9pm' : 'Tomorrow at 9pm' },
            ].map(item => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Spacer for sticky button */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Sticky enter button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity
          style={styles.enterBtn}
          onPress={() => navigation.navigate('Purchase', { draw })}
          activeOpacity={0.85}
        >
          <Text style={styles.enterBtnText}>Enter draw · {draw.ticketPrice}p per ticket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  scrollContent: { paddingBottom: S.xxxl },
  backBtn: { padding: S.xl, paddingBottom: S.sm },
  backText: { color: C.GREY, fontSize: 15 },
  heroImage: {
    height: 260,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: S.lg,
  },
  closingBadge: {
    position: 'absolute',
    top: S.lg,
    left: S.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: 'rgba(244,114,182,0.20)',
    borderWidth: 1,
    borderColor: C.PINK,
    borderRadius: 999,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
  },
  closingText: { color: C.PINK, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  bundleTag: {
    position: 'absolute',
    bottom: S.lg,
    left: S.lg,
    backgroundColor: C.GOLD,
    borderRadius: 4,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
  },
  bundleText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  content: { padding: S.xl },
  badgesRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.md, flexWrap: 'wrap' },
  conditionBadge: {
    backgroundColor: C.CARD2,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  conditionText: { color: C.GREY, fontSize: 12, fontWeight: '600' },
  verifiedBadge: {
    backgroundColor: C.PURPLE_LIGHT,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  verifiedText: { color: C.PURPLE, fontSize: 12, fontWeight: '600' },
  categoryBadge: {
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  categoryText: { color: C.GREY, fontSize: 12 },
  title: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: S.lg,
    lineHeight: 36,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginBottom: S.xl,
    backgroundColor: C.CARD,
    borderRadius: 12,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  sellerInitial: { fontSize: 16, fontWeight: '700', color: C.PURPLE },
  sellerName: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  sellerLabel: { color: C.GREY, fontSize: 11, marginTop: 2 },
  priceRow: { flexDirection: 'row', gap: S.md, marginBottom: S.xl },
  ticketPricePill: {
    flex: 1,
    backgroundColor: C.PURPLE_DARK,
    borderRadius: 14,
    padding: S.lg,
    alignItems: 'center',
  },
  ticketPriceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  ticketPriceValue: { color: C.WHITE, fontSize: 24, fontWeight: '800' },
  retailPill: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  retailLabel: { color: C.GREY, fontSize: 11, marginBottom: 4 },
  retailValue: { color: C.GOLD, fontSize: 24, fontWeight: '800' },
  progressSection: { marginBottom: S.xl },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S.sm },
  progressText: { color: C.TEXT, fontWeight: '700', fontSize: 13 },
  progressRemaining: { color: C.GREY, fontSize: 13 },
  ticketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: S.xs,
  },
  ticketStatText: { color: C.MUTED, fontSize: 12 },
  watchingText: { color: C.MUTED, fontSize: 12 },
  postalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.CARD,
    borderRadius: 10,
    padding: S.md,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  postalIcon: { fontSize: 18, color: C.GREY },
  postalText: { color: C.GREY, fontSize: 12, flex: 1, lineHeight: 16 },
  descSection: { marginBottom: S.xl },
  descTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.sm },
  descText: { color: C.GREY, fontSize: 14, lineHeight: 22 },
  descToggle: { color: C.PURPLE, fontSize: 13, fontWeight: '600', marginTop: S.sm },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginBottom: S.sm,
  },
  socialText: { color: C.GREY, fontSize: 13 },
  socialHandle: { color: C.PURPLE, fontWeight: '700' },
  detailsCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    marginTop: S.lg,
  },
  detailsTitle: { fontSize: 14, fontWeight: '700', color: C.TEXT, marginBottom: S.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: S.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  detailLabel: { color: C.GREY, fontSize: 13 },
  detailValue: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
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
  enterBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  enterBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
});
