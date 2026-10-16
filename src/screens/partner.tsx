import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Linking, RefreshControl, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LMX, sans, mono, fr } from '../theme';
import { Icon, IconName } from '../Icon';
import { Screen, AppBar, IconBtn, Button } from '../components';
import { Picker } from '../components/Picker';
import { ErrorState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { friendlyError, isApiError } from '../api/client';
import { partnerApi, logisticsApi, DeliveryOrder, LogisticsDriver, Incident, PartnerLedger, LogisticsPartner } from '../api/delivery';
import { Sheet, TextArea, Pill, ErrorBanner, DriverPickerSheet, todayYmd } from '../components/StaffKit';
import { OrderMapSheet, MapButton } from '../components/OrderLocationMap';
import { t } from '../i18n';

const call = (phone?: string) => { if (phone) Linking.openURL(`tel:${phone}`).catch(() => {}); };
const PICKED_UP = ['out-delivery', 'driver-arrived', 'otp-pending', 'otp-verified', 'completed', 'delivery-failed'];

type PartnerTab = 'to_assign' | 'in_progress' | 'history' | 'failed';

function StaffHeader({ kicker, title, onRefresh }: { kicker: string; title: string; onRefresh: () => void }) {
  const nav = useNavigation<any>();
  const { logout } = useAuth();
  const onLogout = () => Alert.alert(t('Déconnexion'), t('Voulez-vous vous déconnecter ?'), [
    { text: t('Annuler'), style: 'cancel' },
    { text: t('Déconnexion'), style: 'destructive', onPress: async () => { await logout(); nav.reset({ index: 0, routes: [{ name: 'SignIn' }] }); } },
  ]);
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {nav.canGoBack() && <IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{kicker}</Text>
          <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>{title}</Text>
        </View>
        <IconBtn icon="refresh" onPress={onRefresh} />
        <IconBtn icon="user" onPress={() => nav.navigate('AccountDetails')} />
        <IconBtn icon="arrowU" onPress={onLogout} />
      </View>
    </View>
  );
}

function InfoRow({ icon, label, children, onCall }: { icon: IconName; label: string; children: React.ReactNode; onCall?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={13} color={LMX.ink70} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>{label}</Text>
        <View style={{ marginTop: 2 }}>{typeof children === 'string' ? <Text style={{ fontSize: 12.5, color: LMX.ink, lineHeight: 17 }}>{children}</Text> : children}</View>
      </View>
      {!!onCall && (
        <Pressable onPress={onCall} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="phone" size={15} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

function shortTime(s: string | null): string {
  if (!s) return '';
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : s;
}

/** Confirmed → driver assigned → picked up → on the way → arrived → delivered. */
function ProgressTimeline({ o }: { o: DeliveryOrder }) {
  const s = o.status;
  const failed = s === 'delivery-failed';
  const pickedUp = !!o.pickup_time || PICKED_UP.includes(s);
  const arrived = !!o.arrival_time || ['driver-arrived', 'otp-pending', 'otp-verified', 'completed'].includes(s);
  const delivered = !!o.delivery_time && !failed || ['otp-verified', 'completed'].includes(s);
  const steps: { label: string; done: boolean; time?: string | null }[] = [
    { label: t('Confirmée par le service client'), done: true },
    { label: t('Livreur assigné'), done: !!o.driver_id || pickedUp, time: o.assigned_time },
    { label: t('Récupérée au magasin'), done: pickedUp, time: o.pickup_time },
    { label: t('En route'), done: pickedUp },
    { label: t('Arrivé'), done: arrived, time: o.arrival_time },
    { label: failed ? t('Échec de la livraison') : t('Livrée'), done: delivered || failed, time: o.delivery_time },
  ];
  const lastDone = steps.reduce((acc, st, i) => (st.done ? i : acc), 0);
  return (
    <View style={{ gap: 0 }}>
      {steps.map((st, i) => {
        const isFail = failed && i === steps.length - 1;
        const color = isFail ? LMX.rose : st.done ? (i === lastDone ? LMX.brand : LMX.emerald) : LMX.ink30;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ alignItems: 'center', width: 14 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, backgroundColor: st.done ? color : LMX.surface, borderWidth: 2, borderColor: color }} />
              {i < steps.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 10, backgroundColor: steps[i + 1].done ? LMX.emerald : LMX.ink10 }} />}
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: st.done ? sans(600) : sans(400), color: st.done ? (isFail ? LMX.rose : LMX.ink) : LMX.ink50 }}>{st.label}</Text>
              {!!st.time && st.done && <Text style={{ fontSize: 11, fontFamily: mono(500), color: LMX.ink50 }}>{shortTime(st.time)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function deliveryCodeStatus(otp: string): { label: string; color: string } {
  if (otp === 'verified' || otp === 'overridden') return { label: t('Code client : vérifié'), color: LMX.emerald };
  if (otp === 'blocked') return { label: t('Code client : bloqué'), color: LMX.rose };
  if (otp === 'expired') return { label: t('Code client : expiré'), color: LMX.rose };
  return { label: t('Code client : en attente'), color: LMX.amber };
}

function PartnerOrderCard({ o, onAssign, onIncident, onMap }: { o: DeliveryOrder; onAssign: (o: DeliveryOrder) => void; onIncident: (o: DeliveryOrder) => void; onMap: (o: DeliveryOrder) => void }) {
  const failed = o.status === 'delivery-failed';
  const done = ['otp-verified', 'completed'].includes(o.status);
  const canAssign = !PICKED_UP.includes(o.status) && !o.pickup_time;
  const code = deliveryCodeStatus(o.otp_status);
  const p = o.pickup;
  const storeAddr = [p?.address, p?.landmark ? t('Repère : {l}', { l: p.landmark }) : ''].filter(Boolean).join(' · ');
  const destAddr = o.delivery_address || [o.address, o.neighborhood, o.commune, o.city].filter(Boolean).join(', ');
  const statusColor = failed ? LMX.rose : done ? LMX.emerald : o.driver_id ? LMX.brand : LMX.accent;
  const custGps = (o.customer_lat != null && o.customer_lng != null) || (o.dest_lat != null && o.dest_lng != null);

  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: failed ? LMX.rose : LMX.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <View>
          <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
          {!!o.date && <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{o.date}</Text>}
        </View>
        <Pill label={t(o.status_label)} color={statusColor} />
      </View>

      <View style={{ padding: 14, paddingBottom: 6 }}>
        <ProgressTimeline o={o} />
      </View>

      <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
        <InfoRow icon="storefront" label={t('Retrait au magasin')} onCall={p?.phone ? () => call(p.phone) : undefined}>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{p?.store || t('Vendeur')}</Text>
          {!!storeAddr && <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 1, lineHeight: 17 }}>{storeAddr}</Text>}
          {!!p?.phone && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{p.phone}</Text>}
        </InfoRow>
        <InfoRow icon="pin" label={t('Livraison')} onCall={o.recipient_phone || o.customer_phone ? () => call(o.recipient_phone || o.customer_phone) : undefined}>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{o.customer_name}{o.recipient_is_customer === false ? ` · ${t('destinataire')}` : ''}</Text>
          {!!(o.recipient_phone || o.customer_phone) && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{o.recipient_phone || o.customer_phone}</Text>}
          {!!destAddr && <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 1, lineHeight: 17 }}>{destAddr}</Text>}
          {!!o.landmark && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{t('Repère : {l}', { l: o.landmark })}</Text>}
          <Text style={{ fontSize: 11, color: custGps ? LMX.emerald : LMX.ink50, fontFamily: sans(600), marginTop: 3 }}>
            {custGps ? t('Position GPS du client disponible') : t('Pas de position GPS — adresse uniquement')}
          </Text>
        </InfoRow>
        <MapButton onPress={() => onMap(o)} />
        <InfoRow icon="money" label={t('Paiement')}>
          {o.payment === 'cod' ? t('À encaisser à la livraison : {a} GNF', { a: fr(o.total) }) : t('Prépayée · {a} GNF', { a: fr(o.total) })}
        </InfoRow>

        {!!o.pickup_otp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.brandSoft, borderRadius: 12, padding: 12 }}>
            <Icon name="key" size={16} color={LMX.brand} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: LMX.brand, fontFamily: sans(700), textTransform: 'uppercase' }}>{t('Code de retrait')}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink70, marginTop: 1 }}>{t('Le livreur le donne au magasin pour récupérer le colis.')}</Text>
            </View>
            <Text style={{ fontFamily: mono(700), fontSize: 20, letterSpacing: 4, color: LMX.ink }}>{o.pickup_otp}</Text>
          </View>
        )}
        <Pill label={code.label} color={code.color} icon="shield" />
      </View>

      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: LMX.hairline, gap: 10 }}>
        {o.driver_name ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bike" size={14} color={LMX.ink} /></View>
            <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(600) }}>{o.driver_name}</Text>
            {canAssign && (
              <Pressable onPress={() => onAssign(o)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: LMX.surfaceAlt }}>
                <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.brand }}>{t('Réassigner')}</Text>
              </Pressable>
            )}
          </View>
        ) : canAssign ? (
          <Pressable onPress={() => onAssign(o)} style={{ height: 44, borderRadius: 12, backgroundColor: LMX.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="bike" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>{t('Assigner un livreur')}</Text>
          </Pressable>
        ) : null}
        {!done && (
          <Pressable onPress={() => onIncident(o)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }}>
            <Icon name="msg" size={13} color={LMX.rose} />
            <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.rose }}>{t('Signaler un incident')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={{ width: '48.5%', backgroundColor: LMX.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: LMX.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontFamily: mono(600), fontSize: 20 }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 4, fontFamily: sans(600) }}>{label}</Text>
    </View>
  );
}

function EntryTile({ icon, label, sub, onPress, dark }: { icon: IconName; label: string; sub?: string; onPress: () => void; dark?: boolean }) {
  const fg = dark ? '#fff' : LMX.ink;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minWidth: 100, backgroundColor: dark ? LMX.navy : LMX.surface, borderRadius: 14, padding: 12, borderWidth: dark ? 0 : 1, borderColor: LMX.border, gap: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: dark ? 'rgba(255,255,255,0.14)' : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} color={fg} /></View>
      <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: fg }}>{label}</Text>
      {!!sub && <Text style={{ fontSize: 10.5, color: fg, opacity: 0.6 }}>{sub}</Text>}
    </Pressable>
  );
}

function TabBar<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
      {tabs.map(tb => {
        const on = tb.key === value;
        return (
          <Pressable key={tb.key} onPress={() => onChange(tb.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: on ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
            <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{tb.label}</Text>
            {tb.count != null && tb.count > 0 && (
              <View style={{ minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: on ? 'rgba(255,255,255,0.25)' : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontFamily: mono(700), color: on ? '#fff' : LMX.ink70 }}>{tb.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 34, gap: 10, paddingHorizontal: 30 }}>
      <Icon name={icon} size={40} color={LMX.ink30} />
      <Text style={{ fontSize: 13, color: LMX.ink50, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

// ── Partner manager dashboard ─────────────────────────────────
type PartnerMe = Awaited<ReturnType<typeof partnerApi.me>>;

export function ScreenPartner() {
  const nav = useNavigation<any>();
  const [me, setMe]             = useState<PartnerMe | null>(null);
  const [tab, setTab]           = useState<PartnerTab>('to_assign');
  const [orders, setOrders]     = useState<DeliveryOrder[]>([]);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<DeliveryOrder | null>(null);
  const [drivers, setDrivers]   = useState<LogisticsDriver[]>([]);
  const [drvLoading, setDrvLoading] = useState(false);
  const [drvError, setDrvError] = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [mapFor, setMapFor]     = useState<DeliveryOrder | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const load = useCallback(async () => {
    const requested = tabRef.current;
    try {
      const [m, o] = await Promise.all([partnerApi.me(), partnerApi.orders(requested)]);
      setMe(m);
      if (tabRef.current === requested) setOrders(o.orders ?? []);
      setError(null);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]));

  const switchTab = (k: PartnerTab) => { if (k === tab) return; setTab(k); tabRef.current = k; setOrders([]); setLoad(true); load(); };

  const loadDrivers = useCallback(async () => {
    setDrvLoading(true);
    try { const r = await partnerApi.drivers(); setDrivers(r.drivers ?? []); setDrvError(null); }
    catch (e) { setDrvError(friendlyError(e)); }
    finally { setDrvLoading(false); }
  }, []);

  const openAssign = (o: DeliveryOrder) => { setAssignFor(o); loadDrivers(); };

  const assign = async (driverId: number) => {
    if (!assignFor) return;
    setBusy(true);
    try {
      await partnerApi.assignDriver(assignFor.id, driverId);
      setAssignFor(null);
      load();
    } catch (e) {
      if (isApiError(e) && (e.status === 409 || e.code === 'driver_unavailable')) {
        Alert.alert(t('Livreur indisponible'), e.message ? t(e.message) : t('Ce livreur est indisponible.'));
        loadDrivers();
      } else if (isApiError(e) && e.status === 403) {
        Alert.alert(t('Accès refusé'), t("Cette commande n'est plus attribuée à votre société."));
        setAssignFor(null);
        load();
      } else {
        Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'assigner.")));
      }
    } finally { setBusy(false); }
  };

  const c = me?.counts;
  const tabs: { key: PartnerTab; label: string; count?: number }[] = [
    { key: 'to_assign', label: t('À assigner'), count: c?.to_assign },
    { key: 'in_progress', label: t('En cours'), count: c?.in_progress },
    { key: 'history', label: t('Historique') },
    { key: 'failed', label: t('Échecs'), count: c?.failed },
  ];
  const emptyText: Record<PartnerTab, string> = {
    to_assign: t('Aucune commande à assigner.'),
    in_progress: t('Aucune livraison en cours.'),
    history: t('Aucune livraison terminée.'),
    failed: t('Aucun échec de livraison.'),
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <StaffHeader kicker={t('Partenaire logistique')} title={me?.partner.name || t('Ma société')} onRefresh={() => { setLoad(true); load(); }} />

      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <StatTile value={c?.to_assign ?? 0} label={t('À assigner')} color={LMX.accent} />
        <StatTile value={c?.in_progress ?? 0} label={t('En cours')} color={LMX.brand} />
        <StatTile value={c?.delivered_today ?? 0} label={t("Livrées aujourd'hui")} color={LMX.emerald} />
        <StatTile value={c?.failed ?? 0} label={t('Échecs')} color={LMX.rose} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 8 }}>
        <EntryTile dark icon="pin" label={t('Carte de mes livreurs')} onPress={() => nav.navigate('PartnerDriversMap', { scope: 'partner' })} />
        <EntryTile icon="msg" label={t('Incidents')} onPress={() => nav.navigate('PartnerIncidents')} />
        <EntryTile icon="wallet" label={t('Comptes')} onPress={() => nav.navigate('PartnerLedger')} />
      </View>

      <View style={{ paddingTop: 16 }}>
        <TabBar tabs={tabs} value={tab} onChange={switchTab} />
      </View>

      {!!error && orders.length > 0 && <View style={{ paddingHorizontal: 16, paddingTop: 12 }}><ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} /></View>}

      {loading && orders.length === 0 ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error && orders.length === 0 ? (
        <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
      ) : orders.length === 0 ? (
        <EmptyState icon="truck" text={emptyText[tab]} />
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
          {orders.map(o => (
            <PartnerOrderCard key={o.id} o={o} onAssign={openAssign} onIncident={x => nav.navigate('PartnerIncidents', { orderId: x.id })} onMap={setMapFor} />
          ))}
        </View>
      )}

      <DriverPickerSheet
        visible={!!assignFor}
        title={assignFor?.driver_id ? t('Réassigner un livreur') : t('Assigner un livreur')}
        subtitle={assignFor ? t('Commande {n}', { n: assignFor.number }) : undefined}
        drivers={drivers} loading={drvLoading && drivers.length === 0} error={drvError} busy={busy}
        currentId={assignFor?.driver_id ?? null}
        onRetry={loadDrivers} onPick={assign} onClose={() => setAssignFor(null)}
      />
      <OrderMapSheet order={mapFor} onClose={() => setMapFor(null)} />
    </Screen>
  );
}

// ── Incidents ─────────────────────────────────────────────────
function IncidentCard({ inc, showPartner, onResolve, busy }: { inc: Incident; showPartner?: boolean; onResolve?: () => void; busy?: boolean }) {
  const open = inc.status === 'open';
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, borderLeftWidth: 3, borderLeftColor: open ? (inc.type === 'unavailability' ? LMX.amber : LMX.rose) : LMX.emerald, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Pill label={inc.type === 'unavailability' ? t('Indisponibilité') : t('Incident')} color={inc.type === 'unavailability' ? LMX.amber : LMX.rose} />
        <Pill label={open ? t('Ouvert') : t('Résolu')} color={open ? LMX.accent : LMX.emerald} />
        {!!inc.order_number && <Text style={{ fontSize: 12, fontFamily: mono(600), color: LMX.ink }}>{inc.order_number}</Text>}
      </View>
      {showPartner && <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.brand }}>{inc.partner_name || 'Loomodex'}</Text>}
      <Text style={{ fontSize: 13, color: LMX.ink, lineHeight: 19 }}>{inc.message}</Text>
      <Text style={{ fontSize: 11, color: LMX.ink50 }}>
        {[inc.created_by_name, inc.created_at].filter(Boolean).join(' · ')}
        {inc.resolved_at ? ` · ${t('résolu le {d}', { d: inc.resolved_at })}` : ''}
      </Text>
      {open && onResolve && (
        <Button variant="soft" size="sm" icon="check" onPress={onResolve} disabled={busy} style={{ alignSelf: 'flex-start' }}>{t('Marquer comme résolu')}</Button>
      )}
    </View>
  );
}

export function ScreenPartnerIncidents() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const presetOrder: number | undefined = route.params?.orderId;
  const [items, setItems]       = useState<Incident[]>([]);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(!!presetOrder);
  const [type, setType]         = useState<'incident' | 'unavailability'>('incident');
  const [orderId, setOrderId]   = useState(presetOrder ? String(presetOrder) : '');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [orderOpts, setOrderOpts] = useState<{ value: string; label: string }[]>([]);

  const load = useCallback(async () => {
    try { const r = await partnerApi.incidents(); setItems(r.incidents ?? []); setError(null); }
    catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    Promise.all([partnerApi.orders('to_assign'), partnerApi.orders('in_progress')])
      .then(([a, b]) => setOrderOpts([...(a.orders ?? []), ...(b.orders ?? [])].map(o => ({ value: String(o.id), label: `${o.number} · ${o.customer_name}` }))))
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!message.trim()) { Alert.alert(t('Message requis'), t('Décrivez la situation.')); return; }
    setSending(true);
    try {
      await partnerApi.reportIncident({ type, message: message.trim(), order_id: orderId ? Number(orderId) : undefined });
      setFormOpen(false); setMessage(''); setOrderId(''); setType('incident');
      Alert.alert(t('Signalement envoyé'), t("L'équipe logistique Loomodex a été prévenue."));
      load();
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'envoyer le signalement."))); }
    finally { setSending(false); }
  };

  const options = [{ value: '', label: t('Aucune (signalement général)') }, ...orderOpts];
  if (presetOrder && !orderOpts.some(o => o.value === String(presetOrder))) options.push({ value: String(presetOrder), label: t('Commande #{n}', { n: presetOrder }) });

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Incidents')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Button variant="accent" full icon="plus" onPress={() => setFormOpen(true)}>{t('Signaler un incident / une indisponibilité')}</Button>
        {!!error && items.length > 0 && <ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} />}
        {loading && items.length === 0 ? (
          <View style={{ paddingTop: 30 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        ) : error && items.length === 0 ? (
          <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
        ) : items.length === 0 ? (
          <EmptyState icon="checkCircle" text={t('Aucun incident signalé.')} />
        ) : items.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
      </View>

      <Sheet visible={formOpen} title={t('Signaler un incident / une indisponibilité')} subtitle={t("L'équipe logistique Loomodex sera prévenue immédiatement.")} onClose={() => setFormOpen(false)}
        footer={<Button variant="accent" full icon="arrowR" onPress={submit} disabled={sending}>{sending ? t('Envoi…') : t('Envoyer')}</Button>}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['incident', 'unavailability'] as const).map(k => {
            const on = type === k;
            return (
              <Pressable key={k} onPress={() => setType(k)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? LMX.ink : LMX.surfaceAlt }}>
                <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{k === 'incident' ? t('Incident') : t('Indisponibilité')}</Text>
              </Pressable>
            );
          })}
        </View>
        <Picker label={t('Commande concernée (optionnel)')} value={orderId} onChange={setOrderId} options={options} placeholder={t('Aucune (signalement général)')} />
        <TextArea label={t('Message')} value={message} onChangeText={setMessage} lines={4}
          placeholder={type === 'incident' ? t('Ex. : colis endommagé, client injoignable…') : t('Ex. : aucun livreur disponible cet après-midi…')} />
      </Sheet>
    </Screen>
  );
}

// ── Ledger (partner: his own · Loomodex: any partner via route param) ──
export function ScreenPartnerLedger() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const partnerId: string | undefined = route.params?.partnerId;
  const partnerName: string | undefined = route.params?.name;
  const lmMode = !!partnerId;
  const [data, setData]         = useState<PartnerLedger | null>(null);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [view, setView]         = useState<'deliveries' | 'remittances'>('deliveries');
  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount]     = useState('');
  const [date, setDate]         = useState(todayYmd());
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    try { setData(await (partnerId ? logisticsApi.ledger(partnerId) : partnerApi.ledger())); setError(null); }
    catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, [partnerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const record = async () => {
    const a = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!a || a <= 0) { Alert.alert(t('Montant invalide'), t('Entrez un montant valide.')); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) { Alert.alert(t('Date invalide'), t('Format attendu : AAAA-MM-JJ.')); return; }
    setSaving(true);
    try {
      await logisticsApi.recordRemittance({ partner_id: partnerId!, amount: a, date: date.trim(), note: note.trim() || undefined });
      setFormOpen(false); setAmount(''); setNote(''); setDate(todayYmd());
      setView('remittances');
      load();
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'enregistrer le versement."))); }
    finally { setSaving(false); }
  };

  const cur = data?.currency || 'GNF';
  const money = (n: number) => `${fr(Math.round(n))} ${cur}`;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={lmMode ? (partnerName || t('Comptes partenaire')) : t('Mes comptes')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      {loading && !data ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error && !data ? (
        <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
      ) : data ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {!!error && <ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} />}
          <View style={{ backgroundColor: LMX.navy, borderRadius: LMX.r.lg, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Encaissé')}</Text>
                <Text style={{ fontSize: 14, fontFamily: mono(600), color: '#fff', marginTop: 3 }}>{money(data.collected)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Reversé à Loomodex')}</Text>
                <Text style={{ fontSize: 14, fontFamily: mono(600), color: '#fff', marginTop: 3 }}>{money(data.remitted)}</Text>
              </View>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 10 }}>
              <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Solde à reverser')}</Text>
              <Text style={{ fontSize: 22, fontFamily: mono(700), color: data.balance > 0 ? LMX.accent : LMX.emerald, marginTop: 3 }}>{money(data.balance)}</Text>
            </View>
          </View>

          {lmMode && <Button variant="accent" full icon="plus" onPress={() => setFormOpen(true)}>{t('Enregistrer un versement')}</Button>}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['deliveries', 'remittances'] as const).map(k => {
              const on = view === k;
              return (
                <Pressable key={k} onPress={() => setView(k)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
                  <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{k === 'deliveries' ? t('Livraisons ({n})', { n: data.deliveries.length }) : t('Versements ({n})', { n: data.remittances.length })}</Text>
                </Pressable>
              );
            })}
          </View>

          {view === 'deliveries' ? (
            data.deliveries.length === 0 ? <EmptyState icon="package" text={t('Aucune livraison encaissée.')} /> : (
              <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border }}>
                {data.deliveries.map((d, i) => (
                  <View key={d.order_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: LMX.hairline }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12.5, fontFamily: mono(600), color: LMX.ink }}>{d.number}</Text>
                      <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{d.date} · {d.payment === 'cod' ? t('Paiement à la livraison') : t('Prépayée')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12.5, fontFamily: mono(700), color: d.collected > 0 ? LMX.accent : LMX.ink50 }}>{money(d.collected)}</Text>
                      <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{t('Total {a}', { a: money(d.total) })}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : (
            data.remittances.length === 0 ? <EmptyState icon="wallet" text={t('Aucun versement enregistré.')} /> : (
              <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border }}>
                {data.remittances.map((r, i) => (
                  <View key={r.id} style={{ padding: 12, gap: 3, borderTopWidth: i ? 1 : 0, borderTopColor: LMX.hairline }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{r.date}</Text>
                      <Text style={{ fontSize: 13, fontFamily: mono(700), color: LMX.emerald }}>{money(r.amount)}</Text>
                    </View>
                    {!!r.note && <Text style={{ fontSize: 12, color: LMX.ink70 }}>{r.note}</Text>}
                    {!!r.recorded_by_name && <Text style={{ fontSize: 10.5, color: LMX.ink50 }}>{t('Enregistré par {n}', { n: r.recorded_by_name })}</Text>}
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      ) : null}

      {lmMode && (
        <Sheet visible={formOpen} title={t('Enregistrer un versement')} subtitle={partnerName} onClose={() => setFormOpen(false)}
          footer={<Button variant="accent" full icon="check" onPress={record} disabled={saving}>{saving ? t('Enregistrement…') : t('Enregistrer')}</Button>}>
          <TextArea label={t('Montant (GNF)')} value={amount} onChangeText={setAmount} keyboardType="number-pad" lines={1} placeholder="0" />
          <TextArea label={t('Date (AAAA-MM-JJ)')} value={date} onChangeText={setDate} lines={1} />
          <TextArea label={t('Note (optionnel)')} value={note} onChangeText={setNote} lines={2} placeholder={t('Ex. : dépôt Orange Money, réf. 1234')} />
        </Sheet>
      )}
    </Screen>
  );
}

// ── Loomodex logistics: incidents from every partner ──────────
export function ScreenLogisticsIncidents() {
  const nav = useNavigation<any>();
  const [tab, setTab]           = useState<'open' | 'resolved'>('open');
  const [items, setItems]       = useState<Incident[]>([]);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [busyId, setBusyId]     = useState<number | null>(null);

  const load = useCallback(async () => {
    try { const r = await logisticsApi.incidents(tab); setItems(r.incidents ?? []); setError(null); }
    catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const resolve = (inc: Incident) => {
    Alert.alert(t('Marquer comme résolu'), t('Clore ce signalement ?'), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Résolu'), onPress: async () => {
        setBusyId(inc.id);
        try { await logisticsApi.resolveIncident(inc.id); load(); }
        catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.'))); }
        finally { setBusyId(null); }
      } },
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Incidents partenaires')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['open', 'resolved'] as const).map(k => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={() => { if (k !== tab) { setItems([]); setTab(k); } }} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
                <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{k === 'open' ? t('Ouverts') : t('Résolus')}</Text>
              </Pressable>
            );
          })}
        </View>
        {!!error && items.length > 0 && <ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} />}
        {loading && items.length === 0 ? (
          <View style={{ paddingTop: 30 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        ) : error && items.length === 0 ? (
          <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
        ) : items.length === 0 ? (
          <EmptyState icon="checkCircle" text={tab === 'open' ? t('Aucun incident ouvert.') : t('Aucun incident résolu.')} />
        ) : items.map(inc => (
          <IncidentCard key={inc.id} inc={inc} showPartner busy={busyId === inc.id} onResolve={() => resolve(inc)} />
        ))}
      </View>
    </Screen>
  );
}

// ── Loomodex logistics: partner companies ─────────────────────
export function ScreenLogisticsPartners() {
  const nav = useNavigation<any>();
  const [items, setItems]       = useState<LogisticsPartner[]>([]);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const r = await logisticsApi.partners(); setItems(r.partners ?? []); setError(null); }
    catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Partenaires logistiques')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {!!error && items.length > 0 && <ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} />}
        {loading && items.length === 0 ? (
          <View style={{ paddingTop: 30 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        ) : error && items.length === 0 ? (
          <ErrorState message={error} onRetry={() => { setLoad(true); load(); }} />
        ) : items.length === 0 ? (
          <EmptyState icon="truck" text={t('Aucun partenaire logistique.')} />
        ) : items.map(p => (
          <Pressable key={p.id} onPress={() => nav.navigate('PartnerLedger', { partnerId: p.id, name: p.name })}
            style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 10, opacity: p.active ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="truck" size={17} color={LMX.ink} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{p.name}</Text>
                {!!p.phone && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{p.phone}</Text>}
              </View>
              {!p.active && <Pill label={t('Inactif')} color={LMX.ink50} />}
              <Icon name="chevR" size={16} color={LMX.ink50} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { v: String(p.open_orders), l: t('Commandes ouvertes') },
                { v: String(p.drivers_count), l: t('Livreurs') },
                { v: `${fr(Math.round(p.balance))}`, l: t('Solde (GNF)'), c: p.balance > 0 ? LMX.accent : LMX.emerald },
              ].map((x, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: LMX.bg, borderRadius: 10, padding: 9 }}>
                  <Text style={{ fontSize: 14, fontFamily: mono(700), color: x.c ?? LMX.ink }}>{x.v}</Text>
                  <Text style={{ fontSize: 10, color: LMX.ink50, marginTop: 2, fontFamily: sans(600) }}>{x.l}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
