import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Draw } from '../data/mockData';
import { C } from '../theme/colors';
import { S } from '../theme/spacing';
import { LiveDot } from './LiveDot';
import { ProgressBar } from './ProgressBar';

type Props = {
  draw: Draw;
  onPress: () => void;
  onSellerPress?: () => void;
  fullWidth?: boolean;
};

export function DrawCard({ draw, onPress, onSellerPress, fullWidth }: Props) {
  const percent = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const priceLabel = `${draw.ticketPrice}p → £${draw.retailValue.toLocaleString()}`;
  const watching = Math.floor(Math.random() * 80) + 20;
  const sellerInitial = (draw.sellerName || draw.seller || '?').charAt(0).toUpperCase();
  const sellerDisplay = draw.sellerName ? draw.sellerName.split(' ')[0] : `@${draw.seller}`;

  return (
    <TouchableOpacity
      style={[styles.card, fullWidth ? styles.fullWidth : styles.halfWidth]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={[styles.image, { backgroundColor: draw.imageColor }]}>
        {draw.imageUrl ? (
          <Image
            source={{ uri: draw.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        {/* Bundle tag */}
        {draw.isBundle && (
          <View style={styles.bundleTag}>
            <Text style={styles.bundleText}>BUNDLE</Text>
          </View>
        )}

        {/* Drawing tonight badge */}
        {draw.isClosingTonight && (
          <View style={styles.closingBadge}>
            <LiveDot />
            <Text style={styles.closingText}>DRAWING TONIGHT 9PM</Text>
          </View>
        )}

        {/* Bookmark */}
        <TouchableOpacity style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>☆</Text>
        </TouchableOpacity>

        {/* Auth / verified badge */}
        {((draw as any).auth?.status === 'passed' || draw.isVerified) && (
          <View style={(draw as any).auth?.status === 'passed' ? styles.authBadge : styles.verifiedBadge}>
            <Text style={(draw as any).auth?.status === 'passed' ? styles.authText : styles.verifiedText}>
              {(draw as any).auth?.status === 'passed' ? '✓ AUTH' : '✓'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{draw.title}</Text>

        {/* Seller row — tappable if sellerId present */}
        <TouchableOpacity
          style={styles.sellerRow}
          onPress={e => { if (onSellerPress && draw.sellerId) { e.stopPropagation?.(); onSellerPress(); } }}
          activeOpacity={draw.sellerId && onSellerPress ? 0.7 : 1}
          disabled={!draw.sellerId || !onSellerPress}
        >
          {draw.sellerAvatarUrl ? (
            <Image source={{ uri: draw.sellerAvatarUrl }} style={styles.sellerAvatar} />
          ) : (
            <View style={styles.sellerAvatarFallback}>
              <Text style={styles.sellerInitial}>{sellerInitial}</Text>
            </View>
          )}
          <Text style={styles.sellerName} numberOfLines={1}>{sellerDisplay}</Text>
        </TouchableOpacity>

        {/* Price pill */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>

        <ProgressBar percent={percent} height={3} />

        {/* Threshold line */}
        {draw.soldTickets >= draw.totalTickets ? (
          <Text style={styles.thresholdSoldOut}>Sold out · resolves soon 9pm</Text>
        ) : (() => {
          const reserveAbs = draw.reserveTickets ?? Math.ceil(draw.totalTickets * ((draw as any).minThreshold ?? 0.5));
          const ticketsNeeded = Math.max(0, reserveAbs - draw.soldTickets);
          return ticketsNeeded === 0 ? (
            <Text style={styles.thresholdConfirmed}>✓ Draw confirmed</Text>
          ) : (
            <Text style={[styles.thresholdNeeded, ticketsNeeded <= 100 && styles.thresholdUrgent]}>
              {ticketsNeeded.toLocaleString()} more tickets needed
            </Text>
          );
        })()}

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
    backgroundColor: 'rgba(255,35,86,0.18)',
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
  },
  bookmarkIcon: {
    fontSize: 18,
    color: C.GREY,
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
  authBadge: {
    position: 'absolute',
    top: 6,
    right: 36,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1,
    borderColor: C.LILAC,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  authText: {
    fontSize: 8,
    color: C.LILAC,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    padding: S.md,
    gap: S.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: C.TEXT,
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  sellerAvatarFallback: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.CORAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    fontSize: 8,
    fontWeight: '700',
    color: C.WHITE,
    lineHeight: 10,
  },
  sellerName: {
    fontSize: 11,
    color: C.GREY,
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: C.PURPLE_LIGHT,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: C.PURPLE,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.PURPLE,
  },
  watchCount: {
    fontSize: 10,
    color: C.MUTED,
    marginTop: 4,
  },
  thresholdSoldOut: {
    fontSize: 10,
    color: C.LILAC,
    marginTop: 3,
  },
  thresholdConfirmed: {
    fontSize: 10,
    color: C.GREEN,
    marginTop: 3,
    fontWeight: '600',
  },
  thresholdNeeded: {
    fontSize: 10,
    color: C.MUTED,
    marginTop: 3,
  },
  thresholdUrgent: {
    color: C.PINK,
    fontWeight: '600',
  },
});
