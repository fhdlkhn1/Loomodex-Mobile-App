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
import { storesApi, Product as ApiProduct, OfferStore, StoreInfo, StoreMode } from '../api/products';
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
  const type: 'price_request' | 'find_product' = route.params?.type ?? 'price_request';
  const isPrice = type === 'price_request';
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
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={isPrice ? t('Demander mon prix total') : t('Trouver un produit')} />
      {done ? (
        <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: LMX.emerald + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={28} color={LMX.emerald} /></View>
          <Text style={{ fontSize: 17, fontFamily: sans(700), color: LMX.ink }}>{t('Demande envoyée')}</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>{t('Votre référence : {ref}. Le service client Loomodex vous contactera.', { ref: done })}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
          {!!route.params?.storeName && <Text style={{ fontSize: 13, color: LMX.ink50 }}>{route.params.storeName}</Text>}
          {!isPrice && (
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
          {isPrice && input(t('Variante (couleur, taille, modèle)'), variation, setVariation)}
          {input(t('Nom'), name, setName)}
          {input(t('Téléphone'), phone, setPhone, { keyboardType: 'phone-pad' })}
          {input(t('Quantité'), qty, setQty, { keyboardType: 'number-pad' })}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['delivery', 'collection'] as const).map(k => (
              <Pressable key={k} onPress={() => setFulfillment(k)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: fulfillment === k ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: fulfillment === k ? 'transparent' : LMX.border }}>
                <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: fulfillment === k ? '#fff' : LMX.ink70 }}>{k === 'delivery' ? t('Livraison') : t('Retrait')}</Text>
              </Pressable>
            ))}
          </View>
          {fulfillment === 'delivery' && (
            <>
              {input(t('Ville ou commune'), city, setCity)}
              {input(t('Quartier'), hood, setHood)}
            </>
          )}
          {input(t('Commentaire (facultatif)'), comment, setComment, { multiline: true })}
          <Text style={{ fontSize: 11.5, color: LMX.ink50, lineHeight: 17 }}>
            {t("Aucun paiement en ligne n'est requis à cette étape. L'envoi de cette demande ne confirme pas un achat. Vos coordonnées sont partagées uniquement avec le service client Loomodex.")}
          </Text>
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
