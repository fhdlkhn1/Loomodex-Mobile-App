import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LMX, sans, mono } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button } from '../components';
import { Sheet, Pill } from '../components/StaffKit';
import { friendlyError } from '../api/client';
import { csCasesApi, CsQuoteLine } from '../api/csCases';
import { StoreQuote, StoreAppointment } from '../api/products';
import { t } from '../i18n';

/**
 * Customer Service — store requests (Nos offres) in the app, same as the website page /cs-requests/:
 * list with filters, conversations (customer / internal with the representative), proposals,
 * quotations with versions, Confirm quotation, appointments and Purchase Authorized.
 */

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ')} GNF`;

const CASE_STATUS: Record<string, { label: string; color: string }> = {
  received:        { label: 'Reçue',                       color: LMX.accent },
  under_review:    { label: 'En cours de traitement',      color: LMX.brand },
  info_required:   { label: 'Informations demandées',      color: LMX.rose },
  proposal_review: { label: 'Proposition à vérifier',      color: '#8B5CF6' },
  quote_sent:      { label: 'Devis envoyé',                color: '#0EA5E9' },
  closed:          { label: 'Clôturée',                    color: LMX.ink50 },
  converted:       { label: 'Commandée',                   color: LMX.emerald },
};
const QUOTE_STATUS: Record<string, string> = {
  sent: 'En attente du client', accepted: 'Accepté — à confirmer', declined: 'Refusé', confirmed: 'Confirmé',
  superseded: 'Remplacé', ordered: 'Commandé', submitted: 'Proposition à vérifier', reviewed: 'Proposition vérifiée',
};
const APPT_STATUS: Record<string, string> = { requested: 'Demandé', confirmed: 'Confirmé', cancelled: 'Annulé', attended: 'Effectué', no_show: 'Absent' };
const COSTS: Record<string, string> = {
  purchase: "Prix d'achat", transport_origin: 'Transport (pays source)', inspection: 'Inspection', packaging: 'Emballage',
  shipping: 'Expédition', insurance: 'Assurance', guinea_costs: 'Frais en Guinée',
};
const TYPE_LABEL: Record<string, string> = { price_request: 'Demande de prix', find_product: 'Recherche de produit', appointment: 'Rendez-vous' };

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: on ? LMX.navy : LMX.surface, borderWidth: 1, borderColor: on ? LMX.navy : LMX.border }}>
      <Text style={{ fontSize: 12, fontFamily: sans(600), color: on ? '#fff' : LMX.ink70 }}>{label}</Text>
    </Pressable>
  );
}

const inputStyle = { backgroundColor: LMX.surface, borderRadius: 10, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 10, minHeight: 40, fontSize: 13.5, color: LMX.ink } as const;

export function ScreenCsRequests() {
  const nav = useNavigation<any>();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading, refetch, error } = useQuery({ queryKey: ['cs-cases', status, query], queryFn: () => csCasesApi.list({ status, search: query }) });
  const counts = data?.counts ?? {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Demandes boutiques')} right={<IconBtn icon="refresh" onPress={() => refetch()} />} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle }}>
          <Icon name="search" size={15} color={LMX.ink50} />
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => setQuery(search.trim())} returnKeyType="search"
            placeholder={t('Référence, nom, téléphone, produit')} placeholderTextColor={LMX.ink30} style={{ flex: 1, color: LMX.ink }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label={`${t('Toutes')} (${all})`} on={status === ''} onPress={() => setStatus('')} />
          {Object.keys(CASE_STATUS).map(k => <Chip key={k} label={`${t(CASE_STATUS[k].label)} (${counts[k] ?? 0})`} on={status === k} onPress={() => setStatus(k)} />)}
        </ScrollView>
      </View>
      {isLoading ? <View style={{ paddingVertical: 40 }}><ActivityIndicator color={LMX.brand} /></View>
      : error ? <Text style={{ padding: 24, textAlign: 'center', color: LMX.rose }}>{friendlyError(error)}</Text>
      : (
        <View style={{ padding: 16, gap: 10 }}>
          {(data?.cases ?? []).length === 0 && <Text style={{ textAlign: 'center', color: LMX.ink50, padding: 24 }}>{t('Aucune demande ici.')}</Text>}
          {(data?.cases ?? []).map(c => {
            const st = CASE_STATUS[c.status] ?? { label: c.status_label, color: LMX.ink50 };
            return (
              <Pressable key={c.id} onPress={() => nav.navigate('CsRequest', { caseId: c.id })}
                style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 12, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12.5, fontFamily: mono(700), color: LMX.brand }}>{c.ref}</Text>
                  <Pill label={t(st.label)} color={st.color} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{c.product?.name || c.item_name || t(TYPE_LABEL[c.type] || c.type)}</Text>
                <Text style={{ fontSize: 12, color: LMX.ink70 }}>{c.store?.name} · {t(TYPE_LABEL[c.type] || c.type)} · {t('Qté {n}', { n: c.qty })}</Text>
                <Text style={{ fontSize: 12, color: LMX.ink50 }}>{c.name} · {c.phone}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

export function ScreenCsRequest() {
  const nav = useNavigation<any>();
  const caseId: number = useRoute<any>().params?.caseId;
  const { data: c, refetch, isLoading } = useQuery({ queryKey: ['cs-case', caseId], queryFn: () => csCasesApi.get(caseId), enabled: !!caseId });
  const [channel, setChannel] = useState<'customer' | 'internal'>('customer');
  const { data: msgs, refetch: refetchMsgs } = useQuery({ queryKey: ['cs-case-msgs', caseId, channel], queryFn: () => csCasesApi.messages(caseId, channel), enabled: !!caseId });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  // Quotation composer
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [lines, setLines] = useState<CsQuoteLine[]>([]);
  const [fee, setFee] = useState('0');
  const [validUntil, setValidUntil] = useState('');
  const [timing, setTiming] = useState('');
  const [notes, setNotes] = useState('');
  const [productPick, setProductPick] = useState<number | null>(null);
  const { data: storeProducts } = useQuery({ queryKey: ['cs-store-products', c?.store?.id], queryFn: () => csCasesApi.storeProducts(c!.store!.id), enabled: quoteOpen && !!c?.store?.id });
  // Status / appointment sheets
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('under_review');
  const [statusNote, setStatusNote] = useState('');
  const [appt, setAppt] = useState<StoreAppointment | null>(null);
  const [slot, setSlot] = useState('');
  const [apptLoc, setApptLoc] = useState('');
  const [apptNote, setApptNote] = useState('');

  const run = async (fn: () => Promise<any>, done?: string) => {
    setBusy(true);
    try { await fn(); await refetch(); if (done) Alert.alert(done); return true; }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); return false; }
    finally { setBusy(false); }
  };

  const modeB = c?.store?.mode === 'quote_order';
  const quotes = (c?.quotes ?? []).filter((q: StoreQuote) => q.kind === 'quote');
  const proposals = (c?.quotes ?? []).filter((q: StoreQuote) => q.kind === 'proposal');
  const orderable = quotes.find(q => q.status === 'confirmed' && !q.order_id);
  const locations: string[] = (c as any)?.appointment_locations ?? [];

  const openComposer = () => {
    setLines(c?.product ? [{ product_id: c.product.id, name: c.product.name, qty: c.qty, unit_price: 0 }] : [{ product_id: null, name: c?.item_name || '', qty: c?.qty || 1, unit_price: 0 }]);
    setFee('0'); setValidUntil(''); setTiming(''); setNotes(''); setQuoteOpen(true);
  };
  const setLine = (i: number, patch: Partial<CsQuoteLine>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const total = lines.reduce((n, l) => n + (Number(l.unit_price) || 0) * (Number(l.qty) || 0), 0) + (Number(fee) || 0);

  const sendQuote = async () => {
    const clean = lines.filter(l => l.product_id || l.name.trim()).map(l => ({ ...l, qty: Number(l.qty) || 1, unit_price: Number(l.unit_price) || 0 }));
    if (!clean.length) { Alert.alert(t('Devis'), t('Ajoutez au moins une ligne.')); return; }
    if (modeB && clean.some(l => !l.product_id)) { Alert.alert(t('Devis'), t('En mode commande en ligne, chaque ligne doit être un produit publié de la boutique.')); return; }
    if (await run(() => csCasesApi.sendQuote(caseId, { lines: clean, delivery_fee: Number(fee) || 0, valid_until: validUntil || undefined, timing, notes }), t('Devis envoyé au client.'))) setQuoteOpen(false);
  };

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await csCasesApi.send(caseId, channel, text.trim()); setText(''); refetchMsgs(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setBusy(false); }
  };

  if (isLoading || !c) return <Screen><AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Demande')} /><ActivityIndicator style={{ marginTop: 40 }} color={LMX.brand} /></Screen>;
  const st = CASE_STATUS[c.status] ?? { label: c.status_label, color: LMX.ink50 };
  const locked = c.status === 'converted' || c.status === 'closed';

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={c.ref} right={<IconBtn icon="refresh" onPress={() => { refetch(); refetchMsgs(); }} />} />
      <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 30 }}>
        {/* Request */}
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 12, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: LMX.ink50 }}>{c.store?.name} · {t(TYPE_LABEL[c.type] || c.type)}</Text>
            <Pill label={t(st.label)} color={st.color} />
          </View>
          <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink }}>{c.product?.name || c.item_name || t('Recherche de produit')}</Text>
          {!!c.description && <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{c.description}</Text>}
          <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Qté {n}', { n: c.qty })} · {c.fulfillment === 'collection' ? t('Retrait') : t('Livraison')}{c.city ? ` · ${c.city}${c.neighborhood ? ', ' + c.neighborhood : ''}` : ''}</Text>
          {!!c.comment && <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>“{c.comment}”</Text>}
          {!!(c as any).photo && <Image source={{ uri: (c as any).photo }} style={{ width: 90, height: 90, borderRadius: 8, marginTop: 4 }} />}
          <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink, marginTop: 4 }}>{c.name} · {c.phone}</Text>
          {!locked && <Button size="sm" variant="ghost" onPress={() => { setNewStatus('under_review'); setStatusNote(''); setStatusOpen(true); }}>{t('Changer le statut')}</Button>}
        </View>

        {/* Representative proposals (internal) */}
        {proposals.map(p => (
          <View key={p.id} style={{ backgroundColor: '#F5F3FF', borderRadius: LMX.r.lg, padding: 12, gap: 3 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(700), color: '#5B21B6' }}>{t('Proposition du représentant v{v}', { v: p.version })} · {t(QUOTE_STATUS[p.status] || p.status)}</Text>
            {p.lines.map((l: any, i: number) => (
              <Text key={i} style={{ fontSize: 12.5, color: LMX.ink70 }}>• {l.name} × {l.qty}{l.unit_cost ? ` · ${t('coût')} ${l.unit_cost} ${l.cost_currency || ''}` : ''}{l.availability ? ` · ${l.availability}` : ''}</Text>
            ))}
            {!!(p as any).costs && Object.keys(COSTS).map(k => {
              const x = (p as any).costs[k] || {};
              return <Text key={k} style={{ fontSize: 11.5, color: LMX.ink50 }}>{t(COSTS[k])} : {x.amount != null ? `${x.amount} ${x.currency || ''}` : '—'} ({t(x.status === 'confirmed' ? 'confirmé' : x.status === 'estimated' ? 'estimé' : 'inconnu')})</Text>;
            })}
            {!!p.timing && <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Délai')} : {p.timing}</Text>}
            {!!p.notes && <Text style={{ fontSize: 12, color: LMX.ink70 }}>{p.notes}</Text>}
          </View>
        ))}

        {/* Quotations sent to the customer */}
        {quotes.map(q => (
          <View key={q.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: q.status === 'accepted' ? LMX.accent : LMX.border, padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(700) }}>{t('Devis v{v}', { v: q.version })}</Text>
              <Text style={{ fontSize: 11.5, fontFamily: sans(700), color: q.status === 'accepted' ? LMX.accent : LMX.ink50 }}>{t(QUOTE_STATUS[q.status] || q.status)}</Text>
            </View>
            {q.lines.map((l, i) => <Text key={i} style={{ fontSize: 12.5, color: LMX.ink70 }}>{l.name} × {l.qty} · {fmt(l.unit_price)}</Text>)}
            <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Livraison')} : {fmt(q.delivery_fee)} · <Text style={{ fontFamily: sans(700), color: LMX.ink }}>{t('Total')} {fmt(q.total)}</Text></Text>
            {!!q.answer_note && <Text style={{ fontSize: 12, color: LMX.ink50 }}>{t('Note du client')} : {q.answer_note}</Text>}
            {q.status === 'accepted' && (
              <Button full icon="check" disabled={busy} onPress={() => run(() => csCasesApi.confirmQuote(q.id), t('Devis confirmé.'))}>{t('Confirmer le devis')}</Button>
            )}
            {q.status === 'accepted' && <Text style={{ fontSize: 11, color: LMX.ink50 }}>{modeB ? t('Active le bouton « Commander » du client. N\'envoie rien à la logistique.') : t('Mode rendez-vous : continuez avec le rendez-vous.')}</Text>}
            {!!q.order_id && <Text style={{ fontSize: 12, color: LMX.emerald, fontFamily: sans(600) }}>{t('Commande #{n}', { n: q.order_id })}</Text>}
          </View>
        ))}
        {!locked && <Button full variant="accent" icon="plus" onPress={openComposer}>{quotes.length ? t('Envoyer une nouvelle version du devis') : t('Envoyer le devis au client')}</Button>}

        {/* Appointments (Mode C) */}
        {((c as any).appointments ?? []).map((a: StoreAppointment) => (
          <View key={a.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 12, gap: 4 }}>
            <Text style={{ fontSize: 13.5, fontFamily: sans(700) }}>{t('Rendez-vous')} · {t(APPT_STATUS[a.status] || a.status)}</Text>
            <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Souhaité : {d}', { d: a.preferred })}{a.slot ? ` · ${t('Fixé : {d}', { d: a.slot.substring(0, 16) })}` : ''}{a.location ? ` · ${a.location}` : ''}</Text>
            {!!a.note && <Text style={{ fontSize: 12, color: LMX.ink50 }}>{a.note}</Text>}
            {(a.status === 'requested' || a.status === 'confirmed') && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                <Button size="sm" onPress={() => { setAppt(a); setSlot(a.slot ? a.slot.substring(0, 16) : ''); setApptLoc(a.location); setApptNote(''); }}>{a.status === 'requested' ? t('Confirmer') : t('Reprogrammer')}</Button>
                {a.status === 'confirmed' && <Button size="sm" variant="ghost" onPress={() => run(() => csCasesApi.appointment(a.id, { action: 'attended' }))}>{t('Effectué')}</Button>}
                {a.status === 'confirmed' && <Button size="sm" variant="ghost" onPress={() => run(() => csCasesApi.appointment(a.id, { action: 'no_show' }))}>{t('Absent')}</Button>}
                <Button size="sm" variant="ghost" onPress={() => Alert.alert(t('Annuler le rendez-vous'), '', [{ text: t('Non'), style: 'cancel' }, { text: t('Oui'), style: 'destructive', onPress: () => run(() => csCasesApi.appointment(a.id, { action: 'cancel' })) }])}>{t('Annuler')}</Button>
              </View>
            )}
          </View>
        ))}

        {/* Purchase Authorized */}
        {!!orderable && (
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: LMX.r.lg, padding: 12, gap: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>{t('Achat autorisé')}</Text>
            <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t("Crée la commande du client à partir du devis confirmé (adresse enregistrée du client). Elle attend ensuite « Confirmer la commande ».")}</Text>
            <Button full variant="accent" icon="bag" disabled={busy} onPress={() => Alert.alert(t('Créer la commande'), t('Créer la commande à partir du devis confirmé ?'), [
              { text: t('Annuler'), style: 'cancel' },
              { text: t('Créer'), onPress: () => run(async () => { const r = await csCasesApi.convert(caseId); Alert.alert(t('Commande créée'), t('Commande #{n} créée.', { n: r.order.number })); }) },
            ])}>{t('Créer la commande')}</Button>
          </View>
        )}

        {/* Conversations */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <Chip label={t('Client ↔ Service client')} on={channel === 'customer'} onPress={() => setChannel('customer')} />
          <Chip label={t('Interne (représentant)')} on={channel === 'internal'} onPress={() => setChannel('internal')} />
        </View>
        {(msgs?.messages ?? []).map(m => (
          <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.mine ? LMX.brand : LMX.surface, borderRadius: 12, padding: 10, borderWidth: m.mine ? 0 : 1, borderColor: LMX.border }}>
            {!m.mine && <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: sans(600) }}>{m.author}</Text>}
            <Text style={{ fontSize: 13, color: m.mine ? '#fff' : LMX.ink }}>{m.body}</Text>
          </View>
        ))}
        {(msgs?.messages ?? []).length === 0 && <Text style={{ fontSize: 12, color: LMX.ink50 }}>{t('Aucun message.')}</Text>}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput value={text} onChangeText={setText} placeholder={channel === 'customer' ? t('Écrire au client…') : t('Écrire au représentant…')} placeholderTextColor={LMX.ink30} style={{ flex: 1, ...inputStyle }} />
          <Button disabled={busy || !text.trim()} onPress={send} icon="arrowR">{t('Envoyer')}</Button>
        </View>
      </View>

      {/* Quotation composer */}
      <Sheet visible={quoteOpen} title={t('Devis pour le client')} subtitle={modeB ? t('Mode commande en ligne : produits publiés de la boutique') : undefined} onClose={() => setQuoteOpen(false)}
        footer={<Button variant="accent" full disabled={busy} onPress={sendQuote}>{t('Envoyer le devis · {a}', { a: fmt(total) })}</Button>}>
        <View style={{ gap: 10 }}>
          {lines.map((l, i) => (
            <View key={i} style={{ borderWidth: 1, borderColor: LMX.border, borderRadius: 10, padding: 8, gap: 6 }}>
              <Pressable onPress={() => setProductPick(i)} style={{ ...inputStyle, justifyContent: 'center' }}>
                <Text numberOfLines={1} style={{ fontSize: 13, color: l.product_id ? LMX.ink : LMX.ink50 }}>{l.product_id ? l.name : (modeB ? t('Choisir un produit de la boutique') : t('Choisir un produit (facultatif)'))}</Text>
              </Pressable>
              {!l.product_id && !modeB && <TextInput value={l.name} onChangeText={v => setLine(i, { name: v })} placeholder={t('Nom (texte libre)')} placeholderTextColor={LMX.ink30} style={inputStyle} />}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput value={String(l.qty)} onChangeText={v => setLine(i, { qty: Number(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" placeholder={t('Qté')} style={{ width: 70, ...inputStyle }} />
                <TextInput value={l.unit_price ? String(l.unit_price) : ''} onChangeText={v => setLine(i, { unit_price: Number(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" placeholder={t('Prix unitaire (GNF)')} placeholderTextColor={LMX.ink30} style={{ flex: 1, ...inputStyle }} />
                <Pressable onPress={() => setLines(ls => ls.filter((_, j) => j !== i))} style={{ justifyContent: 'center', paddingHorizontal: 6 }}><Icon name="trash" size={16} color={LMX.rose} /></Pressable>
              </View>
            </View>
          ))}
          <Button size="sm" variant="ghost" icon="plus" onPress={() => setLines(ls => [...ls, { product_id: null, name: '', qty: 1, unit_price: 0 }])}>{t('Ajouter une ligne')}</Button>
          <TextInput value={fee} onChangeText={v => setFee(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder={t('Frais de livraison (GNF)')} style={inputStyle} />
          <TextInput value={validUntil} onChangeText={setValidUntil} placeholder={t('Valable jusqu\'au (AAAA-MM-JJ)')} placeholderTextColor={LMX.ink30} style={inputStyle} />
          <TextInput value={timing} onChangeText={setTiming} placeholder={t('Délai (ex. livraison sous 10 jours)')} placeholderTextColor={LMX.ink30} style={inputStyle} />
          <TextInput value={notes} onChangeText={setNotes} placeholder={t('Notes pour le client')} placeholderTextColor={LMX.ink30} style={inputStyle} />
        </View>
      </Sheet>

      {/* Product picker for a line */}
      <Sheet visible={productPick !== null} title={t('Produits de la boutique')} onClose={() => setProductPick(null)}>
        <View style={{ gap: 6 }}>
          {!storeProducts ? <ActivityIndicator color={LMX.brand} /> : storeProducts.products.length === 0
            ? <Text style={{ color: LMX.ink50 }}>{t('Aucun produit publié dans cette boutique.')}</Text>
            : storeProducts.products.map(p => (
              <Pressable key={p.id} onPress={() => { if (productPick !== null) setLine(productPick, { product_id: p.id, name: p.name, unit_price: p.price > 0 ? Math.round(p.price) : 0 }); setProductPick(null); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: LMX.border }}>
                {p.image ? <Image source={{ uri: p.image }} style={{ width: 40, height: 40, borderRadius: 6 }} /> : <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: LMX.surfaceAlt }} />}
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: LMX.ink50 }}>{p.price > 0 ? fmt(p.price) : '—'}</Text>
              </Pressable>
            ))}
        </View>
      </Sheet>

      {/* Status change */}
      <Sheet visible={statusOpen} title={t('Changer le statut')} onClose={() => setStatusOpen(false)}
        footer={<Button variant="accent" full disabled={busy} onPress={async () => { if (await run(() => csCasesApi.setStatus(caseId, newStatus, statusNote))) setStatusOpen(false); }}>{t('Enregistrer')}</Button>}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['under_review', 'info_required', 'closed'].map(k => <Chip key={k} label={t(CASE_STATUS[k].label)} on={newStatus === k} onPress={() => setNewStatus(k)} />)}
          </View>
          <TextInput value={statusNote} onChangeText={setStatusNote} placeholder={t('Note (obligatoire pour clôturer ou demander des informations)')} placeholderTextColor={LMX.ink30} style={inputStyle} multiline />
        </View>
      </Sheet>

      {/* Appointment confirm / reschedule */}
      <Sheet visible={!!appt} title={appt?.status === 'requested' ? t('Confirmer le rendez-vous') : t('Reprogrammer')} subtitle={appt ? t('Souhaité : {d}', { d: appt.preferred }) : undefined} onClose={() => setAppt(null)}
        footer={<Button variant="accent" full disabled={busy} onPress={async () => {
          if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(slot.trim())) { Alert.alert(t('Date et heure'), t('Format : AAAA-MM-JJ HH:MM')); return; }
          if (await run(() => csCasesApi.appointment(appt!.id, { action: appt!.status === 'requested' ? 'confirm' : 'reschedule', slot: slot.trim().replace('T', ' '), location: apptLoc, note: apptNote }), t('Le client a été notifié.'))) setAppt(null);
        }}>{t('Enregistrer')}</Button>}>
        <View style={{ gap: 8 }}>
          <TextInput value={slot} onChangeText={setSlot} placeholder="2026-12-05 10:00" placeholderTextColor={LMX.ink30} style={inputStyle} />
          {locations.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {locations.map(l => <Chip key={l} label={l} on={apptLoc === l} onPress={() => setApptLoc(l)} />)}
            </View>
          )}
          <TextInput value={apptNote} onChangeText={setApptNote} placeholder={t('Note (facultatif)')} placeholderTextColor={LMX.ink30} style={inputStyle} />
        </View>
      </Sheet>
    </Screen>
  );
}
