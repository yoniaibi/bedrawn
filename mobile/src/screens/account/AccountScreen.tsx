import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isEnabled } from '../../config/featureFlags';
import { useAuth } from '../../navigation/RootNavigator';
import { AccountStackParamList } from '../../navigation/TabNavigator';
import { apiGet } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Stats {
  activeDraws: number;
  totalTickets: number;
  wins: number;
  totalDrawsEntered: number;
}

interface Profile {
  handle: string;
  name: string;
}

type Nav = NativeStackNavigationProp<AccountStackParamList>;

const ACHIEVEMENTS = [
  { emoji: '✦', label: 'Founding Member', unlocked: true, progress: null },
  { emoji: '✦', label: 'First Entry', unlocked: true, progress: null },
  { emoji: '✦', label: '3-Day Streak', unlocked: true, progress: null },
  { emoji: '★', label: 'First Win', unlocked: true, progress: null },
  { emoji: '✦', label: '25 Tickets', unlocked: true, progress: '47 of 25 ✓' },
  { emoji: '✦', label: 'First Sale', unlocked: false, progress: '0 sales' },
];

const AVATAR_COLORS = [
  '#7C3AED', '#EC4899', '#D97706', '#059669', '#DC2626', '#2563EB',
  '#7C3AED', '#0891B2', '#65A30D', '#9333EA', '#F97316', '#0F766E',
  '#BE185D', '#1D4ED8', '#B45309', '#047857', '#B91C1C', '#4338CA',
  '#7E22CE', '#C2410C', '#0369A1', '#15803D', '#1E40AF', '#9D174D',
  '#6D28D9', '#92400E', '#065F46', '#991B1B', '#1E3A8A', '#581C87',
];

function AvatarModal({ visible, onClose, initials }: { visible: boolean; onClose: () => void; initials: string }) {
  const [selected, setSelected] = useState(AVATAR_COLORS[0]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Choose your colour</Text>
          <View style={[styles.avatarCircle, { backgroundColor: selected, borderColor: selected, marginBottom: 20, alignSelf: 'center' }]}>
            <Text style={[styles.avatarText, { color: C.WHITE, fontSize: 28, fontWeight: '700' }]}>{initials}</Text>
          </View>
          <View style={styles.avatarGrid}>
            {AVATAR_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.avatarOption, { backgroundColor: color }, selected === color && styles.avatarOptionSelected]}
                onPress={() => setSelected(color)}
              >
                {selected === color && (
                  <Text style={{ color: C.WHITE, fontSize: 16, fontWeight: '700' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const MENU_ITEMS = [
  { label: 'Edit Profile', screen: 'Profile' as const },
  { label: 'My Wallet', screen: 'Wallet' as const },
  { label: 'My Orders', screen: 'Orders' as const },
  { label: 'Saved Draws', screen: 'SavedDraws' as const },
  { label: 'Notifications', screen: 'Notifications' as const },
  { label: 'Past draws', screen: 'DrawsHistory' as const },
  { label: 'Become a Seller', screen: 'BecomeSeller' as const },
  { label: 'Settings', screen: 'Settings' as const },
  { label: 'Privacy Policy', screen: 'Privacy' as const },
  { label: 'Terms of Service', screen: 'Terms' as const },
];

export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balancePence, setBalancePence] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Stats>('/me/stats').then(setStats).catch(() => {});
    apiGet<Profile>('/profile').then(setProfile).catch(() => {});
    apiGet<{ balancePence: number }>('/wallet/balance')
      .then(d => setBalancePence(d.balancePence))
      .catch(() => {});
  }, []);

  const handle = profile?.handle ?? '...';
  const initials = handle.replace(/^@/, '').slice(0, 2).toUpperCase();
  const referralCode = 'BD-' + handle.replace(/^@/, '').toUpperCase();

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => setAvatarModalVisible(true)}
          >
            <Text style={[styles.avatarText, { color: C.WHITE, fontSize: 28, fontWeight: '700' }]}>
              {initials}
            </Text>
          </TouchableOpacity>
          <Text style={styles.handle}>{handle}</Text>

          {/* Badge row */}
          <View style={styles.badgeRow}>
            <View style={styles.foundingBadge}>
              <Text style={styles.foundingBadgeText}>✦ Founding Member</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>3 day streak</Text>
            </View>
          </View>

          {/* Wallet pill */}
          <TouchableOpacity
            style={styles.walletPill}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.walletAmount}>
              {balancePence === null ? '...' : `£${(balancePence / 100).toFixed(2)}`}
            </Text>
            <Text style={styles.walletArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: stats ? String(stats.activeDraws) : '—', label: 'Active' },
            { value: stats ? String(stats.totalTickets) : '—', label: 'Tickets' },
            { value: stats ? String(stats.wins) : '—', label: 'Won' },
            { value: stats ? String(stats.totalDrawsEntered) : '—', label: 'Entered' },
          ].map(stat => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Seller nudge */}
        <TouchableOpacity
          style={styles.sellerNudge}
          onPress={() => navigation.navigate('BecomeSeller')}
        >
          <Text style={styles.sellerNudgeText}>Have something luxury to sell? Become a seller →</Text>
        </TouchableOpacity>

        {/* Achievements */}
        {isEnabled('ACHIEVEMENTS') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            <View style={styles.achievementGrid}>
              {ACHIEVEMENTS.map(ach => (
                <View key={ach.label} style={[styles.achievementCard, !ach.unlocked && styles.achievementLocked]}>
                  <Text style={styles.achievementEmoji}>{ach.emoji}</Text>
                  <Text style={[styles.achievementLabel, !ach.unlocked && styles.achievementLabelLocked]}>
                    {ach.label}
                  </Text>
                  {ach.progress && (
                    <Text style={styles.achievementProgress}>{ach.progress}</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Referral card */}
        {isEnabled('REFERRALS') && (
          <View style={styles.referralCard}>
            <Text style={styles.referralTitle}>Refer a friend, earn £1</Text>
            <Text style={styles.referralSub}>Your code: <Text style={styles.referralCode}>{referralCode}</Text></Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? 'Copied! ✓' : 'Copy code'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === 0 && styles.menuItemFirst]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Log out */}
          <TouchableOpacity style={styles.logoutItem} onPress={auth.logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>bedrawn · v1.0 · London, UK</Text>
      </ScrollView>

      <AvatarModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        initials={initials}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  profileSection: { alignItems: 'center', paddingVertical: S.xxl, paddingHorizontal: S.xl },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.PURPLE,
    marginBottom: S.md,
  },
  avatarText: { fontSize: 28, fontWeight: '700' },
  handle: { fontSize: 18, fontWeight: '800', color: C.TEXT, marginBottom: S.md },
  badgeRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap', justifyContent: 'center', marginBottom: S.md },
  foundingBadge: {
    backgroundColor: 'rgba(252,211,77,0.15)',
    borderWidth: 1,
    borderColor: C.GOLD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
  },
  foundingBadgeText: { color: C.GOLD, fontSize: 12, fontWeight: '700' },
  streakBadge: {
    backgroundColor: C.PURPLE_LIGHT,
    borderWidth: 1,
    borderColor: C.PURPLE,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
  },
  streakBadgeText: { color: C.PURPLE, fontSize: 12, fontWeight: '700' },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingHorizontal: S.xl,
    paddingVertical: S.sm,
    marginTop: S.sm,
  },
  walletAmount: { color: C.WHITE, fontSize: 16, fontWeight: '800' },
  walletArrow: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: S.xl,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: C.TEXT, fontWeight: '800', fontSize: 18 },
  statLabel: { color: C.GREY, fontSize: 11, marginTop: 2 },
  sellerNudge: {
    marginHorizontal: S.xl,
    backgroundColor: C.CARD2,
    borderRadius: 10,
    padding: S.md,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  sellerNudgeText: { color: C.GREY, fontSize: 13 },
  sectionHeader: { paddingHorizontal: S.xl, marginBottom: S.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: S.xl,
    gap: S.sm,
    marginBottom: S.lg,
  },
  achievementCard: {
    width: '30%',
    backgroundColor: C.CARD,
    borderRadius: 12,
    padding: S.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.PURPLE,
    gap: 4,
    flexGrow: 1,
  },
  achievementLocked: { borderColor: C.BORDER, opacity: 0.5 },
  achievementEmoji: { fontSize: 18 },
  achievementLabel: { color: C.TEXT, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  achievementLabelLocked: { color: C.MUTED },
  achievementProgress: { color: C.PURPLE, fontSize: 9, textAlign: 'center' },
  winCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginHorizontal: S.xl,
    marginBottom: S.sm,
    backgroundColor: C.CARD,
    borderRadius: 12,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  winThumb: { width: 52, height: 52, borderRadius: 8 },
  winInfo: { flex: 1 },
  winTitle: { color: C.TEXT, fontWeight: '600', fontSize: 13 },
  winValue: { color: C.GOLD, fontSize: 12, marginTop: 2 },
  winDate: { color: C.MUTED, fontSize: 11, marginTop: 2 },
  winStar: { fontSize: 22, color: C.GOLD },
  referralCard: {
    marginHorizontal: S.xl,
    marginVertical: S.lg,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  referralTitle: { color: C.TEXT, fontWeight: '700', fontSize: 15, marginBottom: S.sm },
  referralSub: { color: C.GREY, fontSize: 13, marginBottom: S.md },
  referralCode: { color: C.PURPLE, fontWeight: '700', fontFamily: 'monospace' },
  copyBtn: {
    backgroundColor: C.CARD2,
    borderRadius: 999,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  copyBtnText: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  menuSection: { paddingHorizontal: S.xl, marginBottom: S.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.lg,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
  },
  menuItemFirst: { borderTopWidth: 0 },
  menuItemLabel: { flex: 1, color: C.TEXT, fontSize: 15 },
  menuItemArrow: { color: C.MUTED, fontSize: 20 },
  logoutItem: {
    paddingVertical: S.lg,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    alignItems: 'center',
  },
  logoutText: { color: C.RED, fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', color: C.MUTED, fontSize: 12, paddingVertical: S.xxl },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: S.xxl,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.TEXT, textAlign: 'center', marginBottom: S.xl },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    justifyContent: 'center',
    marginBottom: S.xl,
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.CARD2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.BORDER,
  },
  avatarOptionSelected: { borderWidth: 3, borderColor: C.WHITE },
  saveBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  saveBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
});
