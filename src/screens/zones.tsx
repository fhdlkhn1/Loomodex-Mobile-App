import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { LMX, sans } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button } from '../components';
import { Sheet } from '../components/StaffKit';
import { LocationPicker, LatLng } from '../components/LocationPicker';
import { get, post, friendlyError, isApiError } from '../api/client';
import { configApi } from '../api/config';
import { ensureLocationPermission } from '../hooks/useLivePosition';
import { t } from '../i18n';

/**
 * Zones et quartiers — for Logistics Managers the administrator enabled one by one.
 * Add only: a zone, a commune, a neighbourhood, or the GPS point of a neighbourhood that has none.
 * No editing, deleting or price change (administrator only). A new zone waits for its price.
 */

interface Hood { name: string; active: boolean; has_gps: boolean }
interface Commune { key: string; label: string; active: boolean; neighborhoods: Hood[] }
interface Zone { key: string; label: string; active: boolean; communes: Commune[] }

type AddTarget =
  | { type: 'zone' }
  | { type: 'commune'; zone: Zone }
  | { type: 'neighborhood'; zone: Zone; commune: Commune }
  | { type: 'gps'; zone: Zone; commune: Commune; hood: Hood };

export function ScreenZonesModule() {
  const nav = useNavigation<any>();
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [target, setTarget] = useState<AddTarget | null>(null);
  const [name, setName] = useState('');
  const [point, setPoint] = useState<LatLng | null>(null);
  const [mapsKey, setMapsKey] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setZones((await get<{ zones: Zone[] }>('/logistics/zones-module', true)).zones); setDenied(null); }
    catch (e) { if (isApiError(e) && e.status === 403) setDenied(friendlyError(e)); else Alert.alert(t('Erreur'), friendlyError(e)); }
  };
  useEffect(() => { load(); configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}); }, []);

  const useMyLocation = async () => {
    if (!(await ensureLocationPermission(true))) { Alert.alert(t('Localisation'), t('Autorisez la localisation pour utiliser votre position.')); return; }
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPoint({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch { Alert.alert(t('Localisation'), t('Position introuvable. Réessayez à l\'extérieur.')); }
  };

  const submit = async () => {
    if (!target) return;
    const body: Record<string, any> = { type: target.type };
    if (target.type !== 'zone') body.zone = target.zone.key;
    if (target.type === 'neighborhood' || target.type === 'gps') body.commune = target.commune.key;
    body.name = target.type === 'gps' ? target.hood.name : name.trim();
    if (target.type !== 'gps' && !body.name) { Alert.alert(t('Nom requis'), t('Indiquez le nom.')); return; }
    if (target.type === 'gps' && !point) { Alert.alert(t('Point GPS'), t('Utilisez votre position ou choisissez un point sur la carte.')); return; }
    if (point && (target.type === 'gps' || target.type === 'neighborhood')) { body.lat = point.lat; body.lng = point.lng; }
    setBusy(true);
    try {
      const r = await post<{ zones: Zone[] }>('/logistics/zones-module', body, true);
      setZones(r.zones); setTarget(null); setName(''); setPoint(null);
      if (target.type === 'zone') Alert.alert(t('Zone ajoutée'), t("La nouvelle zone sera disponible après que l'administrateur aura fixé son prix."));
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setBusy(false); }
  };

  const title = !target ? '' : target.type === 'zone' ? t('Nouvelle zone') : target.type === 'commune' ? t('Nouvelle commune · {z}', { z: target.zone.label })
    : target.type === 'neighborhood' ? t('Nouveau quartier · {c}', { c: target.commune.label }) : t('Point GPS · {h}', { h: target.hood.name });

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Zones et quartiers')} right={!denied ? <IconBtn icon="plus" onPress={() => setTarget({ type: 'zone' })} /> : undefined} />
      {denied ? <Text style={{ padding: 24, textAlign: 'center', color: LMX.ink50 }}>{denied}</Text>
      : !zones ? <View style={{ paddingVertical: 48 }}><ActivityIndicator color={LMX.brand} /></View>
      : (
        <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 30 }}>
          <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t("Ajout uniquement. Les modifications, suppressions et prix restent réservés à l'administrateur.")}</Text>
          {zones.map(z => (
            <View key={z.key} style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border }}>
              <Pressable onPress={() => setOpen(o => ({ ...o, [z.key]: !o[z.key] }))} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
                <Icon name={open[z.key] ? 'chevD' : 'chevR'} size={14} color={LMX.ink50} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: sans(700) }}>{z.label}</Text>
                {!z.active && <Text style={{ fontSize: 10.5, color: LMX.accent, fontFamily: sans(700) }}>{t('En attente du prix')}</Text>}
              </Pressable>
              {open[z.key] && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
                  {z.communes.map(c => (
                    <View key={c.key} style={{ borderTopWidth: 1, borderTopColor: LMX.hairline, paddingTop: 8, gap: 4 }}>
                      <Pressable onPress={() => setOpen(o => ({ ...o, [z.key + '/' + c.key]: !o[z.key + '/' + c.key] }))} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Icon name={open[z.key + '/' + c.key] ? 'chevD' : 'chevR'} size={12} color={LMX.ink50} />
                        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{c.label}</Text>
                        <Text style={{ fontSize: 11, color: LMX.ink50 }}>({c.neighborhoods.length})</Text>
                      </Pressable>
                      {open[z.key + '/' + c.key] && (
                        <View style={{ paddingLeft: 18, gap: 4 }}>
                          {c.neighborhoods.map(h => (
                            <View key={h.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Icon name="pin" size={12} color={h.has_gps ? LMX.emerald : LMX.ink30} />
                              <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>{h.name}</Text>
                              {!h.has_gps && (
                                <Pressable onPress={() => { setPoint(null); setTarget({ type: 'gps', zone: z, commune: c, hood: h }); }}>
                                  <Text style={{ fontSize: 11.5, color: LMX.brand, fontFamily: sans(600) }}>{t('Ajouter le point GPS')}</Text>
                                </Pressable>
                              )}
                            </View>
                          ))}
                          <Pressable onPress={() => { setName(''); setPoint(null); setTarget({ type: 'neighborhood', zone: z, commune: c }); }}>
                            <Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>+ {t('Quartier')}</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                  <Pressable onPress={() => { setName(''); setTarget({ type: 'commune', zone: z }); }}>
                    <Text style={{ fontSize: 12.5, color: LMX.brand, fontFamily: sans(600) }}>+ {t('Commune')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Sheet visible={!!target} title={title} onClose={() => setTarget(null)}
        footer={<Button variant="accent" full disabled={busy} onPress={submit}>{busy ? t('Envoi…') : t('Ajouter')}</Button>}>
        <View style={{ gap: 12 }}>
          {target && target.type !== 'gps' && (
            <TextInput value={name} onChangeText={setName} placeholder={t('Nom')} placeholderTextColor={LMX.ink30}
              style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 12, height: 44, color: LMX.ink }} />
          )}
          {target && (target.type === 'gps' || target.type === 'neighborhood') && (
            <>
              <Text style={{ fontSize: 12, color: LMX.ink70 }}>{target.type === 'gps' ? t('Point GPS du quartier') : t('Point GPS (facultatif)')}</Text>
              <Button size="sm" variant="ghost" icon="location" onPress={useMyLocation}>{t('Utiliser ma position actuelle')}</Button>
              {!!mapsKey && <LocationPicker mapsKey={mapsKey} value={point} onChange={setPoint} height={220} />}
              {point && <Text style={{ fontSize: 11.5, color: LMX.emerald }}>{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</Text>}
            </>
          )}
        </View>
      </Sheet>
    </Screen>
  );
}
