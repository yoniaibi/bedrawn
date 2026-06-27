import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawCard } from '../../components/DrawCard';
import { draws } from '../../data/mockData';
import { AccountStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';
import { ScrollView } from 'react-native';

type Nav = NativeStackNavigationProp<AccountStackParamList>;

// Mock 3 saved draws
const savedDraws = draws.filter(d => d.isVerified && d.isClosingTonight).slice(0, 3);

export function SavedDrawsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Draws ({savedDraws.length})</Text>
        <View style={{ width: 60 }} />
      </View>

      {savedDraws.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {savedDraws.map(draw => (
              <DrawCard
                key={draw.id}
                draw={draw}
                onPress={() => navigation.navigate('DrawDetail', { draw })}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No saved draws yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the ☆ on any draw card to save it here.
          </Text>
        </View>
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
  title: { fontSize: 17, fontWeight: '700', color: C.TEXT },
  content: { padding: S.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.TEXT, marginBottom: S.sm },
  emptySubtitle: { fontSize: 14, color: C.GREY, textAlign: 'center' },
});
