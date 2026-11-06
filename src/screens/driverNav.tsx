import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LMX, sans, decodeEntities, shadow } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn } from '../components';
import { LiveMap, PIN_COLOR, NavStep, RouteStatus } from '../components/LiveMap';
import { useLivePosition, GpsStatus } from '../hooks/useLivePosition';
import { configApi } from '../api/config';
import { ordersApi } from '../api/orders';
import { DeliveryOrder } from '../api/delivery';
import { t } from '../i18n';

export type NavTarget = 'store' | 'customer';

/** Which leg the driver is on: the store before pickup, the customer after. */
export function navTargetFor(o: DeliveryOrder): NavTarget {
  return o.status === 'assigned-driver' ? 'store' : 'customer';
}

/**
 * Big full-width "Naviguer vers le magasin / le client" button. Opens the in-app
 * full-screen navigation map (no external Google Maps app).
 */
export function NavigateButton({ order, onPress }: { order: DeliveryOrder; onPress: () => void }) {
  const target = navTargetFor(order);
  const color = target === 'store' ? LMX.accent : LMX.brand;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 12, backgroundColor: color, ...shadow('sm') }}>
      <Icon name="map" size={18} color="#fff" />
      <Text style={{ fontSize: 15, fontFamily: sans(700), color: '#fff' }}>
        {target === 'store' ? t('Naviguer vers le magasin') : t('Naviguer vers le client')}
      </Text>
    </Pressable>
  );
}

/** Message (+ whether to offer the phone settings) when GPS, the route or the map is unavailable. */
export function navProblem(gps: GpsStatus, route: RouteStatus | null): { text: string; settings?: boolean } | null {
  if (gps === 'denied') return { text: t('Autorisez la localisation pour Loomodex afin de calculer votre itinéraire.'), settings: true };
  if (gps === 'off') return { text: t('La localisation (GPS) de votre téléphone est désactivée. Activez-la puis réessayez.'), settings: true };
  if (gps === 'timeout') return { text: t("Impossible d'obtenir votre position. Vérifiez que le GPS est activé, de préférence à l'extérieur, puis réessayez.") };
  if (gps === 'error') return { text: t('La localisation a rencontré une erreur. Réessayez.') };
  if (!route) return null;
  if (route.kind === 'map-error') {
    return {
      text: route.reason === 'auth'
        ? t('La carte Google Maps est refusée (clé ou facturation Google Cloud). Contactez Loomodex.')
        : t('Impossible de charger la carte. Vérifiez votre connexion Internet.'),
    };
  }
  if (route.kind === 'nodest') return { text: t("L'adresse de destination est introuvable sur la carte.") };
  if (route.kind === 'fallback') {
    if (route.reason === 'ZERO_RESULTS' || route.km > 300) {
      return { text: t("Aucun itinéraire routier trouvé : vous êtes trop loin de la destination ({km} km à vol d'oiseau).", { km: Math.round(route.km) }) };
    }
    if (route.reason === 'REQUEST_DENIED' || route.reason === 'OVER_QUERY_LIMIT') {
      return { text: t("Itinéraire routier indisponible (service Google Directions non activé). La distance affichée est à vol d'oiseau.") };
    }
    return { text: t("Itinéraire routier indisponible pour le moment. La distance affichée est à vol d'oiseau.") };
  }
  return null;
}

/** Problem box with "Settings" (when relevant) and "Retry". */
export function NavProblemBox({ problem, onRetry }: { problem: { text: string; settings?: boolean }; onRetry: () => void }) {
  return (
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="alert" size={16} color={LMX.rose} />
        <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink, lineHeight: 18 }}>{problem.text}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {problem.settings && (
          <Pressable onPress={() => Linking.openSettings().catch(() => {})}
            style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
            <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{t('Paramètres')}</Text>
          </Pressable>
        )}
        <Pressable onPress={onRetry}
          style={{ flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: LMX.brand }}>
          <Icon name="refresh" size={14} color="#fff" />
          <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: '#fff' }}>{t('Réessayer')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Full-screen in-app navigation: route line from the driver's live position to the store
 * (before pickup) or to the customer (live shared position, else the checkout pin, else
 * the address), with distance / ETA, turn-by-turn steps and a "recentre" button. When GPS,
 * the route or the map is unavailable, a clear message with "Retry" replaces endless loading.
 */
export function ScreenDriverNavigate() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const order: DeliveryOrder | undefined = route.params?.order;
  const target: NavTarget = route.params?.target ?? (order ? navTargetFor(order) : 'customer');

  const [mapsKey, setMapsKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [custLoc, setCustLoc] = useState<{ lat: number; lng: number } | null>(
    order && order.customer_lat != null && order.customer_lng != null ? { lat: order.customer_lat, lng: order.customer_lng } : null,
  );
  const [eta, setEta] = useState<{ duration: string; distance: string; steps?: NavStep[] } | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [mapH, setMapH] = useState(0);

  // Driver's live GPS — moves the driver pin and keeps logistics informed.
  const gps = useLivePosition({ report: true });

  const loadKey = useCallback(() => {
    setKeyLoaded(false);
    configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}).finally(() => setKeyLoaded(true));
  }, []);
  useEffect(() => { loadKey(); }, [loadKey]);

  // Customer leg: follow the customer's live shared location (falls back to the checkout pin).
  const orderId = order?.id;
  useEffect(() => {
    if (!orderId || target !== 'customer') return;
    const load = () => ordersApi.tracking(orderId)
      .then(tr => {
        const c = (tr.customer?.lat != null && tr.customer?.lng != null) ? tr.customer
          : (tr.destination?.lat != null && tr.destination?.lng != null) ? tr.destination : null;
        if (c) setCustLoc({ lat: c.lat as number, lng: c.lng as number });
      })
      .catch(() => {});
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [orderId, target]);

  // Retry everything: GPS, the Maps key and a fresh map (new route request).
  const retry = () => {
    setEta(null); setRouteStatus(null); setShowSteps(false);
    gps.retry();
    if (!mapsKey) loadKey();
    setAttempt(a => a + 1);
  };

  if (!order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Navigation')} bell={false} />
        <View style={{ padding: 24 }}><Text style={{ color: LMX.ink50 }}>{t('Commande introuvable.')}</Text></View>
      </Screen>
    );
  }

  const pk = order.pickup;
  const storeLL = pk && pk.lat != null && pk.lng != null ? { lat: pk.lat, lng: pk.lng } : null;
  const storeName = decodeEntities(pk?.store) || t('Magasin');
  const storeAddress = [pk?.landmark, pk?.neighborhood, pk?.commune, pk?.zone_label].filter(Boolean).join(', ') || pk?.address || '';
  const custAddress = order.delivery_address || [order.landmark, order.neighborhood, order.commune].filter(Boolean).join(', ') || order.zone_label || order.city || '';

  const destination = target === 'store'
    ? (storeLL ?? { address: storeAddress, city: order.city })
    : (custLoc ?? { address: custAddress, city: order.city });
  const hasDestination = target === 'store' ? !!(storeLL || storeAddress) : !!(custLoc || custAddress);
  const title = target === 'store' ? t('Vers le magasin') : t('Vers le client');
  const destName = target === 'store' ? storeName : (order.customer_name || t('Client'));
  const destSub = target === 'store' ? storeAddress : custAddress;
  const color = target === 'store' ? PIN_COLOR.store : PIN_COLOR.customer;

  const problem = keyLoaded && !mapsKey ? { text: t('Carte indisponible pour le moment.') } : navProblem(gps.status, routeStatus);
  const steps = routeStatus?.kind === 'ok' ? (eta?.steps ?? []) : [];
  const nextStep = steps[0];
  const headline = eta
    ? `${eta.distance}${eta.duration ? ` · ${eta.duration}` : ''}`
    : gps.status === 'ok' ? t("Calcul de l'itinéraire…") : t('Localisation en cours…');
  const busy = !problem && !eta;

  return (
    <Screen scroll={false} bg={LMX.surface}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`${title} · #${order.number}`} bell={false} />
      <View style={{ flex: 1 }} onLayout={e => setMapH(Math.round(e.nativeEvent.layout.height))}>
        {!keyLoaded ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        ) : !mapsKey || !hasDestination ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
            <Icon name="map" size={28} color={LMX.ink30} />
            <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>
              {!hasDestination ? t('Aucune position disponible pour cette destination.') : t('Carte indisponible pour le moment.')}
            </Text>
          </View>
        ) : mapH > 0 && (
          <LiveMap
            key={`${target}-${attempt}`}
            mapsKey={mapsKey}
            driver={gps.pos}
            destination={destination}
            destinationLabel={destName}
            destinationColor={color}
            height={mapH}
            rounded={false}
            onEta={setEta}
            onRouteStatus={setRouteStatus}
            recenterKey={recenter}
          />
        )}

        {/* Recentre */}
        {!!mapsKey && hasDestination && (
          <Pressable onPress={() => setRecenter(n => n + 1)} accessibilityLabel={t('Recentrer')}
            style={{ position: 'absolute', right: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 40, borderRadius: 20, backgroundColor: LMX.surface, ...shadow('md') }}>
            <Icon name="location" size={16} color={LMX.brand} />
            <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{t('Recentrer')}</Text>
          </Pressable>
        )}

        {/* Next turn-by-turn instruction — tap for the full list */}
        {!!nextStep && !showSteps && (
          <Pressable onPress={() => setShowSteps(true)}
            style={{ position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: LMX.brand, ...shadow('md') }}>
            <Icon name="arrowU" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{nextStep.text}</Text>
              {!!nextStep.distance && <Text style={{ fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 2 }}>{nextStep.distance}</Text>}
            </View>
            <Icon name="list" size={18} color="#fff" />
          </Pressable>
        )}

        {showSteps && steps.length > 0 && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '70%', backgroundColor: LMX.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, ...shadow('md') }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
              <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{t('Itinéraire étape par étape')}</Text>
              <Pressable onPress={() => setShowSteps(false)} hitSlop={8} accessibilityLabel={t('Fermer')}><Icon name="close" size={18} color={LMX.ink70} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              {steps.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: i < steps.length - 1 ? 1 : 0, borderBottomColor: LMX.hairline }}>
                  <Text style={{ width: 22, fontSize: 12, fontFamily: sans(700), color: LMX.brand }}>{i + 1}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: LMX.ink, lineHeight: 18 }}>{s.text}</Text>
                  {!!s.distance && <Text style={{ fontSize: 12, color: LMX.ink50 }}>{s.distance}</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Distance / ETA + destination */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 14, gap: 10, backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={target === 'store' ? 'storefront' : 'pin'} size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {busy && <ActivityIndicator size="small" color={LMX.brand} />}
              <Text style={{ flex: 1, fontSize: 18, fontFamily: sans(800), color: LMX.ink }}>{headline}</Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink, marginTop: 2 }}>{destName}</Text>
            {!!destSub && <Text numberOfLines={2} style={{ fontSize: 12, color: LMX.ink70, marginTop: 1 }}>{destSub}</Text>}
          </View>
        </View>
        {!!order.landmark && target === 'customer' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={13} color={LMX.accent} />
            <Text style={{ flex: 1, fontSize: 12, color: LMX.ink70 }}>{order.landmark}</Text>
          </View>
        )}
        {!!problem && <NavProblemBox problem={problem} onRetry={retry} />}
      </View>
    </Screen>
  );
}
