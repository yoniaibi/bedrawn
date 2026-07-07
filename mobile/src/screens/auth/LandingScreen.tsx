import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';
import { CountdownTimer } from '../../components/CountdownTimer';
import { LiveDot } from '../../components/LiveDot';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

const HERO_COLORS = ['#1a1a2e', '#8B0000', '#2C3E50', '#4A3728', '#CC0000', '#C49A3C'];
const WINNER_DATA = [
  { handle: '@sarah_j', item: 'Chanel Flap Bag', paid: '50p', won: '£6,800' },
  { handle: '@sneaker_dan', item: 'Air Jordan 1 Chicago', paid: '10p', won: '£450' },
  { handle: '@luxe_fan_99', item: 'Louis Vuitton Neverfull', paid: '30p', won: '£1,150' },
];

export function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Text style={styles.logo}>bedrawn</Text>
        <Text style={styles.tagline}>Win designer things for pennies.</Text>

        {/* Countdown pill */}
        <View style={styles.countdownPill}>
          <LiveDot />
          <Text style={styles.countdownLabel}>Closes tonight · </Text>
          <CountdownTimer style={styles.countdownTime} />
        </View>

        {/* Hero grid */}
        <View style={styles.heroGrid}>
          {HERO_COLORS.map((color, i) => (
            <View key={i} style={[styles.heroCell, { backgroundColor: color }]} />
          ))}
        </View>

        {/* Winners carousel */}
        <Text style={styles.sectionTitle}>Recent winners</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.winnersRow}
        >
          {WINNER_DATA.map((w, i) => (
            <View key={i} style={styles.winnerCard}>
              <Text style={styles.winnerHandle}>{w.handle}</Text>
              <Text style={styles.winnerItem}>{w.item}</Text>
              <Text style={styles.winnerValue}>
                paid <Text style={styles.winnerPaid}>{w.paid}</Text> · won{' '}
                <Text style={styles.winnerWon}>{w.won}</Text>
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.stepsContainer}>
          {[
            { num: '1', title: 'Browse', desc: 'Discover luxury items listed by verified sellers.' },
            { num: '2', title: 'Buy tickets', desc: 'Enter for as little as 10p per ticket.' },
            { num: '3', title: 'Win at 9pm', desc: 'Watch the live draw — winner takes all.' },
          ].map(step => (
            <View key={step.num} style={styles.step}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('SignUp')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get started — it's free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>Already have an account? Log in</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy. Must be 18+.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  scroll: { flex: 1 },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  logo: {
    fontFamily: 'serif',
    fontSize: 42,
    fontStyle: 'italic',
    color: C.PURPLE,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: S.lg,
  },
  tagline: {
    fontSize: 16,
    color: C.TEXT,
    textAlign: 'center',
    marginTop: S.sm,
    marginBottom: S.xl,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: C.PINK,
    borderRadius: 999,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    gap: S.sm,
    marginBottom: S.xl,
  },
  countdownLabel: { color: C.PINK, fontSize: 13, fontWeight: '600' },
  countdownTime: { color: C.PINK, fontSize: 14, fontWeight: '700', fontFamily: 'serif' },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginBottom: S.xl,
  },
  heroCell: {
    width: '30.5%',
    height: 100,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: S.md,
  },
  winnersRow: { gap: S.md, paddingRight: S.xl },
  winnerCard: {
    backgroundColor: C.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    width: 200,
  },
  winnerHandle: { color: C.PURPLE, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  winnerItem: { color: C.TEXT, fontSize: 12, marginBottom: 4 },
  winnerValue: { color: C.GREY, fontSize: 11 },
  winnerPaid: { color: C.PINK },
  winnerWon: { color: C.GREEN, fontWeight: '700' },
  stepsContainer: { gap: S.lg, marginBottom: S.xl },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: C.WHITE, fontWeight: '800', fontSize: 15 },
  stepText: { flex: 1 },
  stepTitle: { color: C.TEXT, fontWeight: '700', fontSize: 15, marginBottom: 2 },
  stepDesc: { color: C.GREY, fontSize: 13, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginBottom: S.md,
  },
  primaryBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { alignItems: 'center', paddingVertical: S.sm, marginBottom: S.md },
  secondaryBtnText: { color: C.GREY, fontSize: 14 },
  legal: {
    fontSize: 10,
    color: C.MUTED,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: S.md,
  },
});
