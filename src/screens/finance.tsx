import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, RefreshControl, Image, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LMX, sans, mono, fr } from '../theme';
import { Icon, IconName } from '../Icon';
import { Screen, AppBar, IconBtn, Button } from '../components';
import { Picker } from '../components/Picker';
import { ErrorState } from '../components/StateViews';
import { Sheet, TextArea, Pill, ErrorBanner } from '../components/StaffKit';
import { friendlyError } from '../api/client';
import { financeApi, FinanceMe, FinanceProfile, LedgerEntry, LedgerStatus } from '../api/finance';
import { t } from '../i18n';

/**
 * "Mes finances" — sellers, Loomodex drivers, logistics partner managers, field agents and influencers.
 * Two amounts that are never mixed:
 *  - product money collected on delivery, to hand back to Loomodex (drivers / partners), reduced
 *    only by deposits the Accountant has verified;
 *  - my earnings, owed by Loomodex and paid by the Accountant (never taken from the cash).
 */

const money = (n: number) => `${fr(Math.round(n || 0))} GNF`;

const STATUS: Record<LedgerStatus, { label: string; color: string }> = {
  pending:               { label: 'En attente',                 color: LMX.ink50 },
  awaiting_verification: { label: 'En attente de vérification', color: LMX.accent },
  awaiting_confirmation: { label: 'À confirmer',                color: LMX.accent },
  confirmed:             { label: 'Confirmé',                   color: LMX.emerald },
  partially_confirmed:   { label: 'Partiellement confirmé',     color: LMX.brand },
  discrepancy_reported:  { label: 'Écart signalé',              color: LMX.rose },
  rejected:              { label: 'Refusé',                     color: LMX.rose },
  cancelled:             { label: 'Annulé',                     color: LMX.ink50 },
};

const CATEGORY: Record<string, string> = {
  product_sale: 'Vente de produits', delivery_fee: 'Frais de livraison', agent_commission: 'Commission agent',
  influencer_commission: 'Commission influenceur', cash_collected: 'Encaissé à la livraison', declared: 'Dépôt déclaré',
  direct: 'Dépôt reçu par Loomodex', partner_remittance: 'Versement partenaire',
};

const METHOD: Record<string, string> = {
  cash: 'Espèces', orange_money: 'Orange Money', mtn_momo: 'MTN Mobile Money', bank_transfer: 'Virement bancaire', other: 'Autre',
};
const methodLabel = (m: string) => t(METHOD[m] || m);

const PROFILE_LABEL: Record<string, string> = {
  seller: 'Vendeur', driver: 'Livreur', partner: 'Partenaire logistique', agent: 'Agent de terrain', influencer: 'Influenceur',
};

type HistTab = 'payment' | 'deposit' | 'earning' | 'cash';

/** Entry row to "Mes finances", placed on the driver, seller and partner dashboards. */
export function FinanceLink({ style }: { style?: any }) {
  const nav = useNavigation<any>();
  return (
    <Pressable onPress={() => nav.navigate('Finance')} accessibilityRole="button"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }, style]}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: LMX.emerald + '1A', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="wallet" size={17} color={LMX.emerald} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{t('Mes finances')}</Text>
        <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{t('Gains, paiements et dépôts')}</Text>
      </View>
      <Icon name="chevR" size={16} color={LMX.ink30} />
    </Pressable>
  );
}

function Stat({ label, value, light, big, color }: { label: string; value: number; light?: boolean; big?: boolean; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: light ? '#fff' : LMX.ink50, opacity: light ? 0.65 : 1, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
      <Text style={{ fontSize: big ? 22 : 14, fontFamily: mono(big ? 700 : 600), color: color || (light ? '#fff' : LMX.ink), marginTop: 3 }}>{money(value)}</Text>
    </View>
  );
}

function EntryRow({ e, first, children }: { e: LedgerEntry; first: boolean; children?: React.ReactNode }) {
  const st = STATUS[e.status] || { label: e.status, color: LMX.ink50 };
  const shown = e.kind === 'deposit' ? (e.declared_amount ?? e.amount) : e.amount;
  const confirmedDiffers = e.confirmed_amount != null && e.confirmed_amount !== shown;
  return (
    <View style={{ padding: 12, gap: 4, borderTopWidth: first ? 0 : 1, borderTopColor: LMX.hairline }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontFamily: mono(600), color: LMX.ink50 }}>{e.ref}</Text>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink, marginTop: 2 }}>
            {t(CATEGORY[e.category] || (e.kind === 'payment' ? 'Paiement de Loomodex' : e.category))}{e.order_id ? ` · #${e.order_id}` : ''}
          </Text>
          <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{new Date(e.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 13.5, fontFamily: mono(700), color: LMX.ink }}>{money(shown)}</Text>
          <Pill label={t(st.label)} color={st.color} />
        </View>
      </View>
      {e.rate != null && e.base_amount != null && (
        <Text style={{ fontSize: 11, color: LMX.ink70 }}>{t('{r} % de {b}', { r: e.rate, b: money(e.base_amount) })}</Text>
      )}
      {(!!e.method || !!e.reference) && (
        <Text style={{ fontSize: 11, color: LMX.ink70 }}>{[e.method && methodLabel(e.method), e.reference && t('Réf. {r}', { r: e.reference })].filter(Boolean).join(' · ')}</Text>
      )}
      {confirmedDiffers && (
        <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.brand }}>
          {e.status === 'discrepancy_reported' ? t('Montant reçu signalé : {a}', { a: money(e.confirmed_amount!) }) : t('Montant confirmé : {a}', { a: money(e.confirmed_amount!) })}
        </Text>
      )}
      {!!e.note && <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{e.note}</Text>}
      {!!e.attachment_url && (
        <Pressable onPress={() => Linking.openURL(e.attachment_url!).catch(() => {})}>
          <Text style={{ fontSize: 11.5, color: LMX.brand, fontFamily: sans(600) }}>{t('Voir le justificatif')}</Text>
        </Pressable>
      )}
      {children}
    </View>
  );
}

export function ScreenFinance() {
  const nav = useNavigation<any>();
  const [me, setMe]             = useState<FinanceMe | null>(null);
  const [idx, setIdx]           = useState(0);
  const [entries, setEntries]   = useState<LedgerEntry[]>([]);
  const [toConfirm, setToConfirm] = useState<LedgerEntry[]>([]);
  const [tab, setTab]           = useState<HistTab>('payment');
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Declare deposit
  const [depOpen, setDepOpen]   = useState(false);
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('orange_money');
  const [reference, setReference] = useState('');
  const [note, setNote]         = useState('');
  const [proof, setProof]       = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [saving, setSaving]     = useState(false);

  // Report a payment problem
  const [dispute, setDispute]   = useState<LedgerEntry | null>(null);
  const [received, setReceived] = useState('');
  const [comment, setComment]   = useState('');
  const [busyId, setBusyId]     = useState<number | null>(null);

  const profile: FinanceProfile | undefined = me?.profiles[idx];

  const loadEntries = useCallback(async (p: FinanceProfile | undefined, which: HistTab) => {
    if (!p) { setEntries([]); setToConfirm([]); return; }
    const [hist, pending] = await Promise.all([
      financeApi.entries({ party_type: p.party_type, kind: which === 'earning' ? ['earning', 'correction'] : [which], per_page: 50 }),
      financeApi.entries({ party_type: p.party_type, kind: ['payment'], status: ['awaiting_confirmation'], per_page: 20 }),
    ]);
    setEntries(hist.entries);
    setToConfirm(pending.entries.filter(e => e.party_type === p.party_type && e.party_id === p.party_id));
  }, []);

  const load = useCallback(async () => {
    try {
      const m = await financeApi.me();
      setMe(m);
      const p = m.profiles[Math.min(idx, Math.max(0, m.profiles.length - 1))];
      await loadEntries(p, tab);
      setError(null);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, [idx, tab, loadEntries]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickProof = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('Permission requise'), t("Autorisez l'accès pour joindre un justificatif.")); return; }
    const r = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setProof({ uri: a.uri, name: a.fileName || undefined, type: a.mimeType || undefined });
    }
  };

  const submitDeposit = async () => {
    const a = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!a || a <= 0) { Alert.alert(t('Montant invalide'), t('Entrez un montant valide.')); return; }
    if (method !== 'cash' && !reference.trim()) { Alert.alert(t('Référence requise'), t('Veuillez saisir la référence de la transaction.')); return; }
    setSaving(true);
    try {
      const r = await financeApi.declareDeposit({ amount: a, method, reference: reference.trim() || undefined, note: note.trim() || undefined }, proof || undefined);
      setDepOpen(false); setAmount(''); setReference(''); setNote(''); setProof(null);
      setTab('deposit');
      Alert.alert(t('Dépôt déclaré'), t('Votre dépôt {ref} a été envoyé au comptable pour vérification.', { ref: r.entry.ref }));
      load();
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'enregistrer le dépôt."))); }
    finally { setSaving(false); }
  };

  const confirmPayment = (e: LedgerEntry) => {
    Alert.alert(t('Confirmer la réception'), t('Confirmez-vous avoir reçu {a} ?', { a: money(e.amount) }), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Confirmer'), onPress: async () => {
        setBusyId(e.id);
        try { await financeApi.confirmPayment(e.id); load(); }
        catch (err) { Alert.alert(t('Erreur'), friendlyError(err)); }
        finally { setBusyId(null); }
      } },
    ]);
  };

  const submitDispute = async () => {
    if (!dispute) return;
    const r = parseInt(received.replace(/[^0-9]/g, '') || '0', 10);
    if (r > dispute.amount) { Alert.alert(t('Montant invalide'), t('Le montant reçu ne peut pas dépasser le montant du paiement.')); return; }
    if (!comment.trim()) { Alert.alert(t('Commentaire requis'), t('Veuillez expliquer le problème.')); return; }
    setSaving(true);
    try { await financeApi.disputePayment(dispute.id, r, comment.trim()); setDispute(null); setReceived(''); setComment(''); load(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setSaving(false); }
  };

  const methodOptions = Object.keys(me?.methods || {}).map(value => ({ value, label: methodLabel(value) }));
  const canDeposit = !!profile?.cash;
  const tabs: { k: HistTab; label: string }[] = [
    { k: 'payment', label: t('Paiements') },
    ...(canDeposit ? [{ k: 'deposit' as HistTab, label: t('Dépôts') }, { k: 'cash' as HistTab, label: t('Encaissements') }] : []),
    { k: 'earning', label: t('Gains') },
  ];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Mes finances')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      {loading && !me ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error && !me ? (
        <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
      ) : !profile ? (
        <View style={{ padding: 32, alignItems: 'center', gap: 8 }}>
          <Icon name="wallet" size={28} color={LMX.ink30} />
          <Text style={{ fontSize: 13, color: LMX.ink50, textAlign: 'center' }}>{t("Aucun compte financier n'est associé à votre profil.")}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 30 }}>
          {!!error && <ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} />}

          {me!.profiles.length > 1 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {me!.profiles.map((p, i) => (
                <Pressable key={p.party_type} onPress={() => { setIdx(i); setTab('payment'); }}
                  style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: i === idx ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: i === idx ? 'transparent' : LMX.border }}>
                  <Text style={{ fontSize: 12, fontFamily: sans(700), color: i === idx ? '#fff' : LMX.ink70 }}>{t(PROFILE_LABEL[p.party_type])}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Product money held — drivers and partners only */}
          {profile.cash && (
            <View style={{ backgroundColor: LMX.navy, borderRadius: LMX.r.lg, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#fff', fontFamily: sans(700) }}>{t('Argent des produits encaissé')}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Stat light label={t('Encaissé')} value={profile.cash.collected} />
                <Stat light label={t('Dépôts confirmés')} value={profile.cash.deposits_confirmed} />
              </View>
              {profile.cash.deposits_waiting > 0 && (
                <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.75 }}>{t('Dépôts en attente de vérification : {a}', { a: money(profile.cash.deposits_waiting) })}</Text>
              )}
              <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 10 }}>
                <Stat light big label={t('Reste à reverser à Loomodex')} value={profile.cash.to_remit} color={profile.cash.to_remit > 0 ? LMX.accent : LMX.emerald} />
              </View>
              <Button variant="accent" full icon="plus" onPress={() => setDepOpen(true)}>{t('Déclarer un dépôt')}</Button>
              <Text style={{ fontSize: 10.5, color: '#fff', opacity: 0.6 }}>{t('Seul un dépôt vérifié par le comptable réduit le montant à reverser. Vos gains ne sont jamais déduits de cet argent.')}</Text>
            </View>
          )}

          {/* My earnings */}
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 12, color: LMX.ink, fontFamily: sans(700) }}>{t('Mes gains')}</Text>
            {profile.paid_by_partner ? (
              <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Vous livrez pour un partenaire logistique : vos gains vous sont payés par votre partenaire.')}</Text>
            ) : (
              <>
                {profile.plan && (
                  <Text style={{ fontSize: 12, color: LMX.ink70 }}>
                    {t('Plan {p} · commission Loomodex {c} %', { p: profile.plan.label, c: profile.plan.commission })}
                    {profile.plan.expires ? ` · ${t("jusqu'au {d}", { d: profile.plan.expires })}` : ''}
                    {profile.plan.expired ? ` · ${t('expiré')}` : ''}
                  </Text>
                )}
                {profile.contract && (
                  <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Contrat : {c} % des frais de livraison', { c: profile.contract.driver_share })}</Text>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Stat label={t('Gagné')} value={profile.earnings.earned} />
                  <Stat label={t('Payé (confirmé)')} value={profile.earnings.paid_confirmed} />
                </View>
                {(profile.earnings.paid_awaiting > 0 || profile.earnings.paid_disputed > 0) && (
                  <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>
                    {[profile.earnings.paid_awaiting > 0 && t('À confirmer : {a}', { a: money(profile.earnings.paid_awaiting) }),
                      profile.earnings.paid_disputed > 0 && t('Écarts signalés : {a}', { a: money(profile.earnings.paid_disputed) })].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <View style={{ borderTopWidth: 1, borderTopColor: LMX.hairline, paddingTop: 10 }}>
                  <Stat big label={t('Solde dû par Loomodex')} value={profile.earnings.balance} color={LMX.emerald} />
                </View>
              </>
            )}
          </View>

          {/* Payments waiting for my answer */}
          {toConfirm.length > 0 && (
            <View style={{ backgroundColor: '#FFF7ED', borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.accent + '55' }}>
              <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink, padding: 12, paddingBottom: 0 }}>{t('Paiements à confirmer')}</Text>
              {toConfirm.map((e, i) => (
                <EntryRow key={e.id} e={e} first={i === 0}>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <View style={{ flex: 1 }}><Button full size="sm" icon="check" disabled={busyId === e.id} onPress={() => confirmPayment(e)}>{t('Paiement reçu')}</Button></View>
                    <View style={{ flex: 1 }}><Button full size="sm" variant="ghost" onPress={() => { setDispute(e); setReceived(String(e.amount)); }}>{t('Signaler un problème')}</Button></View>
                  </View>
                </EntryRow>
              ))}
            </View>
          )}

          {/* History */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {tabs.map(x => (
              <Pressable key={x.k} onPress={() => { setTab(x.k); loadEntries(profile, x.k).catch(e => setError(friendlyError(e))); }}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: tab === x.k ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: tab === x.k ? 'transparent' : LMX.border }}>
                <Text style={{ fontSize: 11.5, fontFamily: sans(700), color: tab === x.k ? '#fff' : LMX.ink70 }}>{x.label}</Text>
              </Pressable>
            ))}
          </View>
          {entries.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}><Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t('Aucune opération pour le moment.')}</Text></View>
          ) : (
            <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border }}>
              {entries.map((e, i) => <EntryRow key={e.id} e={e} first={i === 0} />)}
            </View>
          )}
        </View>
      )}

      <Sheet visible={depOpen} title={t('Déclarer un dépôt')} subtitle={t("Argent des produits remis à Loomodex")} onClose={() => setDepOpen(false)}
        footer={<Button variant="accent" full disabled={saving} onPress={submitDeposit}>{saving ? t('Envoi…') : t('Envoyer au comptable')}</Button>}>
        <View style={{ gap: 12 }}>
          <TextArea label={t('Montant (GNF) *')} value={amount} onChangeText={setAmount} keyboardType="number-pad" lines={1} />
          <Picker label={t('Mode de paiement')} required value={method} options={methodOptions} onChange={setMethod} />
          <TextArea label={method === 'cash' ? t('Référence (facultatif)') : t('Référence de la transaction *')} value={reference} onChangeText={setReference} lines={1} />
          <TextArea label={t('Commentaire (facultatif)')} value={note} onChangeText={setNote} lines={2} />
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>{t('Justificatif (capture, photo ou reçu)')}</Text>
          {proof ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={{ uri: proof.uri }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: LMX.surfaceAlt }} />
              <Pressable onPress={() => setProof(null)}><Text style={{ color: LMX.rose, fontFamily: sans(600), fontSize: 12.5 }}>{t('Retirer')}</Text></Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Button full size="sm" variant="ghost" icon="camera" onPress={() => pickProof(true)}>{t('Photo')}</Button></View>
              <View style={{ flex: 1 }}><Button full size="sm" variant="ghost" icon="image" onPress={() => pickProof(false)}>{t('Galerie')}</Button></View>
            </View>
          )}
        </View>
      </Sheet>

      <Sheet visible={!!dispute} title={t('Signaler un problème')} subtitle={dispute ? `${dispute.ref} · ${money(dispute.amount)}` : ''} onClose={() => setDispute(null)}
        footer={<Button variant="accent" full disabled={saving} onPress={submitDispute}>{saving ? t('Envoi…') : t('Envoyer')}</Button>}>
        <View style={{ gap: 12 }}>
          <TextArea label={t('Montant réellement reçu (GNF)')} value={received} onChangeText={setReceived} keyboardType="number-pad" lines={1} />
          <TextArea label={t('Commentaire *')} value={comment} onChangeText={setComment} lines={3} placeholder={t('Expliquez le problème')} />
        </View>
      </Sheet>
    </Screen>
  );
}
