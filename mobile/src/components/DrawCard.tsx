import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Draw } from '../data/mockData';
import { C } from '../theme/colors';
import { S } from '../theme/spacing';
import { LiveDot } from './LiveDot';
import { ProgressBar } from './ProgressBar';

type Props = {
  draw: Draw;
  onPress: () => void;
  fullWidth?: boolean;
};

export function DrawCard({ draw, onPress, fullWidth }: Props) {
  const percent = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const priceLabel = `${draw.ticketPrice}p → £${draw.retailValue.toLocaleString()}`;
  const watching = Math.floor(Math.random() * 80) + 20;

  return (
    <TouchableOpacity
      style={[styles.card, fullWidth ? styles.fullWidth : styles.halfWidth]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image placeholder */}
      <View style={[styles.image, { backgroundColor: draw.imageColor }]}>
        {/* Bundle tag */}
        {draw.isBundle && (
          <View style={styles.bundleTag}>
            <Text style={styles.bundleText}>BUNDLE</Text>
          </View>
        )}

        {/* Closing tonight badge */}
        {draw.isClosingTonight && (
          <View style={styles.closingBadge}>
            <LiveDot />
            <Text style={styles.closingText}>CLOSING TONIGHT</Text>
          </View>
        )}

        {/* Bookmark */}
        <TouchableOpacity style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>☆</Text>
        </TouchableOpacity>

        {/* Verified */}
        {draw.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{draw.title}</Text>
        <Text style={styles.seller} numberOfLines={1}>
          {draw.sellerEmoji} {draw.seller}
        </Text>

        {/* Price pill */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>

        <ProgressBar percent={percent} height={3} />

        <Text style={styles.watchCount}>{watching} watching · {percent}% sold</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.BORDER,
    overflow: 'hidden',
    marginBottom: S.md,
  },
  halfWidth: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
  },
  image: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  bundleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.GOLD,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bundleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  closingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236,72,153,0.2)',
    borderWidth: 1,
    borderColor: C.PINK,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  closingText: {
    fontSize: 8,
    fontWeight: '700',
    color: C.PINK,
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 18,
    color: C.WHITE,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    right: 36,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: C.WHITE,
    fontWeight: '700',
  },
  content: {
    padding: S.md,
    gap: S.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: C.WHITE,
    lineHeight: 18,
  },
  seller: {
    fontSize: 11,
    color: C.GREY,
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: C.PURPLE_DARK,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginVertical: 2,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.WHITE,
  },
  watchCount: {
    fontSize: 10,
    color: C.MUTED,
    marginTop: 4,
  },
});
