import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../queryClient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LMX, FONT, sans, mono, fr } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Chip, SummaryRow, SettingRow, MapVisual, Field } from '../components';
import { LiveMap } from '../components/LiveMap';
import { ordersApi, Order, OrderTracking } from '../api/orders';
import { useAuth } from '../context/AuthContext';

function HelpTile({ icon, title, onPress }: { icon: any; title: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} color={LMX.ink} /></View>
      <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600) }}>{title}</Text>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </Pressable>
  );
}

export function ScreenOrderSuccess() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number | undefined     = route.params?.orderId;
  const orderNumber: string | undefined = route.params?.orderNumber;
  const guestEmail: string              = route.params?.guestEmail ?? '';

  const { isLoggedIn, claimOrder } = useAuth();
  // Offer account creation only to guests (not already signed in)
  const [showAccount, setShowAccount] = useState(!isLoggedIn);
  const [acctEmail, setAcctEmail]     = useState(guestEmail);
  const [acctPass, setAcctPass]       = useState('');
  const [acctBusy, setAcctBusy]       = useState(false);
  const [acctDone, setAcctDone]       = useState(false);

  const createAccount = async () => {
    if (!orderId) return;
    if (acctPass.trim().length < 6) { Alert.alert('Mot de passe', 'Au moins 6 caractères.'); return; }
    setAcctBusy(true);
    try {
      await claimOrder(orderId, acctPass.trim(), acctEmail.trim() || undefined);
      setAcctDone(true);
    } catch (e: any) {
      Alert.alert('Création du compte', e?.message ?? 'Impossible de créer le compte.');
    } finally {
      setAcctBusy(false);
    }
  };

  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="ghost" size="lg" style={{ flex: 1 }} onPress={() => nav.navigate('Main')}>Continuer</Button>
        {/* Order detail needs an account; guests get public tracking (by order number) */}
        <Button variant="accent" size="lg" style={{ flex: 1 }}
          onPress={() => isLoggedIn
            ? nav.navigate('OrderDetails', { orderId })
            : nav.navigate('TrackEntry', { number: (orderNumber ?? '').replace(/^#/, '') })}>
          {isLoggedIn ? 'Voir la commande' : 'Suivre la commande'}
        </Button>
      </View>
    }>
      <AppBar left={<IconBtn icon="close" onPress={() => nav.navigate('Main')} />} />
      <View style={{ paddingHorizontal: 28, paddingTop: 30, alignItems: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: LMX.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={42} color={LMX.emerald} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, marginTop: 24, color: LMX.ink }}>Commande passée !</Text>
        <Text style={{ marginTop: 12, fontSize: 14, lineHeight: 21, color: LMX.ink70, textAlign: 'center', maxWidth: 280 }}>
          Votre commande est en cours de préparation. Nous vous notifierons dès qu'elle est en route.
        </Text>
        {!isLoggedIn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: LMX.brandSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Icon name="truck" size={16} color={LMX.brand} />
            <Text style={{ flex: 1, fontSize: 12, color: LMX.brandDeep, lineHeight: 16 }}>
              Gardez votre numéro de commande {orderNumber ?? ''} pour suivre votre colis à tout moment. Un lien de suivi vous est aussi envoyé par SMS{guestEmail ? ' et email' : ''}.
            </Text>
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 18, borderWidth: 1, borderColor: LMX.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Numéro de commande</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 15, marginTop: 4 }}>{orderNumber ?? `#${orderId}`}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Livraison</Text>
              <Text style={{ fontSize: 13, fontFamily: sans(600), marginTop: 4 }}>3h–48h · Conakry</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="money" size={16} color={LMX.emerald} />
            <Text style={{ flex: 1, fontSize: 12.5 }}>Paiement à la livraison · Inspectez avant de payer</Text>
            <Icon name="shield" size={16} color={LMX.ink50} />
          </View>
        </View>
      </View>
      {/* Guest account creation prompt (matches the website thank-you page) */}
      {showAccount && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 18, borderWidth: 1, borderColor: LMX.border }}>
            {acctDone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="checkCircle" size={20} color={LMX.emerald} />
                <Text style={{ flex: 1, fontSize: 13.5, fontFamily: sans(600), color: LMX.ink }}>Compte créé — vous êtes connecté.</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 14.5, fontFamily: sans(700), color: LMX.ink }}>Créer un compte ?</Text>
                <Text style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 18, marginTop: 5 }}>
                  Suivez vos commandes, enregistrez vos adresses et payez plus vite la prochaine fois.
                </Text>
                <View style={{ gap: 10, marginTop: 12 }}>
                  <Field label="Email (optionnel)" value={acctEmail} onChangeText={setAcctEmail} keyboardType="email-address" autoCapitalize="none" />
                  <Field label="Choisir un mot de passe" value={acctPass} onChangeText={setAcctPass} secure />
                  <Button variant="accent" onPress={createAccount} disabled={acctBusy}>
                    {acctBusy ? 'Création…' : 'Créer mon compte'}
                  </Button>
                  <Pressable onPress={() => setShowAccount(false)} style={{ alignItems: 'center', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12.5, color: LMX.ink50, fontFamily: sans(500) }}>Plus tard</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* OTP delivery verification info (matches the website thank-you page) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ backgroundColor: LMX.brandSoft, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="key" size={17} color={LMX.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.brandDeep }}>Vérification de la livraison</Text>
            <Text style={{ fontSize: 12, color: LMX.ink70, lineHeight: 18, marginTop: 4 }}>
              Quand un livreur est assigné à votre commande, vous recevrez un code de vérification (OTP) par email/SMS. Communiquez ce code au livreur pour confirmer la livraison.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 10 }}>
        <HelpTile icon="truck" title="Suivre" onPress={() => isLoggedIn
          ? nav.navigate('Tracking', { orderId })
          : nav.navigate('TrackEntry', { number: (orderNumber ?? '').replace(/^#/, '') })} />
        <HelpTile icon="headset" title="Aide" onPress={() => nav.navigate('Help')} />
      </View>
    </Screen>
  );
}

// Customer-facing delivery flow → display step
const TRACK_FLOW: { keys: string[]; label: string }[] = [
  { keys: ['pending'],                        label: 'Commande passée' },
  { keys: ['processing'],                      label: 'Confirmée · en préparation' },
  { keys: ['ready-dispatch'],                  label: 'Prête pour expédition' },
  { keys: ['assigned-driver'],                 label: 'Livreur assigné' },
  { keys: ['out-delivery'],                    label: 'En cours de livraison' },
  { keys: ['driver-arrived', 'otp-pending'],   label: 'Livreur arrivé' },
  { keys: ['otp-verified', 'completed'],       label: 'Livré' },
];

function currentStep(status: string): number {
  const idx = TRACK_FLOW.findIndex(s => s.keys.includes(status));
  return idx === -1 ? 0 : idx;
}

function Timeline({ status }: { status: string }) {
  const current = currentStep(status);
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, borderWidth: 1, borderColor: LMX.border }}>
      {TRACK_FLOW.map((s, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 14, paddingBottom: i === TRACK_FLOW.length - 1 ? 12 : 18 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: done ? LMX.ink : LMX.surface, borderWidth: done ? 0 : 1.5, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}>
                {done && <Icon name="check" size={9} color="#fff" strokeWidth={2.5} />}
              </View>
              {i < TRACK_FLOW.length - 1 && <View style={{ width: 1.5, flex: 1, backgroundColor: i < current ? LMX.ink : LMX.ink10, marginTop: 2, minHeight: 22 }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: active ? sans(600) : sans(500), color: done ? LMX.ink : LMX.ink50 }}>{s.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ScreenTracking() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number | undefined = route.params?.orderId;
  const preloaded: Order | undefined = route.params?.order;

  const [order, setOrder]   = useState<Order | null>(preloaded ?? null);
  const [track, setTrack]   = useState<OrderTracking | null>(null);
  const [loading, setLoad]  = useState(!preloaded);
  const [eta, setEta]       = useState<{ duration: string; distance: string } | null>(null);

  useEffect(() => {
    if (!orderId) { setLoad(false); return; }
    let alive = true;
    const fetchOrder = () => ordersApi.get(orderId)
      .then(o => { if (alive) setOrder(o); })
      .catch(() => {})
      .finally(() => { if (alive) setLoad(false); });
    const fetchTrack = () => ordersApi.tracking(orderId)
      .then(t => { if (alive) setTrack(t); })
      .catch(() => {});
    fetchOrder();
    fetchTrack();
    // Poll order status (30s) and the live driver position (15s while active)
    const t1 = setInterval(fetchOrder, 30000);
    const t2 = setInterval(fetchTrack, 15000);
    return () => { alive = false; clearInterval(t1); clearInterval(t2); };
  }, [orderId]);

  if (loading) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Suivi de commande" right={<IconBtn icon="headset" onPress={() => nav.navigate('Help')} />} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Suivi de commande" right={<IconBtn icon="headset" onPress={() => nav.navigate('Help')} />} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Icon name="package" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 15, color: LMX.ink70 }}>Commande introuvable</Text>
          <Button variant="ghost" onPress={() => nav.navigate('TrackEntry')}>Suivre avec un numéro</Button>
        </View>
      </Screen>
    );
  }

  const status   = order.status;
  const step     = currentStep(status);
  const failed   = ['cancelled', 'delivery-failed', 'refunded'].includes(status);
  const arrived  = ['driver-arrived', 'otp-pending'].includes(status);
  const delivered= ['otp-verified', 'completed'].includes(status);
  const enRoute  = status === 'out-delivery';
  // Prefer the tracking payload (has the driver as soon as assigned, incl. WhatsApp);
  // fall back to the order's driver field.
  const drvName  = track?.driver?.name  || order.driver?.name  || '';
  const drvPhone = track?.driver?.phone || order.driver?.phone || '';
  const drvWa    = track?.driver?.whatsapp || '';
  const hasDriver = !!(drvName || drvPhone);
  const initials = drvName ? drvName.split(' ').map(n => n[0]).join('').slice(0, 2) : '?';
  const liveTracking = !!(track?.active && track.maps_key && track.driver && track.driver.lat != null && track.driver.lng != null);
  const waLink = (num: string) => `https://wa.me/${num.replace(/[^0-9]/g, '')}`;

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Suivi de commande" right={<IconBtn icon="headset" onPress={() => nav.navigate('Help')} />} />

      {/* Map + live status banner */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ position: 'relative' }}>
          {liveTracking ? (
            <LiveMap
              mapsKey={track!.maps_key}
              driver={{ lat: track!.driver!.lat as number, lng: track!.driver!.lng as number }}
              destination={track!.destination}
              height={220}
              onEta={setEta}
            />
          ) : (
            <View style={{ height: 220, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: LMX.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={delivered ? 'checkCircle' : failed ? 'close' : 'pin'} size={24} color={delivered ? LMX.emerald : failed ? LMX.rose : LMX.brand} />
              </View>
              <Text style={{ fontSize: 12.5, color: LMX.ink70, textAlign: 'center', lineHeight: 18 }}>
                {delivered ? 'Commande livrée.'
                  : failed ? 'Cette commande n\'est plus active.'
                  : (track?.active && hasDriver) ? 'En attente de la position du livreur en direct…'
                  : status === 'assigned-driver' ? 'Livreur assigné — la carte en direct s\'activera dès qu\'il sera en route.'
                  : 'Le suivi en direct s\'affichera dès que votre commande sera en cours de livraison.'}
              </Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }} pointerEvents="none">
            <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: failed ? LMX.rose : delivered ? LMX.emerald : LMX.amber }} />
              <Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>{order.status_label}</Text>
            </View>
            {liveTracking && (
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={{ backgroundColor: LMX.brand, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                  <Text style={{ fontSize: 10.5, fontFamily: sans(700), color: '#fff' }}>EN DIRECT</Text>
                </View>
                {!!eta && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name="truck" size={12} color={LMX.brand} />
                    <Text style={{ fontSize: 10.5, fontFamily: sans(700), color: LMX.ink }}>~{eta.duration} · {eta.distance}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Driver card */}
      {hasDriver && !delivered && (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14, fontFamily: sans(600) }}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{drvName || 'Votre livreur'}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{enRoute ? (eta ? `Arrive dans ~${eta.duration} · ${eta.distance}` : 'En route vers vous') : arrived ? 'Arrivé à destination' : 'Votre livreur'}</Text>
            </View>
            {!!drvWa && (
              <Pressable onPress={() => Linking.openURL(waLink(drvWa))} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color="#fff" /></Pressable>
            )}
            {!!drvPhone && (
              <Pressable onPress={() => Linking.openURL(`tel:${drvPhone}`)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color="#fff" /></Pressable>
            )}
          </View>
        </View>
      )}

      {/* OTP / status card */}
      {!failed && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {delivered ? (
            <View style={{ backgroundColor: LMX.emeraldSoft, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="checkCircle" size={22} color={LMX.emerald} />
              <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600), color: LMX.emerald }}>Livraison confirmée. Merci pour votre commande !</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.lg, padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Icon name="shield" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Code de confirmation</Text>
                  <Text style={{ fontSize: 12.5, color: '#fff', marginTop: 4, lineHeight: 17 }}>
                    {track?.otp
                      ? 'Communiquez ce code au livreur après avoir inspecté votre commande.'
                      : arrived
                        ? 'Votre code de confirmation s\'affichera ici. Communiquez-le au livreur après inspection.'
                        : 'Un code unique s\'affichera ici à l\'arrivée du livreur.'}
                  </Text>
                </View>
              </View>
              {!!track?.otp && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 30, letterSpacing: 8, fontFamily: mono(700), color: '#fff' }}>{track.otp}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {failed && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ backgroundColor: '#FFF5F5', borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.rose + '44', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="close" size={20} color={LMX.rose} />
            <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600), color: LMX.rose }}>{order.status_label}</Text>
          </View>
        </View>
      )}

      {/* Order summary + timeline */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Commande {order.number}</Text>
          <Text style={{ color: LMX.ink50, fontFamily: mono(400), fontSize: 12 }}>{fr(order.total)} GNF</Text>
        </View>
        {!failed && <Timeline status={status} />}
      </View>
    </Screen>
  );
}

function RecentTrack({ id, date, status, emerald, last, onPress }: { id: string; date: string; status: string; emerald?: boolean; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={15} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: mono(600) }}>{id}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{date}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {emerald && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: LMX.emerald }} />}
        <Text style={{ fontSize: 11, fontFamily: sans(600), color: emerald ? LMX.emerald : LMX.ink70 }}>{status}</Text>
      </View>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </Pressable>
  );
}

export function ScreenTrackEntry() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [number, setNumber] = useState(route.params?.number ?? '');
  const [email, setEmail]   = useState('');
  const [loading, setLoad]  = useState(false);

  const track = async () => {
    if (!number.trim()) { Alert.alert('Numéro requis', 'Veuillez entrer votre numéro de commande.'); return; }
    setLoad(true);
    try {
      const order = await ordersApi.track(number.trim().replace(/^#/, ''), email.trim() || undefined);
      nav.navigate('Tracking', { order });
    } catch (e: any) {
      Alert.alert('Introuvable', e?.message ?? 'Aucune commande trouvée avec ce numéro.');
    } finally { setLoad(false); }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Suivre une commande" right={<IconBtn icon="headset" onPress={() => nav.navigate('Help')} />} />
      <View style={{ paddingHorizontal: 24, alignItems: 'center', paddingTop: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LMX.border, marginTop: 20 }}>
          <Icon name="package" size={36} color={LMX.ink} strokeWidth={1.5} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 28, marginTop: 20, color: LMX.ink }}>Où est ma commande ?</Text>
        <Text style={{ marginTop: 12, fontSize: 13, color: LMX.ink70, lineHeight: 20, textAlign: 'center', maxWidth: 280 }}>Entrez votre numéro de commande — aucun compte requis.</Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 14 }}>
        <Field label="Numéro de commande" value={number} onChangeText={setNumber} prefix="#" placeholder="204-882" />
        <Field label="Email (optionnel)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Pour vérifier votre identité" />
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        {loading
          ? <ActivityIndicator color={LMX.brand} size="large" />
          : <Button full variant="accent" size="lg" icon="arrowR" onPress={track}>Suivre la commande</Button>
        }
      </View>
    </Screen>
  );
}

function OrderCard({ order, onPress }: { order: any; onPress?: () => void }) {
  const statusColor = { active: LMX.emerald, prep: LMX.amber, done: LMX.ink70, refund: LMX.rose }[order.variant as string];
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={{ fontFamily: mono(600), fontSize: 12 }}>{order.id}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{order.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: order.variant === 'active' ? LMX.emeraldSoft : LMX.surfaceAlt }}>
          {order.variant === 'active' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusColor }} />}
          <Text style={{ color: statusColor, fontSize: 10.5, fontFamily: sans(700), textTransform: 'uppercase' }}>{order.status}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {order.items.slice(0, 3).map((p: any, i: number) => (
            <ExpoImage key={p.id ?? i} source={{ uri: p.image || IMG(p.slug) }} style={{ width: 38, height: 38, borderRadius: 10, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: LMX.surface }} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(500) }}>{order.items[0].name}{order.count > 1 ? ` + ${order.count - 1} more` : ''}</Text>
          <Text style={{ fontFamily: mono(400), fontSize: 12, color: LMX.ink70, marginTop: 4 }}>{fr(order.total)} <Text style={{ fontSize: 10, color: LMX.ink50 }}>GNF</Text></Text>
        </View>
      </View>
      <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: LMX.hairline, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{order.count} article{order.count > 1 ? 's' : ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>Voir les détails</Text>
          <Icon name="chevR" size={13} color={LMX.brand} />
        </View>
      </View>
    </Pressable>
  );
}

function statusVariant(status: string) {
  if (['out-delivery', 'assigned-driver', 'driver-arrived', 'otp-pending'].includes(status)) return 'active';
  if (['processing', 'ready-dispatch', 'on-hold'].includes(status)) return 'prep';
  if (['completed', 'otp-verified'].includes(status)) return 'done';
  if (['cancelled', 'refunded', 'delivery-failed'].includes(status)) return 'refund';
  return 'prep';
}

export function ScreenOrdersList() {
  const nav = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const [filter, setFilter] = useState('all');
  const { data, isLoading: loading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list({ per_page: 20 }),
    enabled: isLoggedIn,
  });
  const orders = data?.orders ?? [];

  const filters = ['all', 'pending', 'processing', 'out-delivery', 'completed', 'cancelled'];

  // Map API order to local OrderCard shape
  const toCard = (o: Order) => ({
    id: o.number,
    date: o.date ? new Date(o.date).toLocaleDateString('fr-FR') : '',
    total: o.total,
    items: o.items.map(i => ({ slug: '', image: i.image, name: i.name })),
    count: o.item_count,
    status: o.status_label,
    variant: statusVariant(o.status),
    orderId: o.id,
  });

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mes commandes" right={<IconBtn icon="search" />} />

      {!isLoggedIn ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 }}>
          <Icon name="package" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 18, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>Suivre vos commandes</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center', lineHeight: 19 }}>
            Suivez une commande passée en tant qu'invité avec votre numéro de commande, ou connectez-vous pour retrouver tout votre historique.
          </Text>
          <Button variant="accent" onPress={() => nav.navigate('TrackEntry')}>Suivre une commande</Button>
          <Pressable onPress={() => nav.navigate('SignIn')}>
            <Text style={{ fontSize: 13.5, color: LMX.brand, fontFamily: sans(600) }}>Se connecter</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={LMX.brand} size="large" />
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="package" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 18, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>Aucune commande pour l'instant</Text>
          <Button variant="accent" onPress={() => nav.navigate('Main')}>Commencer vos achats</Button>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 14, flexWrap: 'wrap' }}>
            <Chip active={filter === 'all'} onPress={() => setFilter('all')}>Tout · {orders.length}</Chip>
            <Chip active={filter === 'processing'} onPress={() => setFilter('processing')}>En prépa.</Chip>
            <Chip active={filter === 'out-delivery'} onPress={() => setFilter('out-delivery')}>En route</Chip>
            <Chip active={filter === 'completed'} onPress={() => setFilter('completed')}>Livré</Chip>
          </View>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {orders
              .filter(o => filter === 'all' || o.status === filter)
              .map(o => <OrderCard key={o.id} order={toCard(o)} onPress={() => nav.navigate('OrderDetails', { orderId: o.id })} />)
            }
          </View>
        </>
      )}
    </Screen>
  );
}

function QuickActionTile({ icon, label, accent, onPress }: { icon: any; label: string; accent?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, paddingVertical: 14, borderRadius: LMX.r.lg, backgroundColor: accent ? LMX.ink : LMX.surface, borderWidth: accent ? 0 : 1, borderColor: LMX.border, alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={18} color={accent ? '#fff' : LMX.ink} />
      <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: accent ? '#fff' : LMX.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ScreenOrderDetails() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number | undefined = route.params?.orderId;

  const [cancelling, setC]  = useState(false);
  const { data: order = null, isLoading: loading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId as number),
    enabled: !!orderId,
  });

  const handleCancel = () => {
    if (!order) return;
    Alert.alert('Annuler la commande', 'Êtes-vous sûr de vouloir annuler ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: async () => {
        setC(true);
        try {
          await ordersApi.cancel(order.id, 'Annulation client via app');
          await refetch();
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (e: any) {
          Alert.alert('Erreur', e.message ?? 'Annulation impossible à ce stade.');
        } finally { setC(false); }
      }}
    ]);
  };

  const canCancel = order && ['pending','processing','on-hold'].includes(order.status);
  const isActive  = order && ['out-delivery','assigned-driver','driver-arrived'].includes(order.status);

  const statusColor = (s: string) => {
    if (['completed','otp-verified'].includes(s)) return LMX.emerald;
    if (['out-delivery','assigned-driver'].includes(s)) return LMX.brand;
    if (['cancelled','delivery-failed'].includes(s)) return LMX.rose;
    return LMX.amber;
  };

  if (loading) return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
    </Screen>
  );

  if (!order) return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Commande" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Icon name="package" size={48} color={LMX.ink30} />
        <Text style={{ fontSize: 15, color: LMX.ink70 }}>Commande introuvable</Text>
      </View>
    </Screen>
  );

  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {canCancel && (
          <Button variant="ghost" size="md" style={{ flex: 1 }} onPress={handleCancel} disabled={cancelling}>
            {cancelling ? 'Annulation...' : 'Annuler'}
          </Button>
        )}
        {isActive && (
          <Button variant="primary" size="md" style={{ flex: 1 }} icon="truck" onPress={() => nav.navigate('Tracking', { orderId: order.id })}>Suivre</Button>
        )}
        {!canCancel && !isActive && (
          <Button full variant="ghost" size="md" onPress={() => nav.navigate('Help')}>Besoin d'aide ?</Button>
        )}
      </View>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} right={<IconBtn icon="share" />} />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Commande</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 20 }}>{order.number}</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: statusColor(order.status) + '22' }}>
            <Text style={{ color: statusColor(order.status), fontSize: 11, fontFamily: sans(700), textTransform: 'uppercase' }}>{order.status_label}</Text>
          </View>
        </View>
        {order.date && (
          <Text style={{ fontSize: 12, color: LMX.ink50, marginTop: 6 }}>
            {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Quick actions */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
        <QuickActionTile icon="truck" label="Suivre" accent onPress={() => nav.navigate('Tracking', { orderId: order.id })} />
        <QuickActionTile icon="headset" label="Contact" onPress={() => nav.navigate('Help')} />
      </View>

      {/* Items */}
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>
        Articles · {order.item_count}
      </Text>
      <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
        {order.items.map((it, i) => (
          <View key={it.id} style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center', borderBottomWidth: i < order.items.length - 1 ? 1 : 0, borderBottomColor: LMX.hairline }}>
            {it.image
              ? <ExpoImage source={{ uri: it.image }} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />
              : <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={20} color={LMX.ink30} /></View>
            }
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(500) }}>{it.name}</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 12, marginTop: 4 }}>
                ×{it.qty} · {fr(it.total)} <Text style={{ fontSize: 9, color: LMX.ink50 }}>GNF</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery & payment */}
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Livraison & paiement</Text>
      <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
        <SettingRow icon="pin" label={`${order.billing.city || 'Conakry'}`} sub={`${order.billing.first_name} ${order.billing.last_name} · ${order.billing.phone || ''}`} />
        <SettingRow icon="money" label={order.payment_method} sub={`${fr(order.total)} GNF`} last />
      </View>

      {/* Driver info */}
      {order.driver && (
        <>
          <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Livreur</Text>
          <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
            <SettingRow icon="bike" label={order.driver.name} sub={order.driver.phone} last />
          </View>
        </>
      )}

      {/* Summary */}
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Récapitulatif</Text>
      <View style={{ margin: 16, marginTop: 8, padding: 16, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
        <SummaryRow label={`Sous-total (${order.item_count} articles)`} value={order.total - order.shipping_total} />
        <SummaryRow label="Livraison" value={order.shipping_total} />
        <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total</Text>
          <Price value={order.total} size="md" />
        </View>
      </View>
    </Screen>
  );
}
