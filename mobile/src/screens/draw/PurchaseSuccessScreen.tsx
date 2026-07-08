import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CountdownTimer } from '../../components/CountdownTimer';
import { isEnabled } from '../../config/featureFlags';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = {
  route: { params: { draw: any; ticketCount: number; totalPence: number } };
  navigation: any;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONFETTI_COLORS = [C.PURPLE, C.PINK, C.GOLD, C.GREEN, '#3B82F6', '#F97316', C.WHITE, '#A78BFA'];

type Particle = {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
};

function useConfetti(): Particle[] {
  const particles = useRef<Particle[]>(
    Array.from({ length: 12 }, (_, i) => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 6,
    }))
  ).current;

  useEffect(() => {
    const anims = particles.map(p =>
      Animated.parallel([
        Animated.timing(p.y, {
          toValue: 700,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: 1,
          duration: 2000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1000 + Math.random() * 500),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    Animated.stagger(100, anims).start();
  }, []);

  return particles;
}

export function PurchaseSuccessScreen({ route, navigation }: Props) {
  const { draw, ticketCount, totalPence } = route.params;
  const totalPounds = (totalPence / 100).toFixed(2);
  const oddsIn = Math.round(draw.totalTickets / ticketCount);
  const particles = useConfetti();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Confetti */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confettiParticle,
            {
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>You're in!</Text>

        {/* Draw info card */}
        <View style={styles.drawCard}>
          <View style={[styles.drawThumb, { backgroundColor: draw.imageColor }]} />
          <View style={styles.drawInfo}>
            <Text style={styles.drawTitle} numberOfLines={2}>{draw.title}</Text>
            <Text style={styles.drawSeller}>{draw.seller}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ticketCount}</Text>
            <Text style={styles.statLabel}>tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>£{totalPounds}</Text>
            <Text style={styles.statLabel}>total paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1 in {oddsIn}</Text>
            <Text style={styles.statLabel}>odds</Text>
          </View>
        </View>

        {/* Countdown */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Draw closes in</Text>
          <CountdownTimer style={styles.countdownTime} />
          <Text style={styles.countdownSub}>Tonight at 9pm · Watch live on bedrawn</Text>
        </View>

        {/* Winner share module */}
        {isEnabled('WINNER_SHARE') && (
          <View style={styles.shareCard}>
            <Text style={styles.shareHeadline}>👑 Tell your friends · get £10 credit</Text>
            <Text style={styles.shareSub}>
              If a friend signs up from your share, you get £10 added to your wallet
            </Text>
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.85}
              onPress={() => {
                const priceStr = draw.ticketPrice >= 100
                  ? `£${(draw.ticketPrice / 100).toFixed(2)}`
                  : `${draw.ticketPrice}p`;
                Share.share({
                  message: `I just entered the ${draw.title} draw on bedrawn — tickets from ${priceStr} each. Join me! https://bedrawn.co.uk`,
                });
              }}
            >
              <Text style={styles.shareBtnText}>Share this draw 🎉</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CTA buttons */}
        <TouchableOpacity
          style={styles.liveBtn}
          onPress={() => navigation.navigate('Live')}
          activeOpacity={0.85}
        >
          <Text style={styles.liveBtnText}>Watch live at 9pm →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseBtnText}>Browse more draws</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  confettiParticle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.xl,
    paddingVertical: S.xxl,
    zIndex: 1,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 34,
    fontWeight: '800',
    color: C.TEXT,
    marginBottom: S.xl,
    textAlign: 'center',
  },
  drawCard: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: C.BORDER,
    width: '100%',
  },
  drawThumb: { width: 60, height: 60, borderRadius: 10 },
  drawInfo: { flex: 1 },
  drawTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  drawSeller: { color: C.GREY, fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    marginBottom: S.xl,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: C.GOLD, fontWeight: '800', fontSize: 18, fontFamily: 'serif' },
  statLabel: { color: C.GREY, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: C.BORDER },
  countdownCard: {
    backgroundColor: C.CARD2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.PURPLE,
    padding: S.xl,
    alignItems: 'center',
    marginBottom: S.xl,
    width: '100%',
  },
  countdownLabel: { color: C.GREY, fontSize: 13, marginBottom: S.sm },
  countdownTime: { fontSize: 36, color: C.TEXT, fontFamily: 'serif', fontWeight: '800' },
  countdownSub: { color: C.MUTED, fontSize: 12, marginTop: S.sm },
  shareCard: {
    backgroundColor: C.CARD2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.30)',
    padding: S.lg,
    marginBottom: S.lg,
    width: '100%',
    alignItems: 'center',
    gap: S.sm,
  },
  shareHeadline: {
    color: C.TEXT,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  shareSub: {
    color: C.GREY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  shareBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.md,
    paddingHorizontal: S.xxl,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
  liveBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    paddingHorizontal: S.xxxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: S.md,
  },
  liveBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  browseBtn: {
    paddingVertical: S.md,
  },
  browseBtnText: { color: C.GREY, fontSize: 14, textDecorationLine: 'underline' },
});
