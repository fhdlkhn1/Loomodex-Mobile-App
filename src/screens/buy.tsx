import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, gnfShort, fr, shadow } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Discount, ProductCard, Chip, SummaryRow } from '../components';
import { productsApi, Product as ApiProduct } from '../api/products';
import { get } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/orders';

// ─── Helpers ─────────────────────────────────────────────────────

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: mono(600), fontSize: 15 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function ReviewItem({ name, rating, body, ago }: { name: string; rating: number; body: string; ago: string }) {
  return (
    <View style={{ padding: 16, borderRadius: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontFamily: sans(600) }}>{name.split(' ').map((n: string) => n[0]).join('')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{name}</Text>
          <Text style={{ fontSize: 11, color: LMX.ink50 }}>{ago}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 1 }}>
          {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={11} color={i <= rating ? LMX.amber : LMX.ink30} />)}
        </View>
      </View>
      <Text style={{ marginTop: 10, fontSize: 12.5, color: LMX.ink70, lineHeight: 18 }}>{body}</Text>
    </View>
  );
}

// ─── Product Detail ───────────────────────────────────────────────

export function ScreenProductDetail() {
  const nav    = useNavigation<any>();
  const route  = useRoute<any>();
  const { addToCart, cart } = useCart();
  const { isLoggedIn } = useAuth();

  const productId: number | undefined = route.params?.productId;
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (productId) {
          const data = await productsApi.get(productId);
          setProduct(data);
        }
      } catch { /* show fallback below */ }
      finally { setLoading(false); }
    })();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    if (!product) return;
    setAddingCart(true);
    try {
      await addToCart(product.id, qty);
      Alert.alert('Ajouté !', `${product.name} ajouté au panier.`, [
        { text: 'Voir le panier', onPress: () => nav.navigate('Cart') },
        { text: 'Continuer', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'ajouter au panier.');
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    if (!product) return;
    setAddingCart(true);
    try {
      await addToCart(product.id, qty);
      nav.navigate('Checkout');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Erreur lors de l\'ajout au panier.');
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    try {
      await get(`/profile/wishlist/toggle`, true);
      setWishlisted(v => !v);
    } catch {}
  };

  if (loading) {
    return (
      <Screen padTop={false}>
        <AppBar overlay left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={LMX.brand} size="large" />
        </View>
      </Screen>
    );
  }

  // Use API product or fallback to static
  const p = product;
  const imageUri = p?.images?.[0] ?? p?.image ?? (productId ? null : IMG('wireless-bluetooth-headphones-pro'));
  const price    = p?.price ?? PRODUCTS[1].price;
  const wasPrice = p?.regular_price && p.regular_price > price ? p.regular_price : (PRODUCTS[1].was ?? null);
  const off      = p?.off ?? PRODUCTS[1].off;
  const name     = p?.name ?? PRODUCTS[1].name;
  const seller   = p?.seller ?? PRODUCTS[1].seller;
  const rating   = p?.rating ?? PRODUCTS[1].rating;
  const reviews  = p?.reviews ?? PRODUCTS[1].reviews;
  const sold     = p?.sold ?? PRODUCTS[1].sold;
  const desc     = p?.description || p?.short_desc || 'Produit de qualité premium disponible sur Loomodex. Livraison rapide en 24–48h à Conakry.';
  const inStock  = p?.in_stock ?? true;
  const cartCount = cart.item_count;

  return (
    <Screen
      padTop={false}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={handleWishlist}
            style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: wishlisted ? LMX.accentSoft : LMX.surface, borderWidth: 1, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="heart" size={20} color={wishlisted ? LMX.accent : LMX.ink} />
          </Pressable>
          <Button variant="ghost" size="lg" style={{ flex: 1 }} onPress={handleAddToCart} disabled={addingCart || !inStock}>
            {addingCart ? 'Ajout...' : 'Ajouter'}
          </Button>
          <Button variant="accent" size="lg" style={{ flex: 1.2 }} onPress={handleBuyNow} disabled={addingCart || !inStock}>
            {!inStock ? 'Indisponible' : 'Acheter'}
          </Button>
        </View>
      }
    >
      <AppBar
        overlay
        left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />}
        right={
          <>
            <IconBtn icon="share" bg="rgba(255,255,255,0.9)" />
            <IconBtn icon="bag" bg="rgba(255,255,255,0.9)" badge={cartCount || undefined} onPress={() => nav.navigate('Cart')} />
          </>
        }
      />

      {/* Product image */}
      <View style={{ height: 340, backgroundColor: LMX.surfaceAlt }}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={60} color={LMX.ink30} /></View>
        }
        {/* Gallery dots */}
        {p?.images && p.images.length > 1 && (
          <View style={{ position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            {p.images.slice(0, 5).map((_, i) => (
              <View key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === 0 ? LMX.brand : 'rgba(255,255,255,0.7)' }} />
            ))}
          </View>
        )}
        {off > 0 && (
          <View style={{ position: 'absolute', top: 80, left: 16, backgroundColor: LMX.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontFamily: mono(700), fontSize: 13 }}>−{off}%</Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: -22, backgroundColor: LMX.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
        {/* Seller badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Pressable
            onPress={() => nav.navigate('SellerStorefront', { vendorId: p?.seller_id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: LMX.brandSoft, borderWidth: 1, borderColor: LMX.brand + '33' }}
          >
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={11} color="#fff" />
            </View>
            <Text style={{ fontSize: 11, fontFamily: sans(600), color: LMX.brand }}>{seller}</Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: LMX.ink50 }}>· {sold}+ vendus</Text>
          <View style={{ flex: 1 }} />
          {inStock
            ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="checkCircle" size={12} color={LMX.emerald} /><Text style={{ fontSize: 11, color: LMX.emerald, fontFamily: sans(600) }}>En stock</Text></View>
            : <Text style={{ fontSize: 11, color: LMX.rose, fontFamily: sans(600) }}>Rupture de stock</Text>
          }
        </View>

        {/* Name */}
        <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 30, color: LMX.ink }}>{name}</Text>

        {/* Rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 1 }}>
            {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={13} color={i <= Math.round(rating) ? LMX.amber : LMX.ink30} />)}
          </View>
          <Text style={{ fontFamily: mono(600), fontSize: 12 }}>{rating.toFixed(1)}</Text>
          <Text style={{ fontSize: 12, color: LMX.ink50 }}>({reviews} avis)</Text>
        </View>

        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Price value={price} was={wasPrice} size="xl" />
          {off > 0 && <Discount off={off} />}
        </View>

        {/* Qty selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(500), color: LMX.ink70 }}>Quantité :</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: LMX.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: LMX.hairline }}>
            <Pressable onPress={() => setQty(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={14} color={LMX.ink} />
            </Pressable>
            <Text style={{ minWidth: 24, textAlign: 'center', fontFamily: mono(600), fontSize: 14 }}>{qty}</Text>
            <Pressable onPress={() => setQty(q => q + 1)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Delivery */}
        <View style={{ marginTop: 18, padding: 16, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="truck" size={18} color={LMX.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Livraison gratuite à Conakry</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>24–48h · Paiement à la livraison disponible</Text>
          </View>
          <Icon name="chevR" size={16} color={LMX.ink50} />
        </View>

        {/* Trust */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {[
            { icon: 'shield', text: 'Produit vérifié' },
            { icon: 'refresh', text: 'Retour 14j' },
            { icon: 'key', text: 'OTP sécurisé' },
          ].map(b => (
            <View key={b.text} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: LMX.brandSoft, borderRadius: 8, padding: 8 }}>
              <Icon name={b.icon as any} size={12} color={LMX.brand} />
              <Text style={{ fontSize: 9.5, color: LMX.brand, fontFamily: sans(600), flexShrink: 1 }}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontFamily: sans(700), marginBottom: 8 }}>Description</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: LMX.ink70 }}>{desc}</Text>
        </View>

        {/* Attributes */}
        {p?.attributes && p.attributes.length > 0 && (
          <View style={{ marginTop: 18, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LMX.hairline, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {p.attributes.map(attr => (
              <View key={attr.name} style={{ flex: 1, minWidth: 80, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{attr.values.join(', ')}</Text>
                <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase' }}>{attr.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Related products */}
        {p?.related && p.related.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontFamily: sans(700), marginBottom: 12 }}>Produits similaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {p.related.map(rel => (
                <View key={rel.id} style={{ width: 150 }}>
                  <ProductCard
                    product={{ id: String(rel.id), name: rel.name, slug: rel.slug, price: rel.price, was: rel.regular_price > rel.price ? rel.regular_price : null, off: rel.off, cat: '', seller: rel.seller, rating: rel.rating, reviews: rel.reviews, sold: rel.sold, image: rel.image } as any}
                    onPress={() => nav.push('ProductDetail', { productId: rel.id })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Screen>
  );
}

// ─── Seller Storefront ────────────────────────────────────────────

export function ScreenSellerStorefront() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number | undefined = route.params?.vendorId;

  const [vendor, setVendor]     = useState<any>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    (async () => {
      try {
        const [v, p] = await Promise.all([
          get<any>(`/vendors/${vendorId}`),
          get<{ products: ApiProduct[] }>(`/vendors/${vendorId}/products`),
        ]);
        setVendor(v);
        setProducts(p.products ?? []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [vendorId]);

  const name   = vendor?.name  ?? 'Vendeur';
  const logo   = vendor?.logo  ?? null;
  const rating = vendor?.rating?.avg ?? 0;
  const reviews= vendor?.rating?.count ?? 0;

  return (
    <Screen padTop={false}>
      <AppBar overlay left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />} right={<><IconBtn icon="share" bg="rgba(255,255,255,0.9)" /><IconBtn icon="bag" bg="rgba(255,255,255,0.9)" onPress={() => nav.navigate('Cart')} /></>} />
      <LinearGradient colors={['#0B1F3A', '#1E6BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 160 }} />
      <View style={{ paddingHorizontal: 16, marginTop: -36 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff', padding: 4, alignSelf: 'flex-start', ...shadow('md') }}>
          {logo
            ? <Image source={{ uri: logo }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
            : (
              <LinearGradient colors={[LMX.accent, LMX.brand]} style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 28, color: '#fff' }}>{name[0]}</Text>
              </LinearGradient>
            )
          }
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator color={LMX.brand} /></View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: FONT.display, fontSize: 24, color: LMX.ink }}>{name}</Text>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                </View>
                {vendor?.address?.city && (
                  <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 4 }}>
                    <Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>● Actif</Text> · {vendor.address.city}, Guinée
                  </Text>
                )}
              </View>
              <Button variant="primary" size="sm">Suivre</Button>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LMX.hairline }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{rating > 0 ? rating.toFixed(2) : '—'}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>Note</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{reviews}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>Avis</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{products.length}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>Produits</Text>
              </View>
            </View>

            {vendor?.bio && (
              <Text style={{ marginTop: 12, fontSize: 12.5, color: LMX.ink70, lineHeight: 19 }}>{vendor.bio}</Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {products.length === 0
              ? <Text style={{ color: LMX.ink50, fontSize: 13 }}>Aucun produit disponible.</Text>
              : products.map(p => (
                  <View key={p.id} style={{ width: '47.5%' }}>
                    <ProductCard
                      product={{ id: String(p.id), name: p.name, slug: p.slug, price: p.price, was: p.regular_price > p.price ? p.regular_price : null, off: p.off, cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image } as any}
                      onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
                    />
                  </View>
                ))
            }
          </View>
        </>
      )}
    </Screen>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────

function LiveStepper({ cartKey, qty }: { cartKey: string; qty: number }) {
  const { updateQty } = useCart();
  const [val, setVal] = useState(qty);
  const [busy, setBusy] = useState(false);

  const change = async (newQty: number) => {
    if (newQty < 1) return;
    setBusy(true);
    setVal(newQty);
    try { await updateQty(cartKey, newQty); } catch {}
    finally { setBusy(false); }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: LMX.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: LMX.hairline, opacity: busy ? 0.6 : 1 }}>
      <Pressable onPress={() => change(val - 1)} style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="minus" size={14} color={LMX.ink} />
      </Pressable>
      <Text style={{ minWidth: 20, textAlign: 'center', fontFamily: mono(600), fontSize: 13 }}>{val}</Text>
      <Pressable onPress={() => change(val + 1)} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plus" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

export function ScreenCart() {
  const nav = useNavigation<any>();
  const { cart, fetchCart, removeItem, loading } = useCart();
  const { isLoggedIn } = useAuth();

  useEffect(() => { fetchCart(); }, []);

  if (!isLoggedIn) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Panier" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="bag" size={52} color={LMX.ink30} />
          <Text style={{ fontSize: 18, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>Connectez-vous pour voir votre panier</Text>
          <Button variant="accent" onPress={() => nav.navigate('SignIn')}>Se connecter</Button>
        </View>
      </Screen>
    );
  }

  const delivery = 25000;
  const freeDeliveryThreshold = 500000;
  const progressPct = Math.min(cart.subtotal / freeDeliveryThreshold, 1);
  const remaining = Math.max(0, freeDeliveryThreshold - cart.subtotal);

  return (
    <Screen footer={
      cart.item_count > 0
        ? <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Checkout')}>{`Commander · ${gnfShort(cart.total)} GNF`}</Button>
        : null
    }>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        title={`Panier · ${cart.item_count} article${cart.item_count !== 1 ? 's' : ''}`}
        right={<IconBtn icon="receipt" />}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={LMX.brand} size="large" />
        </View>
      ) : cart.items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="bag" size={52} color={LMX.ink30} />
          <Text style={{ fontSize: 18, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>Votre panier est vide</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>Ajoutez des produits pour commencer vos achats.</Text>
          <Button variant="accent" onPress={() => nav.navigate('Main')}>Découvrir des produits</Button>
        </View>
      ) : (
        <>
          {/* Free delivery progress */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
              {remaining > 0 ? (
                <Text style={{ fontSize: 12.5, fontFamily: sans(500) }}>
                  Encore <Text style={{ fontFamily: mono(600) }}>{fr(remaining)}</Text> GNF pour la{' '}
                  <Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>livraison gratuite</Text>
                </Text>
              ) : (
                <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.emerald }}>🎉 Livraison gratuite débloquée !</Text>
              )}
              <View style={{ height: 4, borderRadius: 2, backgroundColor: LMX.ink10, marginTop: 10, overflow: 'hidden' }}>
                <View style={{ width: `${progressPct * 100}%`, height: '100%', backgroundColor: LMX.emerald }} />
              </View>
            </View>
          </View>

          {/* Items */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {cart.items.map(item => (
              <View key={item.key} style={{ flexDirection: 'row', gap: 12, padding: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.border }}>
                <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: LMX.surfaceAlt, overflow: 'hidden' }}>
                  {item.image
                    ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={24} color={LMX.ink30} /></View>
                  }
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: sans(500), lineHeight: 17, flex: 1 }}>{item.name}</Text>
                    <Pressable onPress={() => removeItem(item.key)}>
                      <Icon name="close" size={16} color={LMX.ink50} />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <Price value={item.price} size="md" />
                    <LiveStepper cartKey={item.key} qty={item.qty} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Promo code */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', height: 50 }}>
              <Icon name="tag" size={16} color={LMX.ink70} />
              <Text style={{ flex: 1, fontSize: 13, color: LMX.ink50 }}>Code promo ou bon</Text>
              <Text style={{ color: LMX.brand, fontFamily: sans(600), fontSize: 13 }}>Appliquer</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <SummaryRow label="Sous-total" value={cart.subtotal} />
            {cart.discount_total > 0 && <SummaryRow label="Réduction" value={-cart.discount_total} accent />}
            <SummaryRow label="Livraison (Conakry)" value={remaining > 0 ? delivery : 0} />
            <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total</Text>
              <Price value={cart.total + (remaining > 0 ? delivery : 0)} size="lg" />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────

function StepDot({ n, label, active, done }: { n: string; label: string; active?: boolean; done?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done ? LMX.brand : active ? LMX.accent : LMX.surface, borderWidth: !done && !active ? 1 : 0, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Icon name="check" size={12} color="#fff" /> : <Text style={{ fontSize: 11, fontFamily: mono(700), color: active ? '#fff' : LMX.ink50 }}>{n}</Text>}
      </View>
      <Text style={{ fontSize: 11.5, fontFamily: active ? sans(600) : sans(500), color: active ? LMX.ink : LMX.ink70 }}>{label}</Text>
    </View>
  );
}

function PayGlyph({ bg, text, dark }: { bg: string; text: string; dark?: boolean }) {
  return <View style={{ width: 28, height: 22, borderRadius: 5, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: dark ? LMX.ink : '#fff', fontSize: 9, fontFamily: sans(700) }}>{text}</Text></View>;
}

const PAYMENT_METHODS = [
  { id: 'cod',          title: 'Paiement à la livraison', sub: 'Inspectez avant de payer · Sans frais', badge: { label: 'Recommandé', color: LMX.emerald }, icon: <Icon name="money" size={20} color={LMX.ink} /> },
  { id: 'orange_money', title: 'Orange Money',             sub: 'Payer via USSD #144#',                  icon: <PayGlyph bg="#FF7900" text="OM" /> },
  { id: 'mtn_momo',    title: 'MTN Mobile Money',          sub: 'Portefeuille MTN MoMo',                 icon: <PayGlyph bg="#FFCC00" text="MoMo" dark /> },
  { id: 'card',        title: 'Carte · Visa / Mastercard', sub: 'Ajouter une carte pour payer',          icon: <Icon name="card" size={20} color={LMX.ink} /> },
];

export function ScreenCheckout() {
  const nav = useNavigation<any>();
  const { user, isLoggedIn } = useAuth();
  const { cart, clearCart }  = useCart();
  const [payMethod, setPayMethod] = useState('cod');
  const [placing, setPlacing]     = useState(false);
  const [step, setStep]           = useState(2);

  const delivery = 25000;
  const total    = cart.total + delivery;

  const placeOrder = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    if (cart.items.length === 0) { Alert.alert('Panier vide'); return; }

    setPlacing(true);
    try {
      const orderItems = cart.items.map(i => ({ product_id: i.product_id, qty: i.qty }));
      const billing = {
        first_name: user?.first_name ?? '',
        last_name:  user?.last_name  ?? '',
        email:      user?.email      ?? '',
        phone:      user?.phone      ?? '',
        address:    '',
        city:       'Conakry',
      };
      const res = await ordersApi.create({ items: orderItems, billing, payment_method: payMethod });
      await clearCart();
      nav.navigate('OrderSuccess', { orderId: res.order.id, orderNumber: res.order.number });
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de passer la commande. Réessayez.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen footer={
      <View>
        <Button full variant="accent" size="lg" onPress={placeOrder} disabled={placing}>
          {placing
            ? <ActivityIndicator color="#fff" />
            : <><Icon name="shield" size={16} color="#fff" /><Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 15 }}> Commander · {gnfShort(total)} GNF</Text></>
          }
        </Button>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, textAlign: 'center', marginTop: 8 }}>
          En passant la commande, vous acceptez les CGV de Loomodex.
        </Text>
      </View>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Commander" />

      {/* Step indicator */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StepDot n="1" label="Adresse" done={step >= 2} active={step === 1} />
          <View style={{ flex: 1, height: 1, backgroundColor: step >= 2 ? LMX.brand : LMX.ink10 }} />
          <StepDot n="2" label="Paiement" active={step === 2} done={step > 2} />
          <View style={{ flex: 1, height: 1, backgroundColor: LMX.ink10 }} />
          <StepDot n="3" label="Confirmation" active={step === 3} />
        </View>
      </View>

      {/* Delivery address */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Livraison à</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pin" size={16} color={LMX.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>
              {user?.first_name} {user?.last_name} · {user?.phone || '—'}
            </Text>
            <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 4, lineHeight: 17 }}>
              Conakry, Guinée
            </Text>
          </View>
          <Pressable onPress={() => nav.navigate('AddressForm')}>
            <Text style={{ color: LMX.brand, fontFamily: sans(600), fontSize: 12 }}>Modifier</Text>
          </Pressable>
        </View>
      </View>

      {/* Payment methods */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Mode de paiement</Text>
        <View style={{ gap: 10 }}>
          {PAYMENT_METHODS.map(m => (
            <Pressable key={m.id} onPress={() => setPayMethod(m.id)}>
              <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: payMethod === m.id ? 2 : 1, borderColor: payMethod === m.id ? LMX.brand : LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>{m.icon}</View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{m.title}</Text>
                    {m.badge && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: m.badge.color }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff' }}>{m.badge.label}</Text></View>}
                  </View>
                  <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{m.sub}</Text>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: payMethod === m.id ? LMX.brand : LMX.border, backgroundColor: payMethod === m.id ? LMX.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {payMethod === m.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* OTP notice */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.emeraldSoft, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="shield" size={18} color={LMX.emerald} />
          <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 17, flex: 1 }}>
            Votre livreur partagera un code unique à la porte. Confirmez uniquement après inspection de votre commande.
          </Text>
        </View>
      </View>

      {/* Order summary */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Récapitulatif</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
          {/* Item thumbnails */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {cart.items.slice(0, 3).map((item, i) => (
                item.image
                  ? <Image key={item.key} source={{ uri: item.image }} style={{ width: 38, height: 38, borderRadius: 10, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: LMX.surface }} />
                  : <View key={item.key} style={{ width: 38, height: 38, borderRadius: 10, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: LMX.surface, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={14} color={LMX.ink30} /></View>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{cart.item_count} article{cart.item_count !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: LMX.hairline, paddingTop: 10 }}>
            <SummaryRow label="Sous-total" value={cart.subtotal} />
            <SummaryRow label="Livraison (Conakry)" value={delivery} />
            {cart.discount_total > 0 && <SummaryRow label="Réduction" value={-cart.discount_total} accent />}
            <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total à payer</Text>
              <Price value={total} size="md" />
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
