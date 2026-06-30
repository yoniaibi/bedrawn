import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawCard } from '../../components/DrawCard';
import { apiGetPublic } from '../../lib/api';
import { Draw } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface SellerProfile {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string;
  memberSince: string | null;
  completedDraws: number;
  totalValueGiven: number;
}

type Props = { route: { params: { sellerId: string } }; navigation: any };

function AvatarCircle({ name, avatarUrl, size = 64 }: { name: string; avatarUrl: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: C.WHITE }}>{initial}</Text>
    </View>
  );
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return 'Early member';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function SellerProfileScreen({ route, navigation }: Props) {
  const { sellerId } = route.params;
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetPublic<SellerProfile>(`/sellers/${sellerId}`),
      apiGetPublic<{ draws: Draw[] }>(`/sellers/${sellerId}/draws`),
    ]).then(([profileData, drawsData]) => {
      if (!profileData) { setNotFound(true); return; }
      setProfile(profileData);
      if (drawsData?.draws) setDraws(drawsData.draws);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [sellerId]);

  const displayName = profile ? (profile.name || `@${profile.handle}`) : '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.CORAL} />
        </View>
      ) : notFound || !profile ? (
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Seller not found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <AvatarCircle name={displayName} avatarUrl={profile.avatarUrl} size={64} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileHandle}>@{profile.handle}</Text>
                <Text style={styles.profileSince}>Member since {formatMemberSince(profile.memberSince)}</Text>
              </View>
            </View>

            {!!profile.bio && (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            )}

            {(profile.completedDraws > 0 || profile.totalValueGiven > 0) && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.completedDraws}</Text>
                  <Text style={styles.statLabel}>draws completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: C.GOLD }]}>
                    £{profile.totalValueGiven.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>value given away</Text>
                </View>
              </View>
            )}
          </View>

          {/* Their draws */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {draws.length > 0 ? `Active draws (${draws.length})` : 'No active draws'}
            </Text>

            {draws.length > 0 ? (
              <View style={styles.drawsGrid}>
                {draws.map(draw => (
                  <DrawCard
                    key={draw.id}
                    draw={draw}
                    fullWidth
                    onPress={() => navigation.navigate('DrawDetail', { draw })}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  {profile.name || `@${profile.handle}`} hasn't listed any active draws.
                </Text>
                {profile.completedDraws > 0 && (
                  <Text style={styles.emptySubText}>
                    They've completed {profile.completedDraws} draw{profile.completedDraws !== 1 ? 's' : ''} in the past.
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  back: { color: C.GREY, fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.TEXT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.GREY, fontSize: 15 },

  profileCard: {
    margin: S.xl,
    backgroundColor: C.CARD,
    borderRadius: 18,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.BORDER,
    gap: S.md,
  },
  profileTop: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  avatarFallback: {
    backgroundColor: C.CORAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.TEXT },
  profileHandle: { fontSize: 13, color: C.GREY },
  profileSince: { fontSize: 12, color: C.MUTED, marginTop: 4 },
  profileBio: { fontSize: 14, color: C.GREY, lineHeight: 21 },

  statsRow: {
    flexDirection: 'row',
    paddingTop: S.md,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: C.BORDER, marginHorizontal: S.sm },
  statValue: { fontSize: 22, fontWeight: '800', color: C.TEXT },
  statLabel: { fontSize: 11, color: C.GREY, textAlign: 'center' },

  section: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.md },
  drawsGrid: { gap: S.md },
  emptyCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
    gap: S.sm,
  },
  emptyText: { color: C.GREY, fontSize: 14, textAlign: 'center' },
  emptySubText: { color: C.MUTED, fontSize: 13, textAlign: 'center' },
});
