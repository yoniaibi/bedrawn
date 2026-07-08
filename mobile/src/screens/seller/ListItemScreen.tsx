import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

// LegitApp cheapest tier fees (sourced from legitapp.com/pricing, pence)
const LEGIT_FEE_MAP: Record<string, { feePence: number; turnaround: string; hints: string[] }> = {
  Bags:       { feePence: 800,  turnaround: '3 hours', hints: ['Front of bag', 'Back of bag', 'Interior lining', 'Serial / date code stamp', 'Hardware closeup', 'Logo closeup'] },
  Trainers:   { feePence: 250,  turnaround: '30 min',  hints: ['Both shoes from front', 'Side profile (both)', 'Sole (both)', 'Tongue label with size', 'Box with label'] },
  Watches:    { feePence: 1200, turnaround: '4 hours', hints: ['Dial (front)', 'Side (both sides)', 'Caseback', 'Crown', 'Serial engraving', 'Box & papers if present'] },
  Jewellery:  { feePence: 800,  turnaround: '3 hours', hints: ['Front', 'Back', 'Hallmark / stamp', 'Clasp / closure', 'Brand markings'] },
  Streetwear: { feePence: 320,  turnaround: '4 hours', hints: ['Front full garment', 'Back full garment', 'Inside neck label', 'Size tag', 'Logo closeup'] },
  Fashion:    { feePence: 800,  turnaround: '3 hours', hints: ['Front full', 'Back full', 'Care label', 'Size label', 'Brand tag', 'Logo / stitching closeup'] },
};
const DESIGNER_CATEGORIES = new Set(Object.keys(LEGIT_FEE_MAP));

// Step layout: 1=Type, 2=Details, 3=Auth(designer), 4=Photos, 5=Pricing, 6=Review
const TOTAL_STEPS_DESIGNER = 6;
const TOTAL_STEPS_SHORT = 5;

const ITEM_TYPES = [
  { label: 'Bag / Purse' },
  { label: 'Watch' },
  { label: 'Trainers' },
  { label: 'Clothing' },
  { label: 'Jewellery' },
  { label: 'Bundle' },
];

const CONDITIONS = ['Brand New', 'Excellent', 'Very Good', 'Good', 'Fair'];
const CATEGORIES = ['Bags', 'Trainers', 'Watches', 'Jewellery', 'Streetwear', 'Fashion', 'Tech', 'Other'];
const TICKET_PRICE_OPTIONS = [10, 20, 50, 100]; // pence
const RESERVE_OPTIONS = [25, 50, 75, 100];

export function ListItemScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [itemType, setItemType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');
  const [retailValue, setRetailValue] = useState('');
  const [ticketPrice, setTicketPrice] = useState(10);
  const [totalTickets, setTotalTickets] = useState('100');
  const [reservePct, setReservePct] = useState(25);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [liquidated, setLiquidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDesigner = DESIGNER_CATEGORIES.has(category);
  const legitInfo = LEGIT_FEE_MAP[category];
  const TOTAL_STEPS = isDesigner ? TOTAL_STEPS_DESIGNER : TOTAL_STEPS_SHORT;

  // Map physical step to display step (auth step is step 3 but only counts for designer)
  const displayStep = (!isDesigner && step >= 3) ? step - 1 : step;

  function goNext() {
    if (step === 1 && !itemType) { Alert.alert('Select a type', 'Please select an item type to continue.'); return; }
    if (step === 2) {
      if (!title.trim()) { Alert.alert('Add a title', 'Please enter a title for your item.'); return; }
      if (!condition) { Alert.alert('Select condition', 'Please select the condition of your item.'); return; }
      if (!category) { Alert.alert('Select a category', 'Please select a category.'); return; }
      // Jump over auth step if not designer
      setStep(isDesigner ? 3 : 4);
      return;
    }
    if (step === 4 && !title) { /* photos — no required validation in mobile (no real upload yet) */ }
    const next = step + 1;
    if (next > TOTAL_STEPS_DESIGNER) { handleSubmit(); return; }
    setStep(next);
  }

  function goBack() {
    if (step <= 1) { navigation.goBack(); return; }
    // Jump over auth step backwards if not designer
    if (step === 4) { setStep(isDesigner ? 3 : 2); return; }
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    if (!liquidated) { Alert.alert('Please agree', 'Please confirm the terms before submitting.'); return; }
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not logged in');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/draws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, category, condition,
          type: itemType.toLowerCase().replace(' / ', '-'),
          ticketPrice: `${ticketPrice}p`,
          totalTickets, retailValue, reservePct,
          verificationRequested,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const message = data.pendingVerification
        ? `Your item has been sent to LegitApp for authentication. This takes ${legitInfo?.turnaround ?? 'a few hours'}. We'll email you once verified.`
        : "Your listing is being reviewed and will be live shortly.";
      Alert.alert('Submitted!', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const tickets = parseInt(totalTickets, 10) || 0;
  const gross = ((tickets * ticketPrice) / 100).toFixed(2);
  const platformFee = ((tickets * ticketPrice * 0.12) / 100).toFixed(2);
  const legitFee = verificationRequested && legitInfo ? (legitInfo.feePence / 100).toFixed(2) : '0.00';
  const net = ((tickets * ticketPrice * 0.88) / 100 - (verificationRequested && legitInfo ? legitInfo.feePence / 100 : 0)).toFixed(2);
  const reserveTickets = Math.ceil((tickets * reservePct) / 100);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.cancel}>{step === 1 ? '✕ Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.progressDot, i < displayStep && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{displayStep} / {TOTAL_STEPS}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Step 1: Type */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>What are you listing?</Text>
            <Text style={styles.stepSub}>Choose the type that best describes your item.</Text>
            <View style={styles.typeGrid}>
              {ITEM_TYPES.map(t => (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.typeCard, itemType === t.label && styles.typeCardActive]}
                  onPress={() => setItemType(t.label)}
                >
                  <Text style={[styles.typeLabel, itemType === t.label && styles.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Item details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chanel Classic Flap — Black Caviar, M"
                placeholderTextColor={C.MUTED}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item honestly — authentication, size, any defects…"
                placeholderTextColor={C.MUTED}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.chipRow}>
                {CONDITIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, condition === c && styles.chipActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {category && DESIGNER_CATEGORIES.has(category) && (
                <Text style={styles.authHint}>✓ Authentication available — you'll choose on the next step</Text>
              )}
            </View>
          </View>
        )}

        {/* Step 3: Authentication (designer only) */}
        {step === 3 && legitInfo && (
          <View>
            <Text style={styles.stepTitle}>Authenticate this item?</Text>
            <Text style={styles.stepSub}>
              LegitApp expert authenticators verify your {category.toLowerCase()}. Verified listings earn a trust badge that increases buyer confidence and ticket sales.
            </Text>

            <TouchableOpacity
              style={[styles.authOption, !verificationRequested && styles.authOptionSelected]}
              onPress={() => setVerificationRequested(false)}
            >
              <View style={styles.authOptionHeader}>
                <Text style={[styles.authOptionTitle, !verificationRequested && { color: C.PURPLE }]}>No authentication</Text>
                {!verificationRequested && <Text style={styles.selectedBadge}>✓ Selected</Text>}
              </View>
              <Text style={styles.authOptionDesc}>List immediately. No badge. Buyer trust based on photos and description alone.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authOption, styles.authOptionGold, verificationRequested && styles.authOptionGoldSelected]}
              onPress={() => setVerificationRequested(true)}
            >
              <View style={styles.authOptionHeader}>
                <Text style={[styles.authOptionTitle, verificationRequested && { color: C.GOLD }]}>LegitApp authentication</Text>
                <View style={styles.feeBadge}>
                  <Text style={styles.feeBadgeText}>£{(legitInfo.feePence / 100).toFixed(2)}</Text>
                </View>
              </View>
              <Text style={styles.authOptionDesc}>
                Two experts review your photos. Result in {legitInfo.turnaround}. Listing goes live only after passing. Fee deducted from your payout.
              </Text>
              <View style={styles.authFeatures}>
                {['Expert reviewed', 'Certificate issued', 'Verified badge', 'From payout'].map(f => (
                  <View key={f} style={styles.authFeaturePill}>
                    <Text style={styles.authFeaturePillText}>{f}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            {verificationRequested && (
              <View style={styles.authNote}>
                <Text style={styles.authNoteText}>
                  £{(legitInfo.feePence / 100).toFixed(2)} will be deducted from your payout when the draw resolves. No upfront payment required.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Add photos</Text>
            {verificationRequested && legitInfo ? (
              <View style={styles.photoHintsBox}>
                <Text style={styles.photoHintsTitle}>LegitApp requires these shots for {category.toLowerCase()}:</Text>
                {legitInfo.hints.map((hint, i) => (
                  <Text key={hint} style={styles.photoHint}>  {i + 1}. {hint}</Text>
                ))}
              </View>
            ) : (
              <Text style={styles.stepSub}>Add up to 6 photos. First photo is the cover image.</Text>
            )}
            <View style={styles.photoGrid}>
              {Array.from({ length: 6 }, (_, i) => (
                <TouchableOpacity key={i} style={styles.photoSlot}>
                  <Text style={styles.photoSlotIcon}>+</Text>
                  <Text style={styles.photoSlotText}>
                    {verificationRequested && legitInfo ? (legitInfo.hints[i] ?? `Photo ${i + 1}`) : (i === 0 ? 'Cover' : 'Photo')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 5: Pricing */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Set your pricing</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Retail / market value (£)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1200"
                placeholderTextColor={C.MUTED}
                value={retailValue}
                onChangeText={setRetailValue}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ticket price</Text>
              <View style={styles.ticketPriceRow}>
                {TICKET_PRICE_OPTIONS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pricePill, ticketPrice === p && styles.pricePillActive]}
                    onPress={() => setTicketPrice(p)}
                  >
                    <Text style={[styles.priceText, ticketPrice === p && styles.priceTextActive]}>{p}p</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Total tickets</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 100"
                placeholderTextColor={C.MUTED}
                value={totalTickets}
                onChangeText={setTotalTickets}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Reserve</Text>
              <Text style={styles.reserveHint}>Draw cancels and buyers are fully refunded if fewer than this % of tickets are sold.</Text>
              <View style={styles.ticketPriceRow}>
                {RESERVE_OPTIONS.map(pct => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.pricePill, reservePct === pct && styles.pricePillActive]}
                    onPress={() => setReservePct(pct)}
                  >
                    <Text style={[styles.priceText, reservePct === pct && styles.priceTextActive]}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!totalTickets && (
                <Text style={styles.reserveNote}>Reserve = {reserveTickets.toLocaleString()} tickets</Text>
              )}
            </View>

            <View style={styles.earningsCard}>
              <Text style={styles.earningsTitle}>Earnings preview (full sell-out)</Text>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Gross</Text>
                <Text style={styles.earningsValue}>£{gross}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Platform fee (12%)</Text>
                <Text style={styles.earningsNeg}>−£{platformFee}</Text>
              </View>
              {verificationRequested && legitInfo && (
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>LegitApp authentication</Text>
                  <Text style={[styles.earningsNeg, { color: C.GOLD }]}>−£{legitFee}</Text>
                </View>
              )}
              <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                <Text style={styles.earningsTotalLabel}>You receive</Text>
                <Text style={styles.earningsTotalValue}>£{net}</Text>
              </View>
              <Text style={styles.earningsReserve}>
                Needs {reserveTickets.toLocaleString()} tickets ({reservePct}% reserve) or cancels
              </Text>
            </View>
          </View>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <View>
            <Text style={styles.stepTitle}>Review & submit</Text>
            <Text style={styles.stepSub}>Check everything before submitting.</Text>

            <View style={styles.reviewCard}>
              {[
                ['Item', title || '(not set)'],
                ['Type', itemType || '(not set)'],
                ['Condition', condition || '(not set)'],
                ['Category', category || '(not set)'],
                ['Authentication', verificationRequested && legitInfo ? `LegitApp (£${(legitInfo.feePence / 100).toFixed(2)} from payout)` : 'None'],
                ['RRP', `£${retailValue || '0'}`],
                ['Ticket price', `${ticketPrice}p`],
                ['Total tickets', totalTickets],
                ['Reserve', `${reservePct}% (${reserveTickets.toLocaleString()} tickets)`],
                ["You'll earn", `£${net} (if sold out)`],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{label}</Text>
                  <Text style={[styles.reviewValue, label === 'Authentication' && verificationRequested ? { color: C.GOLD } : {}]}>{value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setLiquidated(v => !v)}>
              <View style={[styles.checkbox, liquidated && styles.checkboxChecked]}>
                {liquidated && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I confirm the item is as described and agree to the bedrawn seller terms.
                {verificationRequested && legitInfo
                  ? ` I agree that £${(legitInfo.feePence / 100).toFixed(2)} will be deducted from my payout for LegitApp authentication.`
                  : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 6 && (!liquidated || submitting)) && styles.nextButtonDisabled,
          ]}
          onPress={step === 6 ? handleSubmit : goNext}
          disabled={step === 6 && (!liquidated || submitting)}
        >
          <Text style={styles.nextButtonText}>
            {step === 6 ? (submitting ? 'Submitting…' : 'Submit listing') : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  cancel: { color: C.MUTED, fontSize: 14 },
  progressDots: { flexDirection: 'row', gap: S.xs },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.BORDER },
  progressDotActive: { backgroundColor: C.PURPLE },
  stepLabel: { color: C.GREY, fontSize: 13 },
  content: { padding: S.xl, paddingBottom: 120 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.TEXT, marginBottom: S.sm },
  stepSub: { color: C.GREY, fontSize: 14, marginBottom: S.xl, lineHeight: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  typeCard: {
    width: '30%', flexGrow: 1, backgroundColor: C.CARD, borderRadius: 14,
    padding: S.lg, alignItems: 'center', borderWidth: 1.5, borderColor: C.BORDER, gap: S.xs,
  },
  typeCardActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  typeLabel: { color: C.GREY, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: C.PURPLE },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs, letterSpacing: 0.5 },
  input: {
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER,
    borderRadius: 10, padding: S.lg, color: C.TEXT, fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: {
    borderRadius: 999, paddingHorizontal: S.md, paddingVertical: S.xs,
    borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.CARD,
  },
  chipActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  chipText: { color: C.GREY, fontSize: 13 },
  chipTextActive: { color: C.PURPLE, fontWeight: '600' },
  authHint: { color: C.GOLD, fontSize: 12, marginTop: S.sm },
  authOption: {
    borderRadius: 12, borderWidth: 2, borderColor: C.BORDER,
    backgroundColor: C.CARD, padding: S.lg, marginBottom: S.md,
  },
  authOptionSelected: { borderColor: C.PURPLE, backgroundColor: 'rgba(139,92,246,0.06)' },
  authOptionGold: { borderColor: C.BORDER },
  authOptionGoldSelected: { borderColor: C.GOLD, backgroundColor: 'rgba(245,158,11,0.06)' },
  authOptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs },
  authOptionTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  selectedBadge: { color: C.PURPLE, fontSize: 12, fontWeight: '600' },
  feeBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: C.GOLD,
    borderRadius: 999, paddingHorizontal: S.sm, paddingVertical: 2,
  },
  feeBadgeText: { color: C.GOLD, fontSize: 11, fontWeight: '700' },
  authOptionDesc: { color: C.GREY, fontSize: 12, lineHeight: 17, marginBottom: S.sm },
  authFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  authFeaturePill: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)', borderRadius: 999, paddingHorizontal: S.sm, paddingVertical: 2,
  },
  authFeaturePillText: { color: C.GOLD, fontSize: 10 },
  authNote: {
    backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)', borderRadius: 10, padding: S.md,
  },
  authNoteText: { color: C.GOLD, fontSize: 12, lineHeight: 17 },
  photoHintsBox: {
    backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)', borderRadius: 10, padding: S.md, marginBottom: S.lg,
  },
  photoHintsTitle: { color: C.GOLD, fontWeight: '700', fontSize: 13, marginBottom: S.sm },
  photoHint: { color: C.GREY, fontSize: 12, lineHeight: 20 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  photoSlot: {
    width: '30%', aspectRatio: 1, flexGrow: 1, backgroundColor: C.CARD,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: S.xs, padding: S.xs,
  },
  photoSlotIcon: { fontSize: 24, color: C.MUTED },
  photoSlotText: { color: C.MUTED, fontSize: 9, textAlign: 'center' },
  ticketPriceRow: { flexDirection: 'row', gap: S.md },
  pricePill: {
    flex: 1, borderRadius: 10, paddingVertical: S.md, alignItems: 'center',
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER,
  },
  pricePillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  priceText: { color: C.GREY, fontSize: 16, fontWeight: '700' },
  priceTextActive: { color: C.PURPLE },
  reserveHint: { color: C.MUTED, fontSize: 12, lineHeight: 17, marginBottom: S.sm },
  reserveNote: { color: C.MUTED, fontSize: 12, marginTop: S.sm },
  earningsCard: {
    backgroundColor: C.CARD, borderRadius: 14, borderWidth: 1,
    borderColor: C.BORDER, padding: S.lg, gap: S.sm,
  },
  earningsTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, marginBottom: S.xs },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsLabel: { color: C.GREY, fontSize: 13 },
  earningsValue: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  earningsNeg: { color: C.RED, fontSize: 13 },
  earningsTotalRow: { borderTopWidth: 1, borderTopColor: C.BORDER, paddingTop: S.sm, marginTop: S.xs },
  earningsTotalLabel: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  earningsTotalValue: { color: C.GREEN, fontWeight: '800', fontSize: 16 },
  earningsReserve: { color: C.GOLD, fontSize: 12, fontWeight: '600', marginTop: S.xs, lineHeight: 17 },
  reviewCard: {
    backgroundColor: C.CARD, borderRadius: 14, borderWidth: 1,
    borderColor: C.BORDER, padding: S.lg, marginBottom: S.xl,
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: S.xs },
  reviewLabel: { color: C.GREY, fontSize: 13 },
  reviewValue: { color: C.TEXT, fontWeight: '600', fontSize: 13, maxWidth: '60%', textAlign: 'right' },
  checkboxRow: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: C.PURPLE, borderColor: C.PURPLE },
  checkmark: { color: C.WHITE, fontSize: 13, fontWeight: '800' },
  checkboxText: { color: C.GREY, fontSize: 13, flex: 1, lineHeight: 20 },
  navButtons: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: S.md, padding: S.xl, paddingBottom: S.xxl,
    backgroundColor: C.BG, borderTopWidth: 1, borderTopColor: C.BORDER,
  },
  backButton: {
    flex: 1, borderRadius: 999, paddingVertical: S.lg, alignItems: 'center',
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER,
  },
  backButtonText: { color: C.GREY, fontWeight: '600', fontSize: 15 },
  nextButton: { flex: 2, backgroundColor: C.PURPLE, borderRadius: 999, paddingVertical: S.lg, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
});
