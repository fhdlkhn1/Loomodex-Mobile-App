import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { LMX, sans, mono } from '../theme';
import { Icon } from '../Icon';
import { Field } from '../components';
import { Picker } from './Picker';
import { LocationPicker, LatLng } from './LocationPicker';
import { checkoutApi, DeliveryZone } from '../api/checkout';
import { friendlyError } from '../api/client';
import { t } from '../i18n';

export interface StoreAddressValue {
  zone: string;
  commune: string;
  commune_name: string;
  neighborhood: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
}

export const EMPTY_STORE_ADDRESS: StoreAddressValue = {
  zone: '', commune: '', commune_name: '', neighborhood: '', landmark: '', lat: null, lng: null,
};

interface Props {
  value: StoreAddressValue;
  onChange: (v: StoreAddressValue) => void;
  /** Whether the current pin has been confirmed with "Valider ma position". */
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  mapsKey: string;
}

/**
 * Store address with the same structure as checkout — Zone → Commune → Quartier →
 * Point de repère — plus a draggable GPS pin the driver navigates to.
 */
export function StoreAddressForm({ value, onChange, confirmed, onConfirmedChange, mapsKey }: Props) {
  const [zones, setZones]       = useState<DeliveryZone[]>([]);
  const [zonesErr, setZonesErr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const loadZones = () => {
    setZonesErr(null);
    checkoutApi.zones().then(d => setZones(d.zones ?? [])).catch(e => setZonesErr(friendlyError(e)));
  };
  useEffect(loadZones, []);

  const zone     = zones.find(z => z.key === value.zone);
  const communes = zone?.communes ?? [];
  const hoods    = communes.find(c => c.key === value.commune)?.neighborhoods ?? [];
  const pin: LatLng | null = value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null;

  const set = (patch: Partial<StoreAddressValue>) => onChange({ ...value, ...patch });

  const onZone = (key: string) => {
    const z = zones.find(zz => zz.key === key);
    const only = z && z.communes.length === 1 ? z.communes[0] : null;
    set({ zone: key, commune: only?.key ?? '', commune_name: only?.label ?? '', neighborhood: '' });
  };
  const onCommune = (key: string) => {
    set({ commune: key, commune_name: communes.find(c => c.key === key)?.label ?? '', neighborhood: '' });
  };

  const movePin = (ll: LatLng) => { set({ lat: ll.lat, lng: ll.lng }); onConfirmedChange(false); };

  const useCurrentPosition = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission requise'), t("Autorisez l'accès à la localisation pour placer le magasin sur la carte."));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      movePin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      Alert.alert(t('Position introuvable'), t("Impossible d'obtenir votre position. Activez le GPS et réessayez."));
    } finally { setLocating(false); }
  };

  const confirmPin = () => {
    if (!pin) { Alert.alert(t('Aucune position'), t('Activez votre position actuelle ou touchez la carte pour placer le magasin.')); return; }
    onConfirmedChange(true);
  };

  return (
    <View style={{ gap: 14 }}>
      {!!zonesErr && (
        <View style={{ backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: LMX.rose + '33' }}>
          <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{t('Zones indisponibles : {err}', { err: zonesErr })}</Text>
          <Pressable onPress={loadZones}><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Réessayer')}</Text></Pressable>
        </View>
      )}
      <Picker
        label={t('Zone')} required value={value.zone} onChange={onZone}
        placeholder={t('Sélectionner une zone')}
        options={zones.map(z => ({ value: z.key, label: z.label }))}
      />
      <Picker
        label={t('Commune')} required value={value.commune} onChange={onCommune}
        placeholder={value.zone ? t('Sélectionner une commune') : t('Choisissez d’abord une zone')}
        disabled={!value.zone}
        options={communes.map(c => ({ value: c.key, label: c.label }))}
      />
      <Picker
        label={t('Quartier')} required value={value.neighborhood} onChange={v => set({ neighborhood: v })}
        placeholder={value.commune ? t('Sélectionner un quartier') : t('Choisissez d’abord une commune')}
        disabled={!value.commune}
        options={hoods.map(h => ({ value: h, label: h }))}
      />
      <Field label={t('Point de repère') + ' *'} value={value.landmark} onChangeText={v => set({ landmark: v })} placeholder={t('Près de la mosquée, portail bleu…')} />

      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>{t('Position GPS du magasin')}</Text>
        {mapsKey ? (
          <LocationPicker
            mapsKey={mapsKey} value={pin} onChange={movePin} height={240} pinColor="#FF7A00"
            hint={pin ? t('Faites glisser le pin ou touchez la carte pour ajuster') : t('Activez votre position ou touchez la carte pour placer le magasin')}
          />
        ) : (
          <View style={{ height: 90, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 12, color: LMX.ink50, textAlign: 'center' }}>
              {pin ? t('Position : {lat}, {lng}', { lat: pin.lat.toFixed(5), lng: pin.lng.toFixed(5) }) : t('Carte indisponible — utilisez « Activer ma position actuelle ».')}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={useCurrentPosition} disabled={locating} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, opacity: locating ? 0.6 : 1 }}>
            {locating ? <ActivityIndicator size="small" color={LMX.brand} /> : <Icon name="location" size={15} color={LMX.brand} />}
            <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.ink }}>{t('Activer ma position actuelle')}</Text>
          </Pressable>
          <Pressable onPress={confirmPin} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, backgroundColor: confirmed && pin ? LMX.emerald : LMX.ink }}>
            <Icon name="check" size={15} color="#fff" />
            <Text style={{ fontSize: 12, fontFamily: sans(600), color: '#fff' }}>{confirmed && pin ? t('Position validée') : t('Valider ma position')}</Text>
          </Pressable>
        </View>
        {!!pin && (
          <Text style={{ fontSize: 10.5, color: confirmed ? LMX.emerald : LMX.accent, fontFamily: mono(500), textAlign: 'center' }}>
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)} · {confirmed ? t('validée') : t('à valider')}
          </Text>
        )}
      </View>
    </View>
  );
}
