import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
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

const TOTAL_STEPS = 5;

const ITEM_TYPES = [
  { label: 'Bag / Purse' },
  { label: 'Watch' },
  { label: 'Trainers' },
  { label: 'Clothing' },
  { label: 'Jewellery' },
  { label: 'Bundle' },
];

const CONDITIONS = ['Brand New', 'Excellent', 'Very Good', 'Good', 'Fair'];
const CATEGORIES = ['Fashion', 'Bags', 'Trainers', 'Watches', 'Jewellery', 'Streetwear', 'Accessories', 'Bundles'];
const TICKET_PRICE_OPTIONS = [10, 20, 50, 100]; // pence
const RESERVE_OPTIONS = [25, 50, 75, 100]; // % of total tickets

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
  const [liquidated, setLiquidated] = useState(false);

  const go = (dir: 1 | -1) => {
    const next = step + dir;
    if (next < 1 || next > TOTAL_STEPS) {
      if (next > TOTAL_STEPS) navigation.goBack();
      return;
    }
    setStep(next);
  };

  const estimatedEarnings = () => {
    const tickets = parseInt(totalTickets, 10) || 0;
    const gross = (tickets * ticketPrice) / 100;
    const net = gross * 0.9; // 10% platform fee
    return { gross: gross.toFixed(2), net: net.toFixed(2) };
  };

  const { gross, net } = estimatedEarnings();
  const reserveTickets = Math.ceil(((parseInt(totalTickets, 10) || 0) * reservePct) / 100);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>✕ Cancel</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < step && styles.progressDotActive]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>{step} / {TOTAL_STEPS}</Text>
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
                  <Text style={[styles.typeLabel, itemType === t.label && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSub}>Add up to 6 photos. First photo is the cover image.</Text>
            <View style={styles.photoGrid}>
              {Array.from({ length: 6 }, (_, i) => (
                <TouchableOpacity key={i} style={styles.photoSlot}>
                  <Text style={styles.photoSlotIcon}>+</Text>
                  <Text style={styles.photoSlotText}>{i === 0 ? 'Cover' : 'Photo'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
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
              <View style={styles.conditionRow}>
                {CONDITIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.conditionPill, condition === c && styles.conditionPillActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
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
                    <Text style={[styles.priceText, ticketPrice === p && styles.priceTextActive]}>
                      {p}p
                    </Text>
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
              <Text style={styles.label}>Reserve — minimum tickets to proceed</Text>
              <Text style={styles.reserveHint}>
                If fewer than this many tickets are sold, the draw cancels and buyers are fully refunded. Like an auction reserve — set higher to protect your item.
              </Text>
              <View style={styles.ticketPriceRow}>
                {RESERVE_OPTIONS.map(pct => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.pricePill, reservePct === pct && styles.pricePillActive]}
                    onPress={() => setReservePct(pct)}
                  >
                    <Text style={[styles.priceText, reservePct === pct && styles.priceTextActive]}>
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!totalTickets && (
                <Text style={styles.reserveNote}>
                  Reserve = {reserveTickets.toLocaleString()} tickets
                  {reservePct === 100 ? ' — draw only proceeds at full sell-out' : ''}
                </Text>
              )}
            </View>

            {/* Earnings preview */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsTitle}>Earnings preview</Text>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Gross (if sold out)</Text>
                <Text style={styles.earningsValue}>£{gross}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Platform fee (10%)</Text>
                <Text style={styles.earningsNeg}>−£{(parseFloat(gross) - parseFloat(net)).toFixed(2)}</Text>
              </View>
              <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                <Text style={styles.earningsTotalLabel}>You receive</Text>
                <Text style={styles.earningsTotalValue}>£{net}</Text>
              </View>
              <Text style={styles.earningsReserve}>
                Draw needs {reserveTickets.toLocaleString()} tickets sold ({reservePct}% reserve) or it cancels and buyers are refunded
              </Text>
            </View>
          </View>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Review & submit</Text>
            <Text style={styles.stepSub}>Please review your listing before submitting.</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Item: </Text>
                <Text style={styles.reviewValue}>{title || '(not set)'}</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type: </Text>
                <Text style={styles.reviewValue}>{itemType || '(not set)'}</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Condition: </Text>
                <Text style={styles.reviewValue}>{condition || '(not set)'}</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>RRP: </Text>
                <Text style={styles.reviewValue}>£{retailValue || '0'}</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Ticket price: </Text>
                <Text style={styles.reviewValue}>{ticketPrice}p</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Total tickets: </Text>
                <Text style={styles.reviewValue}>{totalTickets}</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Reserve: </Text>
                <Text style={styles.reviewValue}>{reservePct}% ({reserveTickets.toLocaleString()} tickets)</Text>
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>You'll earn: </Text>
                <Text style={[styles.reviewValue, styles.reviewGold]}>£{net} (if sold out)</Text>
              </Text>
            </View>

            {/* Liquidated damages checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setLiquidated(v => !v)}
            >
              <View style={[styles.checkbox, liquidated && styles.checkboxChecked]}>
                {liquidated && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I understand that bedrawn may claim liquidated damages if I withdraw this listing after tickets have been sold.
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => go(-1)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            step === 1 && !itemType && styles.nextButtonDisabled,
            step === 5 && !liquidated && styles.nextButtonDisabled,
          ]}
          onPress={() => go(1)}
          disabled={(step === 1 && !itemType) || (step === 5 && !liquidated)}
        >
          <Text style={styles.nextButtonText}>
            {step === TOTAL_STEPS ? 'Submit listing' : 'Next →'}
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
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.BORDER,
  },
  progressDotActive: { backgroundColor: C.PURPLE },
  stepLabel: { color: C.GREY, fontSize: 13 },
  content: { padding: S.xl, paddingBottom: 120 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.TEXT, marginBottom: S.sm },
  stepSub: { color: C.GREY, fontSize: 14, marginBottom: S.xl, lineHeight: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  typeCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: C.CARD,
    borderRadius: 14,
    padding: S.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.BORDER,
    gap: S.xs,
  },
  typeCardActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  typeLabel: { color: C.GREY, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: C.PURPLE },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  photoSlot: {
    width: '30%',
    aspectRatio: 1,
    flexGrow: 1,
    backgroundColor: C.CARD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.BORDER,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
  },
  photoSlotIcon: { fontSize: 24 },
  photoSlotText: { color: C.MUTED, fontSize: 11 },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs, letterSpacing: 0.5 },
  input: {
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 10,
    padding: S.lg,
    color: C.TEXT,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  conditionPill: {
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderWidth: 1,
    borderColor: C.BORDER,
    backgroundColor: C.CARD,
  },
  conditionPillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  conditionText: { color: C.GREY, fontSize: 13 },
  conditionTextActive: { color: C.PURPLE, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  catChip: {
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderWidth: 1,
    borderColor: C.BORDER,
    backgroundColor: C.CARD,
  },
  catChipActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  catChipText: { color: C.GREY, fontSize: 13 },
  catChipTextActive: { color: C.PURPLE, fontWeight: '600' },
  ticketPriceRow: { flexDirection: 'row', gap: S.md },
  pricePill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: S.md,
    alignItems: 'center',
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  pricePillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  priceText: { color: C.GREY, fontSize: 16, fontWeight: '700' },
  priceTextActive: { color: C.PURPLE },
  earningsCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    gap: S.sm,
  },
  earningsTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, marginBottom: S.xs },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsLabel: { color: C.GREY, fontSize: 13 },
  earningsValue: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  earningsNeg: { color: C.RED, fontSize: 13 },
  earningsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    paddingTop: S.sm,
    marginTop: S.xs,
  },
  earningsTotalLabel: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  earningsTotalValue: { color: C.GREEN, fontWeight: '800', fontSize: 16 },
  earningsReserve: { color: C.GOLD, fontSize: 12, fontWeight: '600', marginTop: S.xs, lineHeight: 17 },
  reserveHint: { color: C.MUTED, fontSize: 12, lineHeight: 17, marginBottom: S.sm },
  reserveNote: { color: C.MUTED, fontSize: 12, marginTop: S.sm },
  reviewCard: {
    backgroundColor: C.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: S.lg,
    gap: S.sm,
    marginBottom: S.xl,
  },
  reviewRow: { fontSize: 14, lineHeight: 22 },
  reviewLabel: { color: C.GREY },
  reviewValue: { color: C.TEXT, fontWeight: '600' },
  reviewGold: { color: C.GOLD },
  checkboxRow: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: C.PURPLE, borderColor: C.PURPLE },
  checkmark: { color: C.WHITE, fontSize: 13, fontWeight: '800' },
  checkboxText: { color: C.GREY, fontSize: 13, flex: 1, lineHeight: 20 },
  navButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: S.md,
    padding: S.xl,
    paddingBottom: S.xxl,
    backgroundColor: C.BG,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
  },
  backButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  backButtonText: { color: C.GREY, fontWeight: '600', fontSize: 15 },
  nextButton: {
    flex: 2,
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
});
