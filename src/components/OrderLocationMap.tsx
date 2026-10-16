import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { LMX, sans, decodeEntities } from '../theme';
import { Icon } from '../Icon';
import { LiveMap, MapLegend, MapPin, PIN_COLOR } from './LiveMap';
import { Sheet, agoFr } from './StaffKit';
import { ordersApi, OrderTracking } from '../api/orders';
import { configApi } from '../api/config';
import type { DeliveryOrder } from '../api/delivery';
import { t } from '../i18n';

/** Statuses where the parcel has left the store (route goes to the customer). */
const PICKED_UP = ['out-delivery', 'driver-arrived', 'otp-pending', 'otp-verified', 'completed'];
const FINISHED = ['otp-verified', 'completed', 'cancelled', 'refunded', 'delivery-failed'];

const ok = <T extends { lat?: number | null; lng?: number | null }>(p?: T | null): p is T & { lat: number; lng: number } =>
  !!p && typeof p.lat === 'number' && typeof p.lng === 'number';

export interface OrderMapFallback {
  store?: MapPin | null;
  customer?: MapPin | null;
  /** Text address geocoded when the customer has no GPS pin. */
  customerAddress?: string;
  city?: string;
}

interface Props {
  orderId: number;
  /**
   * 'store'  → the vendor: own store pin + the assigned driver coming for pickup (no customer).
   * 'staff'  → partner manager / logistics / CS / admin: store + customer + driver.
   */
  viewer: 'store' | 'staff';
  /** Pins already known from the order list, shown until (or when) tracking has nothing better. */
  fallback?: OrderMapFallback;
  /** Order status from the list (tracking's own status wins once loaded). */
  status?: string;
  height?: number;
  /** Refresh interval for the driver's live position. */
  pollMs?: number;
  /** Receives every tracking payload (e.g. to show the driver card next to the map). */
  onTrack?: (t: OrderTracking) => void;
}

/** Pins + phase for one order, from the tracking payload (preferred) and the list data. */
function computePins(viewer: Props['viewer'], tr: OrderTracking | null, fb: OrderMapFallback | undefined, statusIn?: string) {
  const status = tr?.status || statusIn || '';
  const s = tr?.store;
  const store: MapPin | null = ok(s) ? { lat: s.lat, lng: s.lng, label: decodeEntities(s.name) || t('Magasin') }
    : ok(fb?.store) ? { ...fb!.store, label: fb!.store!.label || t('Magasin') } : null;
  let customer: MapPin | null = null;
  if (viewer === 'staff') {
    const label = fb?.customer?.label || t('Client');
    customer = ok(tr?.customer) ? { lat: tr!.customer!.lat, lng: tr!.customer!.lng, label }
      : ok(tr?.destination) ? { lat: tr!.destination.lat, lng: tr!.destination.lng, label }
      : ok(fb?.customer) ? { ...fb!.customer, label } : null;
  }
  const d = tr?.driver;
  const driver = d && d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null;
  const pickedUp = PICKED_UP.includes(status);
  const custAddress = viewer === 'staff' ? (tr?.destination?.address || fb?.customerAddress || '') : '';
  const custCity = tr?.destination?.city || fb?.city;
  return { status, store, customer, driver, pickedUp, custAddress, custCity };
}

/**
 * In-app order map (no external Google Maps): store pin (orange), customer pin (green)
 * and the assigned driver's live position (blue), refreshed from /orders/{id}/tracking.
 * Before pickup the route goes driver → store; after pickup driver → customer.
 */
export function OrderLocationMap({ orderId, viewer, fallback, status, height = 280, pollMs = 20000, onTrack }: Props) {
  const [track, setTrack] = useState<OrderTracking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mapsKey, setMapsKey] = useState('');
  const [eta, setEta] = useState<{ duration: string; distance: string } | null>(null);

  useEffect(() => { configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}); }, []);

  const load = useCallback(() => {
    ordersApi.tracking(orderId).then(tr => { setTrack(tr); onTrack?.(tr); }).catch(() => {}).finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const p = computePins(viewer, track, fallback, status);
  const finished = FINISHED.includes(p.status);

  useEffect(() => {
    load();
    if (finished) return;
    const i = setInterval(load, pollMs);
    return () => clearInterval(i);
  }, [load, pollMs, finished]);

  const key = mapsKey || track?.maps_key || '';

  // Route target: the store until pickup (or always for the store itself), then the customer.
  const toCustomer = viewer === 'staff' && (p.pickedUp || !p.store);
  const dest = toCustomer
    ? (p.customer ?? (p.custAddress ? { address: p.custAddress, city: p.custCity } : {}))
    : (p.store ?? {});
  const destLabel = toCustomer ? (p.customer?.label || t('Client')) : (p.store?.label || t('Magasin'));
  const extra = viewer === 'staff' ? (toCustomer ? (p.store ? { ...p.store, color: PIN_COLOR.store } : null) : (p.customer ? { ...p.customer, color: PIN_COLOR.customer } : null)) : null;
  const driverName = track?.driver?.name || '';

  const legend = [
    ...(p.store ? [{ color: PIN_COLOR.store, label: t('Magasin') }] : []),
    ...(viewer === 'staff' && (p.customer || p.custAddress) ? [{ color: PIN_COLOR.customer, label: t('Client') }] : []),
    ...(p.driver ? [{ color: PIN_COLOR.driver, label: driverName || t('Livreur') }] : []),
  ];
  const nothing = !p.store && !p.customer && !p.driver && !p.custAddress;

  if (!loaded && !fallback) {
    return <View style={{ height, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} /></View>;
  }

  return (
    <View style={{ gap: 10 }}>
      {!key || nothing ? (
        <View style={{ height: Math.min(height, 160), borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 }}>
          <Icon name="pin" size={22} color={LMX.brand} />
          <Text style={{ fontSize: 12, color: LMX.ink70, textAlign: 'center', lineHeight: 17 }}>
            {!key ? t('Carte indisponible pour le moment.') : t('Aucune position disponible pour cette commande.')}
          </Text>
        </View>
      ) : (
        <LiveMap
          key={`${toCustomer ? 'c' : 's'}-${loaded ? 1 : 0}`}
          mapsKey={key}
          driver={p.driver}
          destination={dest}
          destinationLabel={destLabel}
          destinationColor={toCustomer ? PIN_COLOR.customer : PIN_COLOR.store}
          extra={extra}
          driverLabel={driverName || t('Livreur')}
          height={height}
          onEta={setEta}
        />
      )}
      <MapLegend items={legend} />
      {!!track?.driver && !finished && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.brandSoft, borderRadius: 12, padding: 12 }}>
          <Icon name="bike" size={16} color={LMX.brand} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>
              {viewer === 'store' ? t('{name} arrive pour récupérer la commande', { name: driverName || t('Le livreur') }) : (driverName || t('Livreur'))}
            </Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>
              {p.driver
                ? [eta ? (eta.duration ? `~${eta.duration} · ${eta.distance}` : eta.distance) : '', t('position {ago}', { ago: agoFr(track.driver.updated) })].filter(Boolean).join(' · ')
                : t('En attente de la position du livreur en direct…')}
            </Text>
          </View>
        </View>
      )}
      {viewer === 'staff' && !p.customer && !!p.custAddress && (
        <Text style={{ fontSize: 11, color: LMX.ink50, textAlign: 'center' }}>{t("Le client n'a pas partagé de position GPS — pin placé d'après l'adresse.")}</Text>
      )}
    </View>
  );
}

/** Fallback pins for a delivery order (partner / logistics lists). */
export function orderMapFallback(o: DeliveryOrder): OrderMapFallback {
  const cust = ok({ lat: o.customer_lat, lng: o.customer_lng }) ? { lat: o.customer_lat, lng: o.customer_lng }
    : ok({ lat: o.dest_lat, lng: o.dest_lng }) ? { lat: o.dest_lat, lng: o.dest_lng } : null;
  return {
    store: o.pickup && ok(o.pickup) ? { lat: o.pickup.lat, lng: o.pickup.lng, label: decodeEntities(o.pickup.store) } : null,
    customer: cust ? { ...cust, label: o.customer_name } : null,
    customerAddress: o.delivery_address || [o.address, o.neighborhood, o.commune].filter(Boolean).join(', '),
    city: o.city || 'Conakry',
  };
}

/** Bottom sheet with the in-app map of one delivery order ("Voir sur la carte"). */
export function OrderMapSheet({ order, onClose }: { order: DeliveryOrder | null; onClose: () => void }) {
  return (
    <Sheet visible={!!order} title={t('Carte de la commande')} subtitle={order ? t('Commande {n}', { n: order.number }) : undefined} onClose={onClose}>
      {!!order && <OrderLocationMap orderId={order.id} viewer="staff" status={order.status} fallback={orderMapFallback(order)} height={320} />}
    </Sheet>
  );
}

/** Small "Voir sur la carte" button used on order cards. */
export function MapButton({ onPress, label }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, borderWidth: 1, borderColor: LMX.brand + '55', backgroundColor: LMX.brandSoft }}>
      <Icon name="pin" size={14} color={LMX.brand} />
      <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.brand }}>{label ?? t('Voir sur la carte')}</Text>
    </Pressable>
  );
}
