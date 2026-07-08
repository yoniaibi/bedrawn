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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '../../lib/api';
import { LAUNCH_BRANDS, BAG_MODELS, BrandId, MIN_RETAIL_VALUE_PENCE } from '../../config/brands';
import { computeValuation, formatPence, formatTicketPrice, ValuationResult, Condition } from '../../services/valuation';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

// Step layout: 1=Brand & model, 2=Photos, 3=Auth photos, 4=Valuation, 5=Pricing, 6=Review
const TOTAL_STEPS = 6;

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: 'pristine',  label: 'Pristine',  desc: 'Unused or worn once, flawless' },
  { value: 'excellent', label: 'Excellent', desc: 'Light use, minimal signs of wear' },
  { value: 'good',      label: 'Good',      desc: 'Visible wear, well maintained' },
  { value: 'fair',      label: 'Fair',      desc: 'Heavy use, visible marks/scuffs' },
];

const AUTH_PHOTO_REQUIREMENTS = [
  'Logo stamp close-up',
  'Hardware engraving',
  'Serial number / date code',
  'Stitching detail',
  'Interior label',
  'Dust bag (if present)',
];

const INCLUDES_OPTIONS: { key: 'hasBox' | 'hasDustBag' | 'hasReceipt' | 'hasAuthCard'; label: string }[] = [
  { key: 'hasBox',      label: 'Original box' },
  { key: 'hasDustBag',  label: 'Dust bag' },
  { key: 'hasReceipt',  label: 'Receipt / proof of purchase' },
  { key: 'hasAuthCard', label: 'Authenticity card' },
];

const TICKET_PRICE_OPTIONS = [10, 20, 30, 50, 100, 200]; // pence
const RESERVE_OPTIONS = [25, 50, 75, 100];

export function ListItemScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  // Step 1 state
  const [brandId, setBrandId] = useState<BrandId | ''>('');
  const [model, setModel] = useState('');
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [condition, setCondition] = useState<Condition | ''>('');
  const [yearPurchased, setYearPurchased] = useState('');
  const [hasBox, setHasBox] = useState(false);
  const [hasDustBag, setHasDustBag] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [hasAuthCard, setHasAuthCard] = useState(false);
  // Step 3 state
  const [authPhotoCaptured, setAuthPhotoCaptured] = useState<Record<string, boolean>>({});
  // Step 4 state
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [useValuationSuggestion, setUseValuationSuggestion] = useState(true);
  // Step 5 state
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState(10);
  const [totalTickets, setTotalTickets] = useState('');
  const [reservePct, setReservePct] = useState(25);
  const [drawDurationDays, setDrawDurationDays] = useState(14); // default 14 days per spec
  const [liquidated, setLiquidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const includesState = { hasBox, hasDustBag, hasReceipt, hasAuthCard };
  const includesSetters = {
    hasBox: setHasBox,
    hasDustBag: setHasDustBag,
    hasReceipt: setHasReceipt,
    hasAuthCard: setHasAuthCard,
  };

  const brandLabel = LAUNCH_BRANDS.find(b => b.id === brandId)?.label ?? '';
  const conditionLabel = CONDITIONS.find(c => c.value === condition)?.label ?? '';

  function addDays(n: number): string {
    const d = new Date(Date.now() + n * 86_400_000);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function handleModelInput(text: string) {
    setModel(text);
    if (brandId && text.length >= 2) {
      const allModels = BAG_MODELS[brandId as BrandId] ?? [];
      const matches = allModels.filter(m => m.toLowerCase().includes(text.toLowerCase())).slice(0, 5);
      setModelSuggestions(matches);
    } else {
      setModelSuggestions([]);
    }
  }

  function goNext() {
    // Step 1 validation
    if (step === 1) {
      if (!brandId) { Alert.alert('Select a brand', 'Choose one of the five launch brands.'); return; }
      if (!model.trim()) { Alert.alert('Enter model', 'Type or select the bag model.'); return; }
      if (!condition) { Alert.alert('Select condition', 'Choose the condition grade.'); return; }
      // Validate minimum retail value hint — not enforced here (enforced in step 5 via valuation)
      // Compute valuation when moving to step 4
      const result = computeValuation({
        brandId: brandId as BrandId,
        model,
        condition: condition as Condition,
        hasBox, hasDustBag, hasReceipt, hasAuthCard,
      });
      setValuation(result);
      if (useValuationSuggestion || !totalTickets) {
        setTicketPrice(result.suggestedTicketPricePence);
        setTotalTickets(String(result.suggestedTotalTickets));
      }
      setStep(2);
      return;
    }
    if (step === 2) { setStep(3); return; } // photos → auth photos
    if (step === 3) { setStep(4); return; } // auth photos → valuation
    if (step === 4) {
      // Apply valuation suggestion if chosen
      if (useValuationSuggestion && valuation) {
        setTicketPrice(valuation.suggestedTicketPricePence);
        setTotalTickets(String(valuation.suggestedTotalTickets));
      }
      setStep(5);
      return;
    }
    if (step === 5) { setStep(6); return; }
    if (step === 6) { handleSubmit(); return; }
  }

  function chooseSuggestion() {
    if (valuation) {
      setTicketPrice(valuation.suggestedTicketPricePence);
      setTotalTickets(String(valuation.suggestedTotalTickets));
    }
    setUseValuationSuggestion(true);
    setStep(5);
  }

  function chooseOwnPrice() {
    setUseValuationSuggestion(false);
    setStep(5);
  }

  function goBack() {
    if (step <= 1) { navigation.goBack(); return; }
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    if (!liquidated) { Alert.alert('Please agree', 'Confirm the terms before submitting.'); return; }
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not logged in');
      const tickets = parseInt(totalTickets, 10) || 0;
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/draws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: `${LAUNCH_BRANDS.find(b => b.id === brandId)?.label} ${model}`,
          description,
          category: 'Bags',
          brandId,
          model,
          condition,
          type: 'single',
          ticketPrice: `${ticketPrice}p`,
          totalTickets: tickets,
          retailValue: valuation ? Math.round(valuation.estimatedValuePence / 100) : 0,
          reservePct,
          verificationRequested: true, // always request auth for bags
          drawDurationDays,
          hasBox, hasDustBag, hasReceipt, hasAuthCard,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      Alert.alert('Submitted!', 'Your bag has been sent to LEGIT APP for photo authentication. This usually takes under 24 hours. We\'ll notify you once it passes.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const tickets = parseInt(totalTickets, 10) || 0;
  const grossPence = tickets * ticketPrice;
  const netPence = Math.round(grossPence * 0.88);
  const gross = (grossPence / 100).toFixed(2);
  const platformFee = ((grossPence * 0.12) / 100).toFixed(2);
  const net = (netPence / 100).toFixed(2);
  const reserveTickets = Math.ceil((tickets * reservePct) / 100);
  const showLowPayoutHint = !!valuation && tickets > 0 && netPence < valuation.estimatedValuePence * 0.85;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.cancel}>{step === 1 ? '✕ Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.progressDot, i < step && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{step} / {TOTAL_STEPS}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Step 1: Brand & model */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>What's your bag?</Text>
            <Text style={styles.stepSub}>We'll estimate its value and suggest a ticket price.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Brand</Text>
              <View style={styles.brandGrid}>
                {LAUNCH_BRANDS.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.brandChip, brandId === b.id && styles.brandChipActive]}
                    onPress={() => {
                      setBrandId(b.id);
                      setModelSuggestions([]);
                    }}
                  >
                    <Text style={[styles.brandLabel, brandId === b.id && styles.brandLabelActive]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder={brandId ? `e.g. ${(BAG_MODELS[brandId as BrandId] ?? [])[0] ?? 'Model name'}` : 'Select a brand first'}
                placeholderTextColor={C.MUTED}
                value={model}
                onChangeText={handleModelInput}
                editable={!!brandId}
              />
              {modelSuggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  <FlatList
                    data={modelSuggestions}
                    keyExtractor={m => m}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setModel(item);
                          setModelSuggestions([]);
                        }}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.conditionGrid}>
                {CONDITIONS.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.conditionCard, condition === c.value && styles.conditionCardActive]}
                    onPress={() => setCondition(c.value)}
                  >
                    <Text style={styles.conditionLabel}>{c.label}</Text>
                    <Text style={styles.conditionDesc}>{c.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Year purchased (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2022"
                placeholderTextColor={C.MUTED}
                value={yearPurchased}
                onChangeText={setYearPurchased}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Includes</Text>
              {INCLUDES_OPTIONS.map(opt => {
                const checked = includesState[opt.key];
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={styles.includesRow}
                    onPress={() => includesSetters[opt.key](v => !v)}
                  >
                    <View style={[styles.includesCheck, checked && styles.includesCheckActive]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.includesLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSub}>Add up to 6 photos. First photo is the cover.</Text>
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

        {/* Step 3: Auth photos */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Authentication photos</Text>
            <Text style={[styles.stepSub, styles.stepSubItalic]}>
              These photos go to our independent authenticator, LEGIT APP. Your listing goes live once it passes — usually within 24 hours.
            </Text>
            <View style={styles.authPhotoGrid}>
              {AUTH_PHOTO_REQUIREMENTS.map(req => {
                const done = !!authPhotoCaptured[req];
                return (
                  <TouchableOpacity
                    key={req}
                    style={[styles.authPhotoSlot, done && styles.authPhotoSlotDone]}
                    onPress={() => setAuthPhotoCaptured(prev => ({ ...prev, [req]: !prev[req] }))}
                  >
                    {done
                      ? <Text style={styles.authPhotoDoneIcon}>✓</Text>
                      : <Text style={styles.authPhotoIcon}>+</Text>}
                    <Text style={styles.authPhotoText}>{req}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 4: Valuation result */}
        {step === 4 && valuation && (
          <View>
            <View style={styles.valuationCard}>
              <Text style={styles.valuationEyebrow}>ESTIMATED VALUE</Text>
              <Text style={styles.valuationAmount}>{formatPence(valuation.estimatedValuePence)}</Text>
              <Text style={styles.valuationRange}>
                Range: {formatPence(valuation.rangeLowPence)} – {formatPence(valuation.rangeHighPence)}
              </Text>
              <Text style={styles.valuationContext}>
                Based on recent UK resale prices for {brandLabel} {model} in {conditionLabel.toLowerCase()} condition
              </Text>
              <View style={styles.valuationDivider} />
              <Text style={styles.valuationSuggestionLabel}>OUR SUGGESTION</Text>
              <Text style={styles.valuationSuggestion}>
                {formatTicketPrice(valuation.suggestedTicketPricePence)} per ticket · {valuation.suggestedTotalTickets.toLocaleString()} tickets
              </Text>
              <Text style={styles.valuationPayout}>
                Your payout if it sells through: {formatPence(valuation.projectedSellerPayoutPence)}
              </Text>
              <Text style={styles.valuationDisclaimer}>
                Estimate based on recent UK resale prices. Actual value may vary.
              </Text>
              <View style={styles.valuationBtnRow}>
                <TouchableOpacity style={styles.valuationBtnPrimary} onPress={chooseSuggestion}>
                  <Text style={styles.nextButtonText}>Use suggestion</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.valuationBtnSecondary} onPress={chooseOwnPrice}>
                  <Text style={styles.backButtonText}>Set my own price</Text>
                </TouchableOpacity>
              </View>
            </View>
            {valuation.estimatedValuePence < MIN_RETAIL_VALUE_PENCE && (
              <View style={styles.pricingHint}>
                <Text style={styles.pricingHintText}>
                  Heads up — bags typically need an estimated value of at least {formatPence(MIN_RETAIL_VALUE_PENCE)} to perform well on bedrawn.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 5: Pricing */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Pricing</Text>
            {useValuationSuggestion && valuation && (
              <Text style={styles.reserveHint}>Based on our estimate: {formatPence(valuation.estimatedValuePence)}</Text>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your bag honestly — colour, hardware, any wear or marks…"
                placeholderTextColor={C.MUTED}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
                    <Text style={[styles.priceText, ticketPrice === p && styles.priceTextActive]}>{formatTicketPrice(p)}</Text>
                    {valuation?.suggestedTicketPricePence === p && (
                      <Text style={styles.priceSuggested}>suggested</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Total tickets</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2000"
                placeholderTextColor={C.MUTED}
                value={totalTickets}
                onChangeText={setTotalTickets}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Draw duration</Text>
              <Text style={styles.reserveHint}>Minimum 7 days. Postal entries close 4 days before your draw ends.</Text>
              <View style={styles.durationGrid}>
                {[14, 21, 30, 60].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationPill, drawDurationDays === d && styles.durationPillActive]}
                    onPress={() => setDrawDurationDays(d)}
                  >
                    <Text style={[styles.durationDays, drawDurationDays === d && styles.durationDaysActive]}>{d} days</Text>
                    <Text style={styles.durationClose}>Closes {addDays(d)}</Text>
                    <Text style={[styles.durationPostal, drawDurationDays === d && styles.durationPostalActive]}>Post by {addDays(d - 4)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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

            {showLowPayoutHint && (
              <View style={styles.pricingHint}>
                <Text style={styles.pricingHintText}>
                  At this price, a full sell-through pays you £{net} — below your bag's estimated value.
                </Text>
              </View>
            )}

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
                ['Brand', brandLabel || '(not set)'],
                ['Model', model || '(not set)'],
                ['Condition', conditionLabel || '(not set)'],
                ['Authentication', 'LEGIT APP photo check'],
                ['Duration', `${drawDurationDays} days (closes ${addDays(drawDurationDays)})`],
                ['Ticket price', formatTicketPrice(ticketPrice)],
                ['Tickets', tickets.toLocaleString()],
                ['Reserve', `${reservePct}% (${reserveTickets.toLocaleString()} tickets)`],
                ['Estimated value', valuation ? formatPence(valuation.estimatedValuePence) : '—'],
                ['Payout (if sold out)', `£${net}`],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{label}</Text>
                  <Text style={[styles.reviewValue, label === 'Authentication' ? { color: C.LILAC } : {}]}>{value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setLiquidated(v => !v)}>
              <View style={[styles.checkbox, liquidated && styles.checkboxChecked]}>
                {liquidated && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I confirm the bag is authentic and as described, and agree to the bedrawn seller terms. I understand my listing goes live only after it passes LEGIT APP photo authentication.
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
        {step !== 4 && (
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
        )}
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
  stepSubItalic: { fontStyle: 'italic', color: C.MUTED },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs, letterSpacing: 0.5 },
  input: {
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER,
    borderRadius: 10, padding: S.lg, color: C.TEXT, fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  // Step 1: brand & model
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.xl },
  brandChip: {
    flexGrow: 1, minWidth: '28%', borderRadius: 10, paddingVertical: S.md, paddingHorizontal: S.sm,
    backgroundColor: C.CARD, borderWidth: 1.5, borderColor: C.BORDER, alignItems: 'center',
  },
  brandChipActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  brandLabel: { color: C.GREY, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  brandLabelActive: { color: C.PURPLE },
  suggestionsBox: {
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER, borderRadius: 8, marginTop: -8, zIndex: 10,
  },
  suggestionItem: { padding: S.md, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  suggestionText: { color: C.TEXT, fontSize: 14 },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  conditionCard: {
    flex: 1, minWidth: '45%', backgroundColor: C.CARD, borderRadius: 12, padding: S.md,
    borderWidth: 1.5, borderColor: C.BORDER, gap: S.xs,
  },
  conditionCardActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  conditionLabel: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  conditionDesc: { color: C.GREY, fontSize: 11, lineHeight: 16 },
  includesRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.sm },
  includesCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  includesCheckActive: { backgroundColor: C.PURPLE, borderColor: C.PURPLE },
  includesLabel: { color: C.TEXT, fontSize: 14 },
  // Step 2: photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  photoSlot: {
    width: '30%', aspectRatio: 1, flexGrow: 1, backgroundColor: C.CARD,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: S.xs, padding: S.xs,
  },
  photoSlotIcon: { fontSize: 24, color: C.MUTED },
  photoSlotText: { color: C.MUTED, fontSize: 9, textAlign: 'center' },
  // Step 3: auth photos
  authPhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  authPhotoSlot: {
    width: '30%', aspectRatio: 1, flexGrow: 1, backgroundColor: C.CARD, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.BORDER, borderStyle: 'dashed', alignItems: 'center',
    justifyContent: 'center', gap: S.xs, padding: S.xs, position: 'relative',
  },
  authPhotoSlotDone: { borderColor: C.GREEN, borderStyle: 'solid', backgroundColor: C.GREEN_LIGHT ?? 'rgba(5,150,105,0.08)' },
  authPhotoIcon: { fontSize: 22, color: C.MUTED },
  authPhotoText: { color: C.MUTED, fontSize: 9, textAlign: 'center' },
  authPhotoDoneIcon: { fontSize: 22, color: C.GREEN },
  // Step 4: valuation
  valuationCard: {
    backgroundColor: C.CARD, borderRadius: 16, borderWidth: 1, borderColor: C.BORDER,
    padding: S.xl, marginBottom: S.xl, alignItems: 'center',
  },
  valuationEyebrow: { color: C.MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: S.xs },
  valuationAmount: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 40, fontWeight: '800', color: C.TEXT, marginBottom: S.xs },
  valuationRange: { color: C.GREY, fontSize: 13, marginBottom: S.xs },
  valuationContext: { color: C.MUTED, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: S.lg },
  valuationDivider: { width: '100%', height: 1, backgroundColor: C.BORDER, marginBottom: S.lg },
  valuationSuggestionLabel: { color: C.MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: S.xs },
  valuationSuggestion: { color: C.TEXT, fontWeight: '700', fontSize: 16, marginBottom: S.xs },
  valuationPayout: { color: C.GREEN, fontWeight: '700', fontSize: 14, marginBottom: S.lg },
  valuationDisclaimer: { color: C.MUTED, fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: S.xl },
  valuationBtnRow: { flexDirection: 'row', gap: S.md, width: '100%' },
  valuationBtnPrimary: { flex: 1, backgroundColor: C.PURPLE, borderRadius: 999, paddingVertical: S.lg, alignItems: 'center' },
  valuationBtnSecondary: { flex: 1, backgroundColor: C.CARD, borderRadius: 999, paddingVertical: S.lg, alignItems: 'center', borderWidth: 1, borderColor: C.BORDER },
  // Step 5: pricing
  pricingHint: { backgroundColor: C.WARNING_BG ?? 'rgba(245,158,11,0.10)', borderRadius: 8, padding: S.md, marginBottom: S.md },
  pricingHintText: { color: C.WARNING ?? C.GOLD, fontSize: 12, lineHeight: 17 },
  ticketPriceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  pricePill: {
    flexGrow: 1, minWidth: '14%', borderRadius: 10, paddingVertical: S.md, alignItems: 'center',
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER,
  },
  pricePillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  priceText: { color: C.GREY, fontSize: 16, fontWeight: '700' },
  priceTextActive: { color: C.PURPLE },
  priceSuggested: { color: C.GREEN, fontSize: 9, fontWeight: '700', marginTop: 2 },
  reserveHint: { color: C.MUTED, fontSize: 12, lineHeight: 17, marginBottom: S.sm },
  reserveNote: { color: C.MUTED, fontSize: 12, marginTop: S.sm },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  durationPill: {
    width: '47%', borderRadius: 10, paddingVertical: S.md, paddingHorizontal: S.sm,
    backgroundColor: C.CARD, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center',
  },
  durationPillActive: { borderColor: C.PURPLE, backgroundColor: C.PURPLE_LIGHT },
  durationDays: { color: C.GREY, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  durationDaysActive: { color: C.PURPLE },
  durationClose: { color: C.MUTED, fontSize: 11 },
  durationPostal: { color: C.MUTED, fontSize: 10, marginTop: 1 },
  durationPostalActive: { color: C.PURPLE },
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
  // Step 6: review
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
