import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

export function BecomeSellerScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [firstItem, setFirstItem] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !firstItem) return;
    setLoading(true);
    await new Promise(res => setTimeout(res, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>

          {!submitted ? (
            <>
              <Text style={styles.emoji}>🏪</Text>
              <Text style={styles.title}>Become a DRAWN seller</Text>
              <Text style={styles.subtitle}>
                List your luxury items as draws and sell to thousands of buyers — while giving everyone a chance to win at a fraction of retail.
              </Text>

              {/* Benefits */}
              <View style={styles.benefitsCard}>
                {[
                  { emoji: '💰', text: 'Earn more than selling on Depop or eBay' },
                  { emoji: '🌍', text: 'Access our community of 50,000+ buyers' },
                  { emoji: '⚡', text: 'Items sell in hours, not weeks' },
                  { emoji: '🔒', text: 'We handle payments, disputes, and delivery' },
                ].map(b => (
                  <View key={b.text} style={styles.benefit}>
                    <Text style={styles.benefitEmoji}>{b.emoji}</Text>
                    <Text style={styles.benefitText}>{b.text}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>A bit about you</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Full name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={C.MUTED}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Instagram handle (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="@yourhandle"
                  placeholderTextColor={C.MUTED}
                  value={instagram}
                  onChangeText={setInstagram}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Describe your first item *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Chanel Classic Flap in black caviar, size M, excellent condition…"
                  placeholderTextColor={C.MUTED}
                  value={firstItem}
                  onChangeText={setFirstItem}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, (!name || !firstItem || loading) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!name || !firstItem || loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{loading ? 'Submitting…' : 'Apply to sell'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successState}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.title}>Application received!</Text>
              <Text style={styles.subtitle}>
                We'll review your application within 24 hours. You'll need to complete a quick KYC (identity verification) before listing.
              </Text>

              <View style={styles.kycCard}>
                <Text style={styles.kycTitle}>What happens next</Text>
                {[
                  { num: '1', text: 'Our team reviews your application' },
                  { num: '2', text: 'We\'ll email you with next steps within 24 hours' },
                  { num: '3', text: 'Complete KYC via our secure verification partner' },
                  { num: '4', text: 'Start listing your first item!' },
                ].map(step => (
                  <View key={step.num} style={styles.kycStep}>
                    <View style={styles.kycNum}>
                      <Text style={styles.kycNumText}>{step.num}</Text>
                    </View>
                    <Text style={styles.kycText}>{step.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.btnText}>Back to account</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  backBtn: { marginBottom: S.xl },
  back: { color: C.GREY, fontSize: 15 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: S.md },
  title: { fontSize: 26, fontWeight: '800', color: C.WHITE, marginBottom: S.sm, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.GREY, textAlign: 'center', lineHeight: 22, marginBottom: S.xl },
  benefitsCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    marginBottom: S.xl,
    gap: S.md,
  },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  benefitEmoji: { fontSize: 20, width: 28 },
  benefitText: { color: C.WHITE, fontSize: 14, flex: 1 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.GREY,
    letterSpacing: 0.5,
    marginBottom: S.md,
  },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs },
  input: {
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 10,
    padding: S.lg,
    color: C.WHITE,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  btn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginTop: S.sm,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  successState: { alignItems: 'center' },
  successEmoji: { fontSize: 64, marginBottom: S.lg, marginTop: S.xl },
  kycCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    marginBottom: S.xl,
    gap: S.md,
    width: '100%',
  },
  kycTitle: { color: C.WHITE, fontWeight: '700', fontSize: 15, marginBottom: S.sm },
  kycStep: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  kycNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycNumText: { color: C.WHITE, fontWeight: '800', fontSize: 13 },
  kycText: { color: C.GREY, fontSize: 13, flex: 1 },
});
