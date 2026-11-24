import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput, ScrollView, Image } from 'react-native';
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
export function StoreRequestFooter({ store }: { store: StoreInfo }) {
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
      <Button full variant="accent" size="lg" icon="msg" onPress={() => nav.navigate('Help')}>{t('Demander un devis')}</Button>
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

/** "Nos offres" rows for the side menu: the active stores, then "all offers". */
export function useOfferStores() {
  return useQuery({ queryKey: ['offer-stores'], queryFn: () => storesApi.list(), staleTime: 5 * 60 * 1000 });
}
export type { OfferStore };
