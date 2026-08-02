import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LMX, FONT, sans, decodeEntities } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, ProductCard } from '../components';
import { productsApi, Product as ApiProduct } from '../api/products';

/**
 * USA Store — products imported from the United States.
 * Kept entirely separate from the local Guinea catalogue: /products/usa-store is the
 * only endpoint that returns imported products, and every other list excludes them.
 */
export function ScreenUsaStore() {
  const nav = useNavigation<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['usa-store'],
    queryFn: () => productsApi.usaStore({ per_page: 40 }),
  });

  const products = data?.products ?? [];
  const eta = data?.delivery_estimate || '10–14 jours ouvrables';

  const toCard = (p: ApiProduct) => ({
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
  });

  return (
    <Screen>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Main'))} />}
        title="USA Store"
      />

      {/* Hero — sets delivery expectations before anything else */}
      <View style={{ marginHorizontal: 16, borderRadius: LMX.r.xl, backgroundColor: LMX.navy, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 22 }}>🇺🇸</Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: '#fff' }}>USA Store</Text>
        </View>
        <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 14 }}>
          iPhone, MacBook, Apple Watch, AirPods et autres produits électroniques expédiés
          directement des États-Unis.
        </Text>
        {[
          { icon: 'package', text: `Livraison estimée : ${eta}` },
          { icon: 'checkCircle', text: 'Produits américains authentiques' },
          { icon: 'shield', text: 'Expédition internationale sécurisée' },
        ].map(r => (
          <View key={r.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
            <Icon name={r.icon as any} size={14} color="#fff" />
            <Text style={{ fontSize: 12, color: '#fff', opacity: 0.9 }}>{r.text}</Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 48 }}>
          <ActivityIndicator color={LMX.brand} />
        </View>
      ) : products.length === 0 ? (
        <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 48, gap: 8 }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>🇺🇸</Text>
          </View>
          <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink, marginTop: 4 }}>Aucun produit importé</Text>
          <Text style={{ fontSize: 12.5, color: LMX.ink50, textAlign: 'center', lineHeight: 18 }}>
            Les produits importés des États-Unis apparaîtront ici dès que nos vendeurs les auront ajoutés.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 18 }}>
          {products.map(p => (
            <View key={p.id} style={{ width: '48%' }}>
              <ProductCard
                product={toCard(p) as any}
                onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
