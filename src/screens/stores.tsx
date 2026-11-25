import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LMX, FONT, sans, decodeEntities } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, ProductCard, Button } from '../components';
import { storesApi, casesApi, Product as ApiProduct, OfferStore, StoreInfo, StoreMode, StoreQuote } from '../api/products';
import { t } from '../i18n';

/**
 * "Nos offres" — configurable stores. Each store has its own catalog (its products never
 * appear in the general lists), its own search and categories, and an operating mode:
 *   A direct purchase · B quotation then online order · C quotation / appointment.
 */

export const MODE_LABEL: Record<StoreMode, string> = {
  direct:            'Achat en ligne',
  quote_order:       'Sur devis, puis commande en ligne',
  quote_appointment: 'Sur devis et rendez-vous',
};
const MODE_COLOR: Record<StoreMode, string> = { direct: LMX.emerald, quote_order: LMX.brand, quote_appointment: LMX.accent };

/** API product → card product (also carries the store's price display and name). */
export function toCardProduct(p: ApiProduct): any {
  return {
    id: String(p.id),
    name: decodeEntities(p.name),
    slug: p.slug,
    price: p.price,
    was: p.regular_price > p.price ? p.regular_price : null,
    off: p.off,
    cat: String(p.categories?.[0] ?? ''),
    seller: decodeEntities(p.seller),
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    image: p.image,
    is_usa: p.is_usa,
    delivery_estimate: p.delivery_estimate,
    store_name: p.store?.name ?? null,
    price_display: p.store?.price_display,
  };
}

/** Product page footer for a store in quotation mode: no Add to Cart / Buy Now. */
export function StoreRequestFooter({ store, productId }: { store: StoreInfo; productId: number }) {
  const nav = useNavigation<any>();
  if (store.status !== 'active') {
    return <Text style={{ textAlign: 'center', color: LMX.ink50, fontSize: 13, paddingVertical: 8 }}>{t("Cette boutique n'est pas disponible pour le moment.")}</Text>;
  }
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11.5, color: LMX.ink70, textAlign: 'center' }}>
        {store.mode === 'quote_order'
          ? t('Produit vendu sur devis. Après confirmation du devis par le service client, un bouton « Commander » vous permet de le commander en ligne.')
          : t('Produit vendu sur devis ou sur rendez-vous. Le service client vous contactera.')}
      </Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, textAlign: 'center' }}>{t("Aucun paiement en ligne n'est requis à cette étape.")}</Text>
      <Button full variant="accent" size="lg" icon="msg" onPress={() => nav.navigate('StoreRequest', { type: 'price_request', productId, storeName: store.name })}>{t('Demander mon prix total')}</Button>
      {store.mode === 'quote_appointment' && (
        <Button full variant="ghost" icon="pin" onPress={() => nav.navigate('StoreRequest', { type: 'appointment', productId, storeId: store.id, storeName: store.name })}>{t('Demander un rendez-vous')}</Button>
      )}
    </View>
  );
}

function StoreLogo({ uri, size = 52 }: { uri: string | null; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} /> : <Icon name="storefront" size={size * 0.45} color={LMX.brand} />}
    </View>
  );
}

function ModePill({ mode }: { mode: StoreMode }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: MODE_COLOR[mode] + '1A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6 }}>
      <Text style={{ fontSize: 10.5, fontFamily: sans(700), color: MODE_COLOR[mode] }}>{t(MODE_LABEL[mode])}</Text>
    </View>
  );
}

const place = (s: { city: string; country: string }) => [s.city, s.country].filter(Boolean).join(', ');

export function ScreenOfferStores() {
  const nav = useNavigation<any>();
  const { data, isLoading } = useQuery({ queryKey: ['offer-stores'], queryFn: () => storesApi.list() });
  const stores = data?.stores ?? [];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Main'))} />} title={t('Nos offres')} />
      <Text style={{ fontSize: 12.5, color: LMX.ink50, paddingHorizontal: 16, marginBottom: 12 }}>{t('Nos boutiques partenaires, chacune avec son catalogue et ses conditions.')}</Text>
      {isLoading ? (
        <View style={{ paddingVertical: 48 }}><ActivityIndicator color={LMX.brand} /></View>
      ) : stores.length === 0 ? (
        <Text style={{ textAlign: 'center', color: LMX.ink50, padding: 40 }}>{t('Aucune offre disponible pour le moment.')}</Text>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
          {stores.map(s => (
            <Pressable key={s.id} onPress={() => nav.navigate('OfferStore', { storeId: s.id, name: s.name })}
              style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
              {s.banner ? <Image source={{ uri: s.banner }} style={{ width: '100%', height: 96 }} /> : <View style={{ height: 56, backgroundColor: LMX.navy }} />}
              <View style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'flex-start' }}>
                <StoreLogo uri={s.logo} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(s.name)}</Text>
                  {!!place(s) && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{place(s)}</Text>}
                  {!!s.excerpt && <Text numberOfLines={2} style={{ fontSize: 12, color: LMX.ink70, marginTop: 4 }}>{s.excerpt}</Text>}
                  <ModePill mode={s.mode} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

export function ScreenOfferStore() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const storeId: number = route.params?.storeId;
  const [search, setSearch] = useState('');
  const [query, setQuery]   = useState('');
  const [cat, setCat]       = useState<number | undefined>(undefined);

  const { data: store } = useQuery({ queryKey: ['offer-store', storeId], queryFn: () => storesApi.get(storeId), enabled: !!storeId });
  const { data, isLoading } = useQuery({
    queryKey: ['offer-store-products', storeId, query, cat],
    queryFn: () => storesApi.products(storeId, { search: query || undefined, category: cat, page: 1 }),
    enabled: !!storeId,
  });
  const products = data?.products ?? [];
  const title = store?.name ? decodeEntities(store.name) : (route.params?.name || t('Boutique'));

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('OfferStores'))} />} title={title} />
      {store && (
        <View style={{ marginHorizontal: 16, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          {store.banner ? <Image source={{ uri: store.banner }} style={{ width: '100%', height: 110 }} /> : null}
          <View style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
            <StoreLogo uri={store.logo} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 19, color: LMX.ink }}>{decodeEntities(store.name)}</Text>
              {!!place(store) && <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{place(store)}</Text>}
              <ModePill mode={store.mode} />
            </View>
          </View>
          {!!store.description && <Text style={{ fontSize: 12.5, color: LMX.ink70, paddingHorizontal: 12, paddingBottom: 12, lineHeight: 18 }}>{store.description}</Text>}
        </View>
      )}

      {store && (
        <Pressable onPress={() => nav.navigate('StoreRequest', { type: 'find_product', storeId: store.id, storeName: store.name })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: LMX.brandSoft, borderRadius: 12, padding: 12 }}>
          <Icon name="search" size={16} color={LMX.brand} />
          <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink, fontFamily: sans(600) }}>{t('Vous ne trouvez pas ? Trouver un produit')}</Text>
          <Icon name="chevR" size={14} color={LMX.brand} />
        </Pressable>
      )}

      {store?.mode === 'quote_appointment' && (
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <Button full variant="ghost" icon="pin" onPress={() => nav.navigate('StoreRequest', { type: 'appointment', storeId: store.id, storeName: store.name })}>{t('Demander un rendez-vous')}</Button>
        </View>
      )}

      {/* Search inside this store only */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 12 }}>
        <Icon name="search" size={16} color={LMX.ink50} />
        <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => setQuery(search.trim())} returnKeyType="search"
          placeholder={t('Rechercher dans {s}', { s: title })} placeholderTextColor={LMX.ink30}
          style={{ flex: 1, height: 44, fontSize: 13.5, color: LMX.ink }} />
        {!!query && <Pressable onPress={() => { setSearch(''); setQuery(''); }}><Icon name="close" size={16} color={LMX.ink50} /></Pressable>}
      </View>

      {!!store?.categories?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
          {[{ id: 0, name: t('Tout') }, ...store.categories].map(c => {
            const on = (cat ?? 0) === c.id;
            return (
              <Pressable key={c.id} onPress={() => setCat(c.id || undefined)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: on ? LMX.ink : LMX.surface, borderWidth: 1, borderColor: on ? LMX.ink : LMX.border }}>
                <Text style={{ fontSize: 12, fontFamily: sans(600), color: on ? '#fff' : LMX.ink70 }}>{decodeEntities(c.name)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={{ paddingVertical: 48 }}><ActivityIndicator color={LMX.brand} /></View>
      ) : products.length === 0 ? (
        <Text style={{ textAlign: 'center', color: LMX.ink50, padding: 40 }}>{t('Aucun produit trouvé dans cette boutique.')}</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
          {products.map(p => (
            <View key={p.id} style={{ width: '48%' }}>
              <ProductCard product={toCardProduct(p)} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

/**
 * Request form — "Demander mon prix total" (from a product) or "Trouver un produit" (from a store).
 * Name and phone come from the account. No online payment; the request is not an order.
 */
export function ScreenStoreRequest() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { user, isLoggedIn } = useAuth();
  const type: 'price_request' | 'find_product' | 'appointment' = route.params?.type ?? 'price_request';
  const isPrice = type === 'price_request';
  const isAppt = type === 'appointment';
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLoc, setApptLoc] = useState('');
  const { data: apptStore } = useQuery({ queryKey: ['offer-store', route.params?.storeId], queryFn: () => storesApi.get(route.params?.storeId), enabled: isAppt && !!route.params?.storeId });
  const locations = apptStore?.appointment_locations ?? [];
  const [name, setName]   = useState(`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim());
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [qty, setQty]     = useState('1');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'collection'>('delivery');
  const [city, setCity]   = useState('');
  const [hood, setHood]   = useState('');
  const [variation, setVariation] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink]   = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('Permission requise'), t("Autorisez l'accès aux photos.")); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets?.[0]) setPhoto({ uri: r.assets[0].uri, name: r.assets[0].fileName || undefined, type: r.assets[0].mimeType || undefined });
  };

  const submit = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    if (isAppt) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(apptDate.trim())) { Alert.alert(t('Date requise'), t('Indiquez la date souhaitée (AAAA-MM-JJ).')); return; }
      setSaving(true);
      try {
        const r = await casesApi.appointment({ case_id: route.params?.caseId, product_id: route.params?.caseId ? undefined : route.params?.productId,
          store_id: route.params?.caseId ? undefined : route.params?.storeId, location: apptLoc || locations[0], date: apptDate.trim(), time: apptTime.trim() || undefined, comment: comment.trim() || undefined });
        setDone(r.case.ref);
      } catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
      finally { setSaving(false); }
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) { Alert.alert(t('Téléphone requis'), t('Veuillez saisir un numéro de téléphone valide.')); return; }
    if (fulfillment === 'delivery' && !city.trim()) { Alert.alert(t('Ville requise'), t('Veuillez indiquer la ville ou la commune de livraison.')); return; }
    if (!isPrice && !itemName.trim() && !description.trim() && !photo) {
      Alert.alert(t('Produit recherché'), t('Indiquez le nom, une courte description ou une photo du produit recherché.')); return;
    }
    setSaving(true);
    try {
      const r = await storesApi.request({
        type, product_id: route.params?.productId, store_id: route.params?.storeId, name: name.trim(), phone: phone.trim(),
        qty: Math.max(1, parseInt(qty, 10) || 1), fulfillment, city: city.trim(), neighborhood: hood.trim(),
        variation: variation.trim() || undefined, item_name: itemName.trim() || undefined, description: description.trim() || undefined,
        link: link.trim() || undefined, comment: comment.trim() || undefined,
      }, photo || undefined);
      setDone(r.case.ref);
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setSaving(false); }
  };

  const input = (label: string, value: string, set: (v: string) => void, opts: any = {}) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>{label}</Text>
      <TextInput value={value} onChangeText={set} placeholderTextColor={LMX.ink30} {...opts}
        style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 12, minHeight: 44, fontSize: 14, color: LMX.ink, ...(opts.multiline ? { paddingTop: 10, minHeight: 72, textAlignVertical: 'top' } : {}) }} />
    </View>
  );

  return (
    <Screen footer={done ? (
      <Button full variant="accent" size="lg" onPress={() => nav.goBack()}>{t('Terminé')}</Button>
    ) : (
      <Button full variant="accent" size="lg" icon="arrowR" disabled={saving} onPress={submit}>{saving ? t('Envoi…') : isLoggedIn ? t('Envoyer ma demande') : t('Se connecter pour envoyer')}</Button>
    )}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={isAppt ? t('Demander un rendez-vous') : isPrice ? t('Demander mon prix total') : t('Trouver un produit')} />
      {done ? (
        <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: LMX.emerald + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={28} color={LMX.emerald} /></View>
          <Text style={{ fontSize: 17, fontFamily: sans(700), color: LMX.ink }}>{t('Demande envoyée')}</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>{t('Votre référence : {ref}. Le service client Loomodex vous contactera.', { ref: done })}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
          {!!route.params?.storeName && <Text style={{ fontSize: 13, color: LMX.ink50 }}>{route.params.storeName}</Text>}
          {isAppt && (
            <>
              {locations.length > 1 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>{t('Lieu')}</Text>
                  {locations.map(l => (
                    <Pressable key={l} onPress={() => setApptLoc(l)} style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: (apptLoc || locations[0]) === l ? LMX.brand : LMX.border, backgroundColor: LMX.surface }}>
                      <Text style={{ fontSize: 13, color: LMX.ink }}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {locations.length === 1 && <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Lieu : {l}', { l: locations[0] })}</Text>}
              {input(t('Date souhaitée (AAAA-MM-JJ)'), apptDate, setApptDate, { keyboardType: 'numbers-and-punctuation', placeholder: '2026-12-05' })}
              {input(t('Heure souhaitée (HH:MM)'), apptTime, setApptTime, { keyboardType: 'numbers-and-punctuation', placeholder: '10:00' })}
              {!!apptStore?.opening_hours && <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{apptStore.opening_hours}</Text>}
              {input(t('Commentaire (facultatif)'), comment, setComment, { multiline: true })}
              <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t('Le service client confirmera la date et le lieu.')}</Text>
            </>
          )}
          {!isAppt && !isPrice && (
            <>
              {input(t('Nom du produit'), itemName, setItemName)}
              {input(t('Courte description'), description, setDescription, { multiline: true })}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {photo && <Image source={{ uri: photo.uri }} style={{ width: 56, height: 56, borderRadius: 8 }} />}
                <Button size="sm" variant="ghost" icon="image" onPress={pick}>{photo ? t('Changer la photo') : t('Ajouter une photo')}</Button>
              </View>
              <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t('Un seul des trois suffit : nom, description ou photo.')}</Text>
              {input(t('Lien (facultatif)'), link, setLink, { autoCapitalize: 'none', keyboardType: 'url' })}
            </>
          )}
          {!isAppt && isPrice && input(t('Variante (couleur, taille, modèle)'), variation, setVariation)}
          {!isAppt && input(t('Nom'), name, setName)}
          {!isAppt && input(t('Téléphone'), phone, setPhone, { keyboardType: 'phone-pad' })}
          {!isAppt && input(t('Quantité'), qty, setQty, { keyboardType: 'number-pad' })}
          {!isAppt && <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['delivery', 'collection'] as const).map(k => (
              <Pressable key={k} onPress={() => setFulfillment(k)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: fulfillment === k ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: fulfillment === k ? 'transparent' : LMX.border }}>
                <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: fulfillment === k ? '#fff' : LMX.ink70 }}>{k === 'delivery' ? t('Livraison') : t('Retrait')}</Text>
              </Pressable>
            ))}
          </View>}
          {!isAppt && fulfillment === 'delivery' && (
            <>
              {input(t('Ville ou commune'), city, setCity)}
              {input(t('Quartier'), hood, setHood)}
            </>
          )}
          {!isAppt && input(t('Commentaire (facultatif)'), comment, setComment, { multiline: true })}
          <Text style={{ fontSize: 11.5, color: LMX.ink50, lineHeight: 17 }}>
            {t("Aucun paiement en ligne n'est requis à cette étape. L'envoi de cette demande ne confirme pas un achat. Vos coordonnées sont partagées uniquement avec le service client Loomodex.")}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ')} GNF`;

const CASE_STATUS_FR: Record<string, string> = {
  received: 'Reçue', under_review: 'En cours de traitement', info_required: 'Informations demandées',
  proposal_review: 'En cours de traitement', quote_sent: 'Devis envoyé', closed: 'Clôturée', converted: 'Commandée',
};
const APPT_FR: Record<string, string> = {
  requested: 'Demandé — en attente de confirmation', confirmed: 'Confirmé', cancelled: 'Annulé', attended: 'Effectué', no_show: 'Manqué',
};
const QUOTE_STATUS_FR: Record<string, string> = {
  sent: 'En attente de votre réponse', accepted: 'En attente de confirmation du service client', declined: 'Refusé',
  confirmed: 'Devis confirmé', superseded: 'Remplacé par une nouvelle version', ordered: 'Commandé',
};

/** "Mes demandes" — the customer's price requests / product searches and their quotations. */
export function ScreenMyRequests() {
  const nav = useNavigation<any>();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['my-requests'], queryFn: () => casesApi.mine() });
  const cases = data?.cases ?? [];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Mes demandes')} right={<IconBtn icon="refresh" onPress={() => refetch()} />} />
      {isLoading ? <View style={{ paddingVertical: 48 }}><ActivityIndicator color={LMX.brand} /></View>
      : cases.length === 0 ? <Text style={{ textAlign: 'center', color: LMX.ink50, padding: 40 }}>{t("Vous n'avez encore envoyé aucune demande.")}</Text>
      : (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 24 }}>
          {cases.map(c => (
            <Pressable key={c.id} onPress={() => nav.navigate('MyRequest', { caseId: c.id })}
              style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.brand }}>{c.ref}</Text>
                <Text style={{ fontSize: 11, fontFamily: sans(700), color: c.status === 'quote_sent' ? LMX.accent : LMX.ink50 }}>{t(CASE_STATUS_FR[c.status] || c.status_label)}</Text>
              </View>
              <Text style={{ fontSize: 14, fontFamily: sans(600), color: LMX.ink }}>{c.product?.name || c.item_name || t('Recherche de produit')}</Text>
              <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{c.store?.name} · {t('Qté {n}', { n: c.qty })}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

export function ScreenMyRequest() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const caseId: number = route.params?.caseId;
  const { data: c, refetch, isLoading } = useQuery({ queryKey: ['my-request', caseId], queryFn: () => casesApi.get(caseId), enabled: !!caseId });
  const { data: msgs, refetch: refetchMsgs } = useQuery({ queryKey: ['my-request-msgs', caseId], queryFn: () => casesApi.messages(caseId), enabled: !!caseId });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const answer = (q: StoreQuote, decision: 'accept' | 'decline') => {
    const go = async (note?: string) => {
      setBusy(true);
      try { await casesApi.answer(q.id, decision, note); await refetch(); }
      catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
      finally { setBusy(false); }
    };
    if (decision === 'accept') Alert.alert(t('Accepter le devis'), t('Accepter le devis de {a} ?', { a: fmt(q.total) }), [{ text: t('Annuler'), style: 'cancel' }, { text: t('Accepter'), onPress: () => go() }]);
    else Alert.alert(t('Refuser le devis'), t('Voulez-vous refuser ce devis ?'), [{ text: t('Annuler'), style: 'cancel' }, { text: t('Refuser'), style: 'destructive', onPress: () => go() }]);
  };

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await casesApi.send(caseId, text.trim()); setText(''); refetchMsgs(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setBusy(false); }
  };

  const quotes = (c?.quotes ?? []).filter(q => q.kind === 'quote');
  const current = quotes[0];

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={c?.ref || t('Demande')} right={<IconBtn icon="refresh" onPress={() => { refetch(); refetchMsgs(); }} />} />
      {isLoading || !c ? <View style={{ paddingVertical: 48 }}><ActivityIndicator color={LMX.brand} /></View> : (
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 30 }}>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50 }}>{c.store?.name}</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink }}>{c.product?.name || c.item_name || t('Recherche de produit')}</Text>
            <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Qté {n}', { n: c.qty })} · {c.fulfillment === 'collection' ? t('Retrait') : t('Livraison')}{c.city ? ` · ${c.city}` : ''}</Text>
            <Text style={{ fontSize: 11.5, fontFamily: sans(700), color: LMX.brand, marginTop: 4 }}>{t(CASE_STATUS_FR[c.status] || c.status_label)}</Text>
          </View>

          {current ? (
            <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: current.status === 'confirmed' ? LMX.emerald : LMX.border, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{t('Devis v{v}', { v: current.version })}</Text>
                <Text style={{ fontSize: 11, fontFamily: sans(700), color: current.status === 'confirmed' ? LMX.emerald : LMX.accent }}>{t(QUOTE_STATUS_FR[current.status] || current.status_label)}</Text>
              </View>
              {current.lines.map((l, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>{l.name} × {l.qty}</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{fmt(l.subtotal)}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Livraison')}</Text>
                <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{fmt(current.delivery_fee)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: LMX.hairline, paddingTop: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: sans(700) }}>{t('Total')}</Text>
                <Text style={{ fontSize: 15, fontFamily: sans(800), color: LMX.accent }}>{fmt(current.total)}</Text>
              </View>
              {!!current.valid_until && <Text style={{ fontSize: 11, color: LMX.ink50 }}>{t("Valable jusqu'au {d}", { d: current.valid_until })}</Text>}
              {!!current.timing && <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{current.timing}</Text>}
              {!!current.notes && <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{current.notes}</Text>}

              {current.status === 'sent' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><Button full disabled={busy} icon="check" onPress={() => answer(current, 'accept')}>{t('Accepter')}</Button></View>
                  <View style={{ flex: 1 }}><Button full variant="ghost" disabled={busy} onPress={() => answer(current, 'decline')}>{t('Refuser')}</Button></View>
                </View>
              )}
              {current.status === 'accepted' && <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Vous avez accepté ce devis. Le service client doit maintenant le confirmer.')}</Text>}
              {current.status === 'confirmed' && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, color: LMX.emerald, fontFamily: sans(600) }}>✓ {t('Acceptation client : confirmée')}{'\n'}✓ {t('Confirmation du service client : confirmée')}</Text>
                  {current.can_order ? (
                    <>
                      <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{t('Les produits et les prix convenus sont repris automatiquement à la commande.')}</Text>
                      <Button full variant="accent" size="lg" icon="bag" onPress={() => nav.navigate('Checkout', { quoteOrder: { id: current.id, ref: c.ref, lines: current.lines } })}>{t('Commander')}</Button>
                    </>
                  ) : current.store_mode === 'quote_appointment' ? (
                    <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Le service client vous contactera pour fixer un rendez-vous.')}</Text>
                  ) : null}
                </View>
              )}
              {current.status === 'ordered' && current.order_id && (
                <Button full variant="ghost" onPress={() => nav.navigate('OrderDetails', { orderId: current.order_id })}>{t('Voir la commande')}</Button>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t('Le service client prépare votre devis. Vous serez notifié dès qu\'il sera prêt.')}</Text>
          )}

          {(c.appointments ?? []).map(a => (
            <View key={a.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: a.status === 'confirmed' ? LMX.emerald : LMX.border, padding: 12, gap: 3 }}>
              <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>{t('Rendez-vous')} · {t(APPT_FR[a.status] || a.status_label)}</Text>
              <Text style={{ fontSize: 12, color: LMX.ink70 }}>{a.slot ? t('Le {d}', { d: a.slot.substring(0, 16) }) : t('Souhaité : {d}', { d: a.preferred })}{a.location ? ` · ${a.location}` : ''}</Text>
            </View>
          ))}
          {c.store?.mode === 'quote_appointment' && !(c.appointments ?? []).some(a => a.status === 'requested' || a.status === 'confirmed') && c.status !== 'converted' && (
            <Button full variant="ghost" icon="pin" onPress={() => nav.navigate('StoreRequest', { type: 'appointment', caseId: c.id, storeId: c.store?.id, storeName: c.store?.name })}>{t('Demander un rendez-vous')}</Button>
          )}

          {/* Conversation with Loomodex Customer Service (never with the store directly) */}
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginTop: 6 }}>{t('Échanges avec le service client')}</Text>
          {(msgs?.messages ?? []).map(m => (
            <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.mine ? LMX.brand : LMX.surface, borderRadius: 12, padding: 10, borderWidth: m.mine ? 0 : 1, borderColor: LMX.border }}>
              {!m.mine && <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: sans(600) }}>{m.author}</Text>}
              <Text style={{ fontSize: 13, color: m.mine ? '#fff' : LMX.ink }}>{m.body}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={text} onChangeText={setText} placeholder={t('Écrire au service client…')} placeholderTextColor={LMX.ink30}
              style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 12, minHeight: 44, color: LMX.ink }} />
            <Button disabled={busy || !text.trim()} onPress={send} icon="arrowR">{t('Envoyer')}</Button>
          </View>
        </View>
      )}
    </Screen>
  );
}

/** "Nos offres" rows for the side menu: the active stores, then "all offers". */
export function useOfferStores() {
  return useQuery({ queryKey: ['offer-stores'], queryFn: () => storesApi.list(), staleTime: 5 * 60 * 1000 });
}
export type { OfferStore };
