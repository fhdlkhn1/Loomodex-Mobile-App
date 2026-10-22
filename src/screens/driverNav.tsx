import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LMX, sans, decodeEntities, shadow } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn } from '../components';
import { LiveMap, PIN_COLOR } from '../components/LiveMap';
import { configApi } from '../api/config';
import { ordersApi } from '../api/orders';
import { driverApi, DeliveryOrder } from '../api/delivery';
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

/**
 * Full-screen in-app navigation: route line from the driver's live position to the store
 * (before pickup) or to the customer (live shared position, else the checkout pin, else
 * the address), with distance / ETA and a "recentre" button.
 */
export function ScreenDriverNavigate() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const order: DeliveryOrder | undefined = route.params?.order;
  const target: NavTarget = route.params?.target ?? (order ? navTargetFor(order) : 'customer');

  const [mapsKey, setMapsKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [custLoc, setCustLoc] = useState<{ lat: number; lng: number } | null>(
    order && order.customer_lat != null && order.customer_lng != null ? { lat: order.customer_lat, lng: order.customer_lng } : null,
  );
  const [eta, setEta] = useState<{ duration: string; distance: string } | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [mapH, setMapH] = useState(0);
  const [gpsDenied, setGpsDenied] = useState(false);

  useEffect(() => {
    configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}).finally(() => setKeyLoaded(true));
  }, []);

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

  // Driver's live GPS — moves the driver pin and keeps logistics informed.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') { setGpsDenied(true); return; }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        pos => {
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? 0).catch(() => {});
        },
      );
      if (cancelled) sub.remove();
    })();
    return () => { cancelled = true; if (sub) sub.remove(); };
  }, []);

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
            key={target}
            mapsKey={mapsKey}
            driver={myPos}
            destination={destination}
            destinationLabel={destName}
            destinationColor={color}
            height={mapH}
            rounded={false}
            onEta={setEta}
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
      </View>

      {/* Distance / ETA + destination */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 14, gap: 10, backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={target === 'store' ? 'storefront' : 'pin'} size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: sans(800), color: LMX.ink }}>
              {eta ? `${eta.distance}${eta.duration ? ` · ${eta.duration}` : ''}` : (myPos ? t("Calcul de l'itinéraire…") : t('Localisation en cours…'))}
            </Text>
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
        {gpsDenied && (
          <Text style={{ fontSize: 12, color: LMX.rose }}>{t('Autorisez la localisation pour suivre votre position sur la carte.')}</Text>
        )}
      </View>
    </Screen>
  );
}
