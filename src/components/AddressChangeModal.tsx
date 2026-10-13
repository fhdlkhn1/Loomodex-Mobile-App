import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LMX, sans, mono, fr } from '../theme';
import { Icon } from '../Icon';
import { Button, Field } from '../components';
import { Picker } from './Picker';
import { LocationPicker, LatLng } from './LocationPicker';
import { PhoneInput } from './PhoneInput';
import { FeeBreakdown } from './FeeBreakdown';
import { checkoutApi, DeliveryZone, DeliveryQuote } from '../api/checkout';
import { configApi } from '../api/config';
import { ordersApi, Order, AddressChange } from '../api/orders';
import { friendlyError } from '../api/client';
import { t } from '../i18n';

/** Customer changes the delivery address of an order (before pickup): new quote first, then apply. */
export function AddressChangeModal({
  visible, order, onClose, onApplied,
}: {
  visible: boolean;
  order: Order;
  onClose: () => void;
  onApplied: (order: Order) => void;
}) {
  const insets = useSafeAreaInsets();
  const [zones, setZones]           = useState<DeliveryZone[]>([]);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [mapsKey, setMapsKey]       = useState('');
  const [zoneKey, setZoneKey]         = useState('');
  const [communeKey, setCommuneKey]   = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [subsector, setSubsector]     = useState('');
  const [landmark, setLandmark]       = useState('');
  const [pin, setPin]                 = useState<LatLng | null>(null);
  const [phone, setPhone]             = useState('');
  const [quote, setQuote]     = useState<DeliveryQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadZones = () => {
    setZonesError(null);
    checkoutApi.zones()
      .then(d => setZones(d.zones ?? []))
      .catch(e => setZonesError(friendlyError(e)));
  };

  useEffect(() => {
    if (!visible) return;
    loadZones();
    configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {});
    setQuote(null);
  }, [visible]);

  const zone     = zones.find(z => z.key === zoneKey);
  const communes = zone?.communes ?? [];
  const commune  = communes.find(c => c.key === communeKey);
  const hoods    = commune?.neighborhoods ?? [];
  const subsectors = commune?.areas?.find(a => a.name === neighborhood)?.subsectors ?? [];
  const currentFee = order.delivery_quote?.total ?? order.shipping_total;

  // Any edit invalidates the quote shown
  const edit = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setQuote(null); };
  const onZone = (key: string) => {
    const z = zones.find(zz => zz.key === key);
    setZoneKey(key);
    setCommuneKey(z && z.communes.length === 1 ? z.communes[0].key : '');
    setNeighborhood(''); setSubsector(''); setQuote(null);
  };
  const onCommune = (key: string) => { setCommuneKey(key); setNeighborhood(''); setSubsector(''); setQuote(null); };
  const onHood = (name: string) => { setNeighborhood(name); setSubsector(''); setQuote(null); };

  const payload = (): AddressChange => ({
    zone: zoneKey, commune: communeKey, commune_name: commune?.label ?? '',
    neighborhood, landmark: landmark.trim(),
    ...(subsector ? { subsector } : {}),
    ...(pin ? { dest_lat: pin.lat, dest_lng: pin.lng } : {}),
    ...(phone ? { recipient_phone: phone } : {}),
  });

  const missing =
    !zoneKey ? t('la zone de livraison') :
    !communeKey ? t('la commune') :
    !neighborhood ? t('le quartier') :
    !landmark.trim() ? t('le point de repère') : '';

  const getQuote = async () => {
    if (missing) { Alert.alert(t('Champ requis'), t('Veuillez renseigner {field}.', { field: missing })); return; }
    setQuoting(true);
    try {
      setQuote(await ordersApi.quoteAddress(order.id, payload()));
    } catch (e) {
      Alert.alert(t('Erreur'), friendlyError(e, t('Impossible de calculer les nouveaux frais.')));
    } finally { setQuoting(false); }
  };

  const apply = async () => {
    setApplying(true);
    try {
      const res = await ordersApi.applyAddress(order.id, payload());
      onApplied(res.order);
      Alert.alert(t('Adresse modifiée'), t('La nouvelle adresse de livraison a été enregistrée.'));
    } catch (e) {
      Alert.alert(t('Erreur'), friendlyError(e, t("Impossible de modifier l'adresse.")));
    } finally { setApplying(false); }
  };

  const diff = quote ? quote.total - currentFee : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(11,31,58,0.38)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, minHeight: 40 }} onPress={onClose} />
        <View style={{ maxHeight: '92%', backgroundColor: LMX.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{t("Modifier l'adresse de livraison")}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Icon name="close" size={20} color={LMX.ink70} /></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 18, gap: 12 }}>
            <Text style={{ fontSize: 12, color: LMX.ink50, lineHeight: 17 }}>
              {t('Les frais de livraison seront recalculés pour la nouvelle adresse. Rien ne change tant que vous n’avez pas accepté.')}
            </Text>
            {zonesError ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12.5, color: LMX.rose }}>{zonesError}</Text>
                <Button size="sm" variant="soft" icon="refresh" onPress={loadZones}>{t('Réessayer')}</Button>
              </View>
            ) : null}
            <Picker
              label={t('Zone de livraison')} required value={zoneKey} onChange={onZone}
              placeholder={t('Sélectionner une zone')}
              options={zones.map(z => ({ value: z.key, label: z.label }))}
            />
            <Picker
              label={t('Commune')} required value={communeKey} onChange={onCommune}
              placeholder={zoneKey ? t('Sélectionner une commune') : t('Choisissez d’abord une zone')}
              disabled={!zoneKey}
              options={communes.map(c => ({ value: c.key, label: c.label }))}
            />
            <Picker
              label={t('Quartier')} required value={neighborhood} onChange={onHood}
              placeholder={communeKey ? t('Sélectionner un quartier') : t('Choisissez d’abord une commune')}
              disabled={!communeKey}
              options={hoods.map(h => ({ value: h, label: h }))}
            />
            {subsectors.length > 0 && (
              <Picker
                label={t('Sous-secteur (optionnel)')} value={subsector} onChange={edit(setSubsector)}
                placeholder={t('Sélectionner un sous-secteur')}
                options={[{ value: '', label: t('Aucun / je ne sais pas') }, ...subsectors.map(ss => ({ value: ss.key, label: ss.name }))]}
              />
            )}
            <Field label={t('Point de repère *')} value={landmark} onChangeText={edit(setLandmark)} placeholder={t('Près de la mosquée, portail bleu…')} />
            {mapsKey ? (
              <View>
                <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>
                  {t('Position exacte')} <Text style={{ color: LMX.ink50 }}>{t('(optionnel)')}</Text>
                </Text>
                <LocationPicker mapsKey={mapsKey} value={pin} onChange={edit(setPin)} height={200} />
              </View>
            ) : null}
            <PhoneInput label={t('Nouveau téléphone du destinataire (optionnel)')} value={phone} onChange={edit(setPhone)} />

            {quote ? (
              <View style={{ gap: 10 }}>
                <FeeBreakdown quote={quote} title={t('Nouveaux frais de livraison')} />
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Frais actuels : {amount} GNF', { amount: fr(currentFee) })}</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: mono(700), color: diff > 0 ? LMX.rose : diff < 0 ? LMX.emerald : LMX.ink70 }}>
                    {diff === 0 ? t('Sans changement') : `${diff > 0 ? '+' : '−'}${fr(Math.abs(diff))} GNF`}
                  </Text>
                </View>
                <Button full variant="accent" size="lg" onPress={apply} disabled={applying}>
                  {applying ? <ActivityIndicator color="#fff" /> : t('Accepter et modifier')}
                </Button>
              </View>
            ) : (
              <Button full variant="primary" size="lg" icon="arrowR" onPress={getQuote} disabled={quoting}>
                {quoting ? <ActivityIndicator color="#fff" /> : t('Calculer les nouveaux frais')}
              </Button>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
