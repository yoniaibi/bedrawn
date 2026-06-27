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
import { useAuth } from '../../navigation/RootNavigator';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Interests'>;

const INTERESTS = [
  { label: 'Fashion' },
  { label: 'Watches' },
  { label: 'Luxury' },
  { label: 'Streetwear' },
  { label: 'Vintage' },
  { label: 'Bags' },
  { label: 'Trainers' },
  { label: 'Jewellery' },
  { label: 'Accessories' },
  { label: 'Tech' },
];

export function InterestsScreen({ navigation }: Props) {
  const auth = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (label: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleContinue = () => {
    auth.login();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          We'll personalise your feed based on your interests. You can change this later.
        </Text>

        <View style={styles.grid}>
          {INTERESTS.map(item => {
            const active = selected.has(item.label);
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggle(item.label)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.btn, selected.size === 0 && styles.btnMuted]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {selected.size > 0
              ? `Continue with ${selected.size} interest${selected.size > 1 ? 's' : ''}`
              : 'Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleContinue}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.TEXT,
    textAlign: 'center',
    marginTop: S.xl,
    marginBottom: S.sm,
  },
  subtitle: {
    fontSize: 14,
    color: C.GREY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: S.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    justifyContent: 'center',
    marginBottom: S.xxl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    borderWidth: 1.5,
    borderColor: C.BORDER,
    borderRadius: 999,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    backgroundColor: C.CARD,
  },
  chipActive: {
    borderColor: C.PURPLE,
    backgroundColor: C.PURPLE_LIGHT,
  },
  chipLabel: { color: C.GREY, fontSize: 14, fontWeight: '500' },
  chipLabelActive: { color: C.PURPLE, fontWeight: '700' },
  btn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginBottom: S.md,
  },
  btnMuted: { opacity: 0.7 },
  btnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: S.sm },
  skipText: { color: C.MUTED, fontSize: 14 },
});
