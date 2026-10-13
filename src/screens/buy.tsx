import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, gnf, gnfShort, fr, shadow, decodeEntities } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, ProductCard, SummaryRow, Field } from '../components';
import { Picker } from '../components/Picker';
import { productsApi, Product as ApiProduct, ProductTabs } from '../api/products';
import { checkoutApi, DeliveryZone, DeliveryQuote } from '../api/checkout';
import { FeeBreakdown, Notice } from '../components/FeeBreakdown';
import { configApi } from '../api/config';
import { LocationPicker, LatLng } from '../components/LocationPicker';
import { get } from '../api/client';
import { profileApi } from '../api/profile';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/orders';
import { friendlyError } from '../api/client';
import { ImageViewer } from '../components/ImageViewer';
import { ProductVideo } from '../components/ProductVideo';
import { PhoneInput, toE164 } from '../components/PhoneInput';
import { t } from '../i18n';

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
  const [addingCart, setAddingCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedVar, setSelectedVar] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'offers' | 'policies'>('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText]     = useState('');
  const [reviewBusy, setReviewBusy]     = useState(false);

  // Cached product + tabs (TanStack Query) — instant on revisits
  const { data: product = null, isLoading: loading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId as number),
    enabled: !!productId,
  });
  const { data: tabs = null, refetch: refetchTabs } = useQuery({
    queryKey: ['product-tabs', productId],
    queryFn: () => productsApi.tabs(productId as number),
    enabled: !!productId,
  });

  const submitReview = async () => {
    if (!isLoggedIn) { nav.navigate('SignIn'); return; }
    if (!product) return;
    if (!reviewText.trim()) { Alert.alert(t('Avis vide'), t('Veuillez écrire votre avis.')); return; }
    setReviewBusy(true);
    try {
      await productsApi.postReview(product.id, reviewRating, reviewText.trim());
      setReviewText(''); setReviewRating(5);
      await refetchTabs();
      Alert.alert(t('Merci !'), t('Votre avis a été publié.'));
    } catch (e: any) {
      Alert.alert(t('Erreur'), friendlyError(e, t("Impossible de publier l'avis.")));
    } finally { setReviewBusy(false); }
  };

  // Validate the variable-product selection and return the variation to add (or null on error).
  const resolveVariation = (): { variationId?: number; variationMap?: Record<string, string> } | null => {
    const attrs = product?.variation_attributes ?? [];
    if (product?.type === 'variable' && attrs.length) {
      if (!attrs.every(a => selectedVar[a.key])) {
        Alert.alert(t('Sélection requise'), t('Veuillez choisir toutes les options du produit.'));
        return null;
      }
      const v = (product.variations ?? []).find(vv => attrs.every(a => !vv.attributes[a.key] || vv.attributes[a.key] === selectedVar[a.key]));
      if (!v) { Alert.alert(t('Indisponible'), t("Cette combinaison n'est pas disponible.")); return null; }
      if (!v.in_stock) { Alert.alert(t('Rupture'), t('Cette option est en rupture de stock.')); return null; }
      return { variationId: v.id, variationMap: selectedVar };
    }
    return {};
  };

  const handleAddToCart = async () => {
    // Guests can add to cart — checkout is guest-friendly (local cart, guest order).
    if (!product) return;
    const r = resolveVariation();
    if (!r) return;
    setAddingCart(true);
    try {
      await addToCart(product.id, qty, r.variationId, r.variationMap);
      Alert.alert(t('Ajouté !'), t('{name} ajouté au panier.', { name: product.name }), [
        { text: t('Voir le panier'), onPress: () => nav.navigate('Cart') },
        { text: t('Continuer'), style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'ajouter au panier.")));
    } finally {
      setAddingCart(false);
    }
  };

  // Buy Now — add the item then go straight to checkout (skip the cart). Guests allowed.
  const handleBuyNow = async () => {
    if (!product) return;
    const r = resolveVariation();
    if (!r) return;
    setBuyingNow(true);
    try {
      await addToCart(product.id, qty, r.variationId, r.variationMap);
      nav.navigate('Checkout');
    } catch (e: any) {
      Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'ajouter au panier.")));
    } finally {
      setBuyingNow(false);
    }
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

  const p = product;
  const cartCount = cart.item_count;

  if (!p) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Produit')} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Icon name="bag" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 15, color: LMX.ink70 }}>{t('Produit introuvable')}</Text>
        </View>
      </Screen>
    );
  }

  const gallery  = (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])).filter(Boolean);
  const video    = (p.video || '').trim();
  const showVideo = !!video && imgIdx === gallery.length;
  const imageUri = gallery[imgIdx] ?? gallery[0] ?? null;
  const wasPrice = p.regular_price && p.regular_price > p.price ? p.regular_price : null;
  const desc     = decodeEntities(p.short_desc || p.description || '');
  const category = decodeEntities(p.category_name || '');
  const inStock  = p.in_stock;

  // Variable product handling
  const varAttrs = p.variation_attributes ?? [];
  const isVariable = p.type === 'variable' && varAttrs.length > 0;
  const matchedVar = isVariable && varAttrs.every(a => selectedVar[a.key])
    ? (p.variations ?? []).find(v => varAttrs.every(a => !v.attributes[a.key] || v.attributes[a.key] === selectedVar[a.key]))
    : undefined;
  const displayPrice = matchedVar?.price ?? p.price;

  return (
    <Screen
      padTop={false}
      footer={
        <View style={{ gap: 8 }}>
          <Button full variant="accent" size="lg" icon="bag" onPress={handleAddToCart} disabled={addingCart || buyingNow || !inStock}>
            {!inStock ? t('Indisponible') : addingCart ? t('Ajout...') : t('Ajouter au panier')}
          </Button>
          <Button full variant="accent" size="lg" icon="arrowR" onPress={handleBuyNow} disabled={addingCart || buyingNow || !inStock} style={{ backgroundColor: LMX.brand }}>
            {buyingNow ? '...' : t('Acheter maintenant')}
          </Button>
        </View>
      }
    >
      <AppBar
        overlay
        left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />}
        right={<IconBtn icon="bag" bg="rgba(255,255,255,0.9)" badge={cartCount || undefined} onPress={() => nav.navigate('Cart')} />}
      />

      {/* Product image (tap → full-screen viewer) or the product video */}
      <View style={{ height: 340, backgroundColor: showVideo ? '#000' : LMX.surfaceAlt }}>
        {showVideo
          ? <ProductVideo url={video} style={{ flex: 1, marginTop: 64, marginBottom: 22 }} />
          : imageUri
            ? (
              <Pressable onPress={() => setViewerOpen(true)} style={{ flex: 1 }}>
                <ExpoImage source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View style={{ position: 'absolute', right: 14, bottom: 34, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(11,31,58,0.62)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Icon name="search" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11, fontFamily: mono(600) }}>{gallery.length > 1 ? `${imgIdx + 1}/${gallery.length}` : t('Zoom')}</Text>
                </View>
              </Pressable>
            )
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={60} color={LMX.ink30} /></View>
        }
        {!!video && !showVideo && (
          <Pressable onPress={() => setImgIdx(gallery.length)} style={{ position: 'absolute', left: 14, bottom: 34, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, ...shadow('md') }}>
            <Icon name="play" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontFamily: sans(700) }}>{t('Vidéo')}</Text>
          </Pressable>
        )}
      </View>

      <ImageViewer
        images={gallery}
        index={Math.min(imgIdx, Math.max(gallery.length - 1, 0))}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setImgIdx}
      />

      <View style={{ marginTop: -22, backgroundColor: LMX.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
        {/* Thumbnail gallery */}
        {(gallery.length > 1 || !!video) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 16 }}>
            {gallery.map((img, i) => (
              <Pressable key={i} onPress={() => setImgIdx(i)} style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: i === imgIdx ? LMX.brand : LMX.border, backgroundColor: LMX.surfaceAlt }}>
                <ExpoImage source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Pressable>
            ))}
            {!!video && (
              <Pressable onPress={() => setImgIdx(gallery.length)} style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: showVideo ? LMX.brand : LMX.border, backgroundColor: LMX.navy, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                {!!gallery[0] && <ExpoImage source={{ uri: gallery[0] }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }} contentFit="cover" />}
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="play" size={11} color="#fff" />
                </View>
                <Text style={{ fontSize: 9.5, fontFamily: sans(700), color: '#fff' }}>{t('Vidéo')}</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {/* Category */}
        {!!category && (
          <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.brand, marginBottom: 6 }}>{category}</Text>
        )}

        {/* Name */}
        <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 30, color: LMX.ink }}>{decodeEntities(p.name)}</Text>

        {/* Stock + (during launch) a Verified Product trust badge when there are no reviews yet */}
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {inStock
            ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: LMX.emeraldSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}><Icon name="checkCircle" size={13} color={LMX.emerald} /><Text style={{ fontSize: 11.5, color: LMX.emerald, fontFamily: sans(600) }}>{t('En stock')}</Text></View>
            : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFE9E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}><Text style={{ fontSize: 11.5, color: LMX.rose, fontFamily: sans(600) }}>{t('Rupture de stock')}</Text></View>
          }
          {(p.reviews ?? 0) === 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DAF1E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Icon name="shield" size={13} color="#0E8A57" />
              <Text style={{ fontSize: 11.5, color: '#0E8A57', fontFamily: sans(600) }}>{t('Produit vérifié')}</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={{ marginTop: 16 }}>
          <Price value={displayPrice} was={wasPrice} size="xl" color={LMX.accent} />
        </View>

        {/* Short description */}
        {!!desc && <Text style={{ fontSize: 13, lineHeight: 20, color: LMX.ink70, marginTop: 12 }}>{desc}</Text>}

        {/* Variation selectors */}
        {isVariable && (
          <View style={{ marginTop: 16, gap: 12 }}>
            {varAttrs.map(a => (
              <Picker
                key={a.key}
                label={a.label}
                value={selectedVar[a.key] ?? ''}
                onChange={(val) => setSelectedVar(prev => ({ ...prev, [a.key]: val }))}
                placeholder={t('Choisir {label}', { label: a.label.toLowerCase() })}
                options={a.options.map(o => ({ value: o, label: decodeEntities(o) }))}
              />
            ))}
          </View>
        )}

        {/* Qty selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(500), color: LMX.ink70 }}>{t('Quantité :')}</Text>
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

        {/* Imported-from-USA panel — must be visible BEFORE ordering so nobody expects
            the local 3h–48h service on a product shipping from the United States. */}
        {p.is_usa && (
          <View style={{ marginTop: 18, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceMuted, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text style={{ fontSize: 16 }}>🇺🇸</Text>
              <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>{t('Importé des États-Unis')}</Text>
            </View>
            {[
              { icon: 'package', label: t('Livraison estimée'), value: p.delivery_estimate || t('10–14 jours ouvrables') },
              { icon: 'checkCircle', label: t('Produits américains authentiques'), value: null },
              { icon: 'shield', label: t('Expédition internationale sécurisée'), value: null },
            ].map(row => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }}>
                <Icon name={row.icon as any} size={14} color={LMX.brand} />
                <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>
                  {row.value ? <Text style={{ fontFamily: sans(600), color: LMX.ink }}>{row.label} : </Text> : null}
                  {row.value ?? row.label}
                </Text>
              </View>
            ))}
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 8, lineHeight: 15 }}>
              {t('Ce produit est expédié depuis les États-Unis et prend plus de temps que nos livraisons locales à Conakry.')}
            </Text>
          </View>
        )}

        {/* Trust icons (matches website: Fast Delivery · Secure Payment · Easy Returns) */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
          {[
            { icon: p.is_usa ? 'package' : 'truck', text: p.is_usa ? (p.delivery_estimate || t('10–14 jours')) : t('Livraison rapide') },
            { icon: 'shield', text: t('Paiement sécurisé') },
            { icon: 'refresh', text: t('Retours faciles') },
          ].map(b => (
            <View key={b.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={b.icon as any} size={15} color={LMX.brand} />
              <Text style={{ fontSize: 11, color: LMX.ink70, fontFamily: sans(500) }}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Category line (matches website summary) */}
        {!!category && (
          <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 16 }}>
            {t('Catégorie :')} <Text style={{ color: LMX.brand, fontFamily: sans(600) }}>{category}</Text>
          </Text>
        )}

        {/* Tabs (Description · Reviews · More Offers · Store Policies · Inquiries) */}
        <View style={{ marginTop: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: LMX.hairline }} contentContainerStyle={{ gap: 18 }}>
            {([
              { key: 'description', label: t('Description') },
              { key: 'reviews',     label: t('Avis ({n})', { n: tabs?.reviews.count ?? 0 }) },
              { key: 'offers',      label: t('Plus d’offres') },
              { key: 'policies',    label: t('Politiques') },
            ] as const).map(tb => (
              <Pressable key={tb.key} onPress={() => setActiveTab(tb.key)} style={{ paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: activeTab === tb.key ? LMX.brand : 'transparent' }}>
                <Text style={{ fontSize: 13, fontFamily: sans(activeTab === tb.key ? 700 : 500), color: activeTab === tb.key ? LMX.brand : LMX.ink70 }}>{tb.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ paddingTop: 14, minHeight: 80 }}>
            {/* Description */}
            {activeTab === 'description' && (
              <Text style={{ fontSize: 13, lineHeight: 20, color: LMX.ink70 }}>
                {decodeEntities(tabs?.description || p.description || p.short_desc || t('Aucune description.'))}
              </Text>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <View style={{ gap: 14 }}>
                {/* Write a review */}
                <View style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 10 }}>
                  <Text style={{ fontSize: 12.5, fontFamily: sans(700) }}>{t('Donner votre avis')}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Pressable key={s} onPress={() => setReviewRating(s)}>
                        <Icon name="star" size={26} color={s <= reviewRating ? LMX.amber : LMX.ink30} />
                      </Pressable>
                    ))}
                  </View>
                  <Field label={t('Votre avis')} value={reviewText} onChangeText={setReviewText} placeholder={t('Partagez votre expérience…')} />
                  <Button variant="primary" size="md" onPress={submitReview} disabled={reviewBusy}>{reviewBusy ? t('Publication...') : t('Publier mon avis')}</Button>
                </View>
                {/* Existing reviews */}
                {(tabs?.reviews.items.length ?? 0) === 0
                  ? <Text style={{ fontSize: 13, color: LMX.ink50 }}>{t('Soyez le premier à donner votre avis.')}</Text>
                  : <View style={{ gap: 12 }}>
                    {tabs!.reviews.items.map((r, i) => (
                      <View key={i} style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{decodeEntities(r.author)}</Text>
                          <View style={{ flexDirection: 'row', gap: 1 }}>
                            {[1,2,3,4,5].map(s => <Icon key={s} name="star" size={11} color={s <= r.rating ? LMX.amber : LMX.ink30} />)}
                          </View>
                        </View>
                        {!!r.content && <Text style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 18, marginTop: 6 }}>{decodeEntities(r.content)}</Text>}
                        {!!r.date && <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 6 }}>{r.date}</Text>}
                      </View>
                    ))}
                  </View>}
              </View>
            )}

            {/* More offers */}
            {activeTab === 'offers' && (
              (tabs?.more_offers.length ?? 0) === 0
                ? <Text style={{ fontSize: 13, color: LMX.ink50 }}>{t('Aucune autre offre pour ce produit.')}</Text>
                : <View style={{ gap: 10 }}>
                    {tabs!.more_offers.map(o => (
                      <Pressable key={o.product_id} onPress={() => nav.push('ProductDetail', { productId: o.product_id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="storefront" size={15} color={LMX.ink} /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{decodeEntities(o.store) || t('Vendeur')}</Text>
                          <Text style={{ fontSize: 11, color: o.in_stock ? LMX.emerald : LMX.ink50, marginTop: 2 }}>{o.in_stock ? t('En stock') : t('Rupture')}</Text>
                        </View>
                        <Text style={{ fontFamily: mono(600), fontSize: 12.5, color: LMX.accent }}>{gnf(o.price)}</Text>
                      </Pressable>
                    ))}
                  </View>
            )}

            {/* Store policies */}
            {activeTab === 'policies' && (() => {
              const pol = tabs?.store.policies;
              const rows = [
                { label: t('Livraison'), value: pol?.shipping },
                { label: t('Remboursement'), value: pol?.refund },
                { label: t('Échange / Retour'), value: pol?.exchange },
              ].filter(r => r.value);
              if (rows.length === 0) return <Text style={{ fontSize: 13, color: LMX.ink50 }}>{t('Aucune politique renseignée par le vendeur.')}</Text>;
              return (
                <View style={{ gap: 14 }}>
                  {!!tabs?.store.name && <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{decodeEntities(tabs.store.name)}</Text>}
                  {rows.map(r => (
                    <View key={r.label}>
                      <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink, marginBottom: 4 }}>{r.label}</Text>
                      <Text style={{ fontSize: 12.5, lineHeight: 18, color: LMX.ink70 }}>{decodeEntities(r.value as string)}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

          </View>
        </View>
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

  const name   = vendor?.name  ?? t('Vendeur');
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
            ? <ExpoImage source={{ uri: logo }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
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
                    <Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>{t('● Actif')}</Text> · {vendor.address.city}, {t('Guinée')}
                  </Text>
                )}
              </View>
              <Button variant="primary" size="sm">{t('Suivre')}</Button>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LMX.hairline }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{rating > 0 ? rating.toFixed(2) : '—'}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Note')}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{reviews}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Avis')}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{products.length}</Text>
                <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Produits')}</Text>
              </View>
            </View>

            {vendor?.bio && (
              <Text style={{ marginTop: 12, fontSize: 12.5, color: LMX.ink70, lineHeight: 19 }}>{vendor.bio}</Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {products.length === 0
              ? <Text style={{ color: LMX.ink50, fontSize: 13 }}>{t('Aucun produit disponible.')}</Text>
              : products.map(p => (
                  <View key={p.id} style={{ width: '47.5%' }}>
                    <ProductCard
                      product={{ id: String(p.id), name: p.name, slug: p.slug, price: p.price, was: p.regular_price > p.price ? p.regular_price : null, off: p.off, cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image, is_usa: p.is_usa, delivery_estimate: p.delivery_estimate } as any}
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
  // Cart works for guests too (local cart) — no login gate; checkout is guest-friendly.
  const { cart, fetchCart, removeItem, loading, applyCoupon, removeCoupon, isGuest } = useCart();
  const [coupon, setCoupon]         = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const onApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try { await applyCoupon(coupon.trim()); setCoupon(''); }
    catch (e: any) { Alert.alert(t('Code promo'), friendlyError(e, t('Code invalide.'))); }
    finally { setCouponBusy(false); }
  };

  const delivery = 25000;
  const freeDeliveryThreshold = 2500000;
  const progressPct = Math.min(cart.subtotal / freeDeliveryThreshold, 1);
  const remaining = Math.max(0, freeDeliveryThreshold - cart.subtotal);

  return (
    <Screen footer={
      cart.item_count > 0
        ? <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Checkout')}>{t('Commander · {amount} GNF', { amount: gnfShort(cart.total) })}</Button>
        : null
    }>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        title={cart.item_count !== 1 ? t('Panier · {n} articles', { n: cart.item_count }) : t('Panier · {n} article', { n: cart.item_count })}
        right={<IconBtn icon="receipt" />}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={LMX.brand} size="large" />
        </View>
      ) : cart.items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="bag" size={52} color={LMX.ink30} />
          <Text style={{ fontSize: 18, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>{t('Votre panier est vide')}</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>{t('Ajoutez des produits pour commencer vos achats.')}</Text>
          <Button variant="accent" onPress={() => nav.navigate('Main')}>{t('Découvrir des produits')}</Button>
        </View>
      ) : (
        <>
          {/* Free delivery progress */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
              {remaining > 0 ? (
                <Text style={{ fontSize: 12.5, fontFamily: sans(500) }}>
                  {t('Encore')} <Text style={{ fontFamily: mono(600) }}>{fr(remaining)}</Text> {t('GNF pour la')}{' '}
                  <Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>{t('livraison gratuite')}</Text>
                </Text>
              ) : (
                <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.emerald }}>{t('🎉 Livraison gratuite débloquée !')}</Text>
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
                    ? <ExpoImage source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', height: 50 }}>
              <Icon name="tag" size={16} color={LMX.ink70} />
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder={t('Code promo ou bon')}
                placeholderTextColor={LMX.ink50}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={onApplyCoupon}
                style={{ flex: 1, fontSize: 13, color: LMX.ink, fontFamily: sans(500), padding: 0 }}
              />
              <Pressable onPress={onApplyCoupon} disabled={couponBusy} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: LMX.brand }}>
                <Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 12.5 }}>{couponBusy ? '...' : t('Appliquer')}</Text>
              </Pressable>
            </View>
            {cart.coupons.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {cart.coupons.map(c => (
                  <Pressable key={c} onPress={() => removeCoupon(c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.emeraldSoft, borderRadius: 999, paddingLeft: 12, paddingRight: 8, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.emerald, textTransform: 'uppercase' }}>{c}</Text>
                    <Icon name="close" size={12} color={LMX.emerald} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <SummaryRow label={t('Sous-total')} value={cart.subtotal} />
            {cart.discount_total > 0 && <SummaryRow label={t('Réduction')} value={-cart.discount_total} accent />}
            <SummaryRow label={t('Livraison (Conakry)')} value={remaining > 0 ? delivery : 0} />
            <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Total')}</Text>
              <Price value={cart.total + (remaining > 0 ? delivery : 0)} size="lg" />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────

// Online/card payment (Visa/Mastercard, mobile money via the web gateway) is OFF in this
// version — only Cash on Delivery and the Loomodex Wallet are offered. Flip to true once
// the online gateway (CinetPay / Stripe) is live to bring card + the international flow back.
const ONLINE_PAYMENT_ENABLED = false;

const PAYMENT_METHODS = [
  { id: 'card',   title: 'Carte bancaire',          sub: 'Visa · Mastercard · paiement sécurisé', icon: 'card'  as const },
  { id: 'wallet', title: 'Portefeuille Loomodex',   sub: 'Payer avec votre solde',                 icon: 'wallet' as const },
  { id: 'cod',    title: 'Paiement à la livraison', sub: 'Payez à la réception, après inspection', icon: 'money' as const, badge: 'Recommandé' },
];

export function ScreenCheckout() {
  const nav = useNavigation<any>();
  const { user, isLoggedIn } = useAuth();
  const { cart, clearCart, applyCoupon, removeCoupon, isGuest } = useCart();
  const [coupon, setCoupon]         = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  // Billing
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName]   = useState(user?.last_name ?? '');
  const [phone, setPhone]         = useState(toE164(user?.phone));
  const [whatsapp, setWhatsapp]   = useState(toE164(user?.phone));
  // Guests have no account email — collect it (optional) for the receipt + account offer
  const [email, setEmail]         = useState(user?.email ?? '');
  // Recipient — the person who actually receives the parcel. Customers here often
  // order for family/friends, so this is frequently not the buyer. Defaults to "same".
  const [recipientSame, setRecipientSame]   = useState(true);
  const [recipientPhone, setRecipientPhone] = useState('');
  // Delivery
  const [zoneKey, setZoneKey]         = useState('');
  const [communeKey, setCommuneKey]   = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [subsector, setSubsector]     = useState('');
  const [landmark, setLandmark]       = useState('');
  const [notes, setNotes]             = useState('');
  const [express, setExpress]         = useState(false);
  // Live server quote (the fee is never computed on the device)
  const [quote, setQuote]               = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError]     = useState<string | null>(null);
  const [quoteNonce, setQuoteNonce]     = useState(0);
  const quoteReq = useRef(0);
  const [pricingMode, setPricingMode]   = useState<'zone' | 'distance'>('zone');
  // Misc
  // Without online payment there's no "pay online from abroad" path, so skip the region
  // step entirely and treat everyone as the local (Guinea, COD + wallet) flow.
  const [region, setRegion] = useState<'guinea' | 'international' | null>(ONLINE_PAYMENT_ENABLED ? null : 'guinea');
  const [payMethod, setPayMethod] = useState('cod');
  const [zones, setZones]         = useState<DeliveryZone[]>([]);
  const [placing, setPlacing]     = useState(false);
  const [payUrl, setPayUrl]       = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<{ id: number; number: string } | null>(null);
  // Exact location pinned on the map (optional)
  const [pickedLoc, setPickedLoc] = useState<LatLng | null>(null);
  const [mapsKey, setMapsKey]     = useState('');

  useEffect(() => {
    checkoutApi.zones()
      .then(d => { setZones(d.zones ?? []); setPricingMode(d.pricing_mode ?? 'zone'); })
      .catch(() => {});
    configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {});
  }, []);

  // Prefill from the customer's last checkout (like the website remembers)
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    profileApi.checkout().then(d => {
      if (!alive || !d) return;
      if (d.first_name)   setFirstName(p => p || d.first_name);
      if (d.last_name)    setLastName(p => p || d.last_name);
      if (d.phone)        setPhone(p => p || toE164(d.phone));
      if (d.whatsapp)     setWhatsapp(p => p || toE164(d.whatsapp));
      else if (d.phone)   setWhatsapp(p => p || toE164(d.phone));
      if (d.zone)         setZoneKey(p => p || d.zone);
      if (d.commune)      setCommuneKey(p => p || d.commune);
      if (d.neighborhood) setNeighborhood(p => p || d.neighborhood);
      if (d.landmark)     setLandmark(p => p || d.landmark);
    }).catch(() => {});
    return () => { alive = false; };
  }, [isLoggedIn]);

  const zone     = zones.find(z => z.key === zoneKey);
  const communes = zone?.communes ?? [];
  const commune  = communes.find(c => c.key === communeKey);
  const hoods    = commune?.neighborhoods ?? [];
  const subsectors = commune?.areas?.find(a => a.name === neighborhood)?.subsectors ?? [];
  const expressOption = quote?.express_option?.enabled ? quote.express_option : null;
  const addressReady = !!zoneKey && !!communeKey && !!neighborhood;
  const delivery = quote?.total ?? 0;
  const subtotal = cart.subtotal;
  const total    = subtotal + delivery - (cart.discount_total || 0);
  const itemsKey = cart.items.map(i => `${i.product_id}x${i.qty}`).join(',');

  // Debounced live quote whenever the address, pin, cart or express choice changes
  useEffect(() => {
    if (!addressReady || cart.items.length === 0) {
      quoteReq.current++;
      setQuote(null); setQuoteError(null); setQuoteLoading(false);
      return;
    }
    const id = ++quoteReq.current;
    setQuoteLoading(true);
    setQuoteError(null);
    const timer = setTimeout(() => {
      checkoutApi.quote({
        items: cart.items.map(i => ({ product_id: i.product_id, qty: i.qty })),
        zone: zoneKey, commune: communeKey, neighborhood,
        ...(subsector ? { subsector } : {}),
        ...(pickedLoc ? { dest_lat: pickedLoc.lat, dest_lng: pickedLoc.lng } : {}),
        express,
      })
        .then(q => { if (id === quoteReq.current) { setQuote(q); setQuoteError(null); } })
        .catch(e => { if (id === quoteReq.current) { setQuote(null); setQuoteError(friendlyError(e, t('Impossible de calculer les frais de livraison.'))); } })
        .finally(() => { if (id === quoteReq.current) setQuoteLoading(false); });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressReady, zoneKey, communeKey, neighborhood, subsector, pickedLoc?.lat, pickedLoc?.lng, express, itemsKey, quoteNonce]);

  // Express no longer offered for this quote: drop the choice
  useEffect(() => {
    if (quote && !quote.express_option?.enabled && express) setExpress(false);
  }, [quote, express]);

  const quoteBlocking = addressReady && cart.items.length > 0 && (quoteLoading || (!quote && !quoteError));
  const walletBalance = user?.wallet ?? 0;
  // Wallet is account-only — guests can't use it
  const paymentMethods = PAYMENT_METHODS.filter(m => {
    if (m.id === 'card' && !ONLINE_PAYMENT_ENABLED) return false; // card/online hidden this version
    if (m.id === 'wallet' && isGuest) return false;               // wallet is account-only
    return true;
  });

  // Auto-pick the only commune in a zone; reset dependents on change
  const onZoneChange = (key: string) => {
    setZoneKey(key);
    const z = zones.find(zz => zz.key === key);
    setCommuneKey(z && z.communes.length === 1 ? z.communes[0].key : '');
    setNeighborhood('');
    setSubsector('');
  };
  const onCommuneChange = (key: string) => { setCommuneKey(key); setNeighborhood(''); setSubsector(''); };
  const onHoodChange = (name: string) => { setNeighborhood(name); setSubsector(''); };

  const placeOrder = async () => {
    // Guests are allowed — no login gate. Order goes through the guest endpoint.
    if (cart.items.length === 0) { Alert.alert(t('Panier vide')); return; }
    if (quoteBlocking) return;
    if (!region) { Alert.alert(t('Localisation requise'), t("Indiquez si vous êtes en Guinée ou à l'étranger.")); return; }
    const missing =
      !firstName.trim() ? 'le prénom' :
      !phone.trim()     ? 'le téléphone' :
      (!recipientSame && !recipientPhone.trim()) ? 'le téléphone du destinataire' :
      !zoneKey          ? 'la zone de livraison' :
      !communeKey       ? 'la commune' :
      !neighborhood     ? 'le quartier' :
      !landmark.trim()  ? 'le point de repère' : '';
    if (missing) { Alert.alert(t('Champ requis'), t('Veuillez renseigner {field}.', { field: t(missing) })); return; }

    setPlacing(true);
    try {
      const billing = {
        first_name: firstName, last_name: lastName, email: (email || user?.email || '').trim(),
        phone, whatsapp, zone: zoneKey, commune: communeKey,
        commune_name: commune?.label ?? '', neighborhood, landmark,
        recipient_same: recipientSame,
        recipient_phone: recipientSame ? phone : recipientPhone.trim(),
      };
      const locParams = {
        ...(pickedLoc ? { dest_lat: pickedLoc.lat, dest_lng: pickedLoc.lng } : {}),
        ...(subsector ? { subsector } : {}),
        express: !!(express && expressOption),
      };

      let res;
      if (isGuest) {
        // Guest order — send the local cart items (with any variation) directly
        const guestItems = cart.items.map(i => ({
          product_id: i.product_id, qty: i.qty,
          ...(i.variation_id ? { variation_id: i.variation_id, variation: i.variation ?? {} } : {}),
        }));
        res = await ordersApi.createGuest({
          items: guestItems, billing: { ...billing, region }, payment_method: payMethod, notes, region, ...locParams,
        });
      } else {
        const orderItems = cart.items.map(i => ({ product_id: i.product_id, qty: i.qty }));
        res = await ordersApi.create({
          items: orderItems, billing: { ...billing, region }, payment_method: payMethod, notes, region, ...locParams,
        });
      }

      await clearCart();
      if (res.pay_url) {
        // Card / online payment — complete via the website gateway in a WebView
        setPaidOrder({ id: res.order.id, number: res.order.number });
        setPayUrl(res.pay_url);
      } else {
        nav.navigate('OrderSuccess', { orderId: res.order.id, orderNumber: res.order.number, guestEmail: isGuest ? billing.email : '' });
      }
    } catch (e: any) {
      Alert.alert(t('Erreur'), friendlyError(e, t('Impossible de passer la commande. Réessayez.')));
    } finally {
      setPlacing(false);
    }
  };

  // Card payment WebView (website Stripe gateway)
  if (payUrl) {
    return (
      <Screen scroll={false} padTop={false}>
        <AppBar left={<IconBtn icon="close" onPress={() => { setPayUrl(null); nav.navigate(isGuest ? 'Main' : 'OrdersList'); }} />} title={t('Paiement sécurisé')} />
        <WebView
          source={{ uri: payUrl }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          renderLoading={() => <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>}
          onNavigationStateChange={(s) => {
            if (s?.url?.includes('order-received')) {
              setPayUrl(null);
              nav.navigate('OrderSuccess', { orderId: paidOrder?.id, orderNumber: paidOrder?.number, guestEmail: isGuest ? (email || '') : '' });
            }
          }}
          style={{ flex: 1 }}
        />
      </Screen>
    );
  }

  return (
    <Screen footer={
      <Button full variant="accent" size="lg" onPress={placeOrder} disabled={placing || !region || quoteBlocking}>
        {placing
          ? <ActivityIndicator color="#fff" />
          : region && quoteBlocking
            ? <Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 15 }}>{t('Calcul des frais…')}</Text>
          : !region
            ? <Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 15 }}>{t('Choisissez votre localisation')}</Text>
            : <><Icon name="shield" size={16} color="#fff" /><Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 15 }}>{' ' + t('Commander · {amount} GNF', { amount: gnfShort(total) })}</Text></>
        }
      </Button>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commander')} />

      {/* Region selector — only relevant when online payment is available */}
      {ONLINE_PAYMENT_ENABLED && (
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Où êtes-vous ?')}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([
            { id: 'guinea',        icon: '🇬🇳', title: t('Je suis en Guinée'),     sub: t('Payez les frais de livraison pour réserver le livreur — produit payé à la livraison.') },
            { id: 'international',  icon: '🌍', title: t("Je suis à l'étranger"),  sub: t('Pour un proche en Guinée — payez le montant total en ligne.') },
          ] as const).map(r => {
            const active = region === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => { setRegion(r.id); if (r.id === 'international') setPayMethod('card'); }}
                style={{ flex: 1, borderRadius: LMX.r.lg, borderWidth: 2, borderColor: active ? LMX.brand : LMX.border, backgroundColor: active ? LMX.brandSoft : LMX.surface, padding: 12 }}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</Text>
                <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>{r.title}</Text>
                <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 3, lineHeight: 14 }}>{r.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      )}

      {region && (<>

      {/* Billing details */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Coordonnées')}</Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label={t('Prénom *')} value={firstName} onChangeText={setFirstName} /></View>
            <View style={{ flex: 1 }}><Field label={t('Nom')} value={lastName} onChangeText={setLastName} /></View>
          </View>
          <PhoneInput label={t('Numéro de téléphone *')} value={phone} onChange={setPhone} />
          <PhoneInput label={t('Numéro WhatsApp')} value={whatsapp} onChange={setWhatsapp} />
          {isGuest && (
            <Field label={t('Email (optionnel — pour le lien de suivi)')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          )}
        </View>
      </View>

      {/* Recipient — often a relative or friend rather than the buyer */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Destinataire')}</Text>
        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => setRecipientSame(v => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 }}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
              borderColor: recipientSame ? LMX.brand : LMX.border,
              backgroundColor: recipientSame ? LMX.brand : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {recipientSame && <Icon name="check" size={13} color="#fff" />}
            </View>
            <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70, fontFamily: sans(500) }}>
              {t('Le destinataire est la même personne que le client')}
            </Text>
          </Pressable>

          {!recipientSame && (
            <PhoneInput
              label={t('Téléphone du destinataire *')}
              value={recipientPhone}
              onChange={setRecipientPhone}
            />
          )}

          <Text style={{ fontSize: 11, color: LMX.ink50, lineHeight: 15 }}>
            {recipientSame
              ? t('Le livreur vous appellera sur votre numéro et le code de livraison vous sera envoyé.')
              : t('Ce numéro sera utilisé pour les appels du livreur, le code de livraison (OTP) et la demande de position.')}
          </Text>
        </View>
      </View>

      {/* Delivery details */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Livraison')}</Text>
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{t('Pays / Région')}</Text>
            <View style={{ height: 54, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, justifyContent: 'center', paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 14.5, fontFamily: sans(500), color: LMX.ink }}>{t('Guinée')}</Text>
            </View>
          </View>
          <Picker
            label={t('Zone de livraison')} required value={zoneKey} onChange={onZoneChange}
            placeholder={t('Sélectionner une zone')}
            options={zones.map(z => ({ value: z.key, label: pricingMode === 'distance' ? z.label : `${z.label} — ${fr(z.price)} GNF` }))}
          />
          <Picker
            label={t('Commune')} required value={communeKey} onChange={onCommuneChange}
            placeholder={zoneKey ? t('Sélectionner une commune') : t('Choisissez d’abord une zone')}
            disabled={!zoneKey}
            options={communes.map(c => ({ value: c.key, label: c.label }))}
          />
          <Picker
            label={t('Quartier')} required value={neighborhood} onChange={onHoodChange}
            placeholder={communeKey ? t('Sélectionner un quartier') : t('Choisissez d’abord une commune')}
            disabled={!communeKey}
            options={hoods.map(h => ({ value: h, label: h }))}
          />
          {subsectors.length > 0 && (
            <Picker
              label={t('Sous-secteur (optionnel)')} value={subsector} onChange={setSubsector}
              placeholder={t('Sélectionner un sous-secteur')}
              options={[{ value: '', label: t('Aucun / je ne sais pas') }, ...subsectors.map(ss => ({ value: ss.key, label: ss.name }))]}
            />
          )}
          <Field label={t('Point de repère *')} value={landmark} onChangeText={setLandmark} placeholder={t('Près de la mosquée, portail bleu…')} />
          {mapsKey ? (
            <View>
              <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>
                {t('Position exacte')} <Text style={{ color: LMX.ink50 }}>{t('(optionnel)')}</Text>
              </Text>
              <LocationPicker mapsKey={mapsKey} value={pickedLoc} onChange={setPickedLoc} />
            </View>
          ) : null}
          {expressOption && (
            <Pressable
              onPress={() => setExpress(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: LMX.r.lg, borderWidth: express ? 2 : 1, borderColor: express ? LMX.brand : LMX.border, backgroundColor: express ? LMX.brandSoft : LMX.surface }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="flame" size={18} color={LMX.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontFamily: sans(600), color: LMX.ink }}>{t('Livraison express')}</Text>
                <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{t('+ {amount} GNF · livraison prioritaire', { amount: fr(expressOption.fee) })}</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: express ? LMX.brand : LMX.border, backgroundColor: express ? LMX.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {express && <Icon name="check" size={13} color="#fff" />}
              </View>
            </Pressable>
          )}
          {addressReady && (
            <View>
              <FeeBreakdown
                quote={quote}
                loading={quoteLoading}
                error={quoteError}
                onRetry={() => setQuoteNonce(n => n + 1)}
              />
              {!quote && !!quoteError && !quoteLoading && (
                <Notice text={t('Frais à confirmer par le service client. Vous pouvez tout de même commander.')} />
              )}
            </View>
          )}
          <Field label={t('Notes de commande (optionnel)')} value={notes} onChangeText={setNotes} placeholder={t('Instructions spéciales pour la livraison')} />
        </View>
      </View>

      {/* Payment methods */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Mode de paiement')}</Text>
        <View style={{ gap: 10 }}>
          {(region === 'international' ? paymentMethods.filter(m => m.id === 'card') : paymentMethods).map(m => (
            <Pressable key={m.id} onPress={() => setPayMethod(m.id)}>
              <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: payMethod === m.id ? 2 : 1, borderColor: payMethod === m.id ? LMX.brand : LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} size={20} color={LMX.ink} /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{t(m.title)}</Text>
                    {m.badge && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LMX.emerald }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff' }}>{t(m.badge)}</Text></View>}
                  </View>
                  <Text style={{ fontSize: 11.5, color: m.id === 'wallet' && walletBalance < total ? LMX.rose : LMX.ink50, marginTop: 2 }}>
                    {m.id === 'wallet' ? t('Solde : {amount} GNF', { amount: fr(walletBalance) }) + (total > 0 && walletBalance < total ? ' · ' + t('insuffisant') : '') : t(m.sub)}
                  </Text>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: payMethod === m.id ? LMX.brand : LMX.border, backgroundColor: payMethod === m.id ? LMX.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {payMethod === m.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Trust lines — adapt to the chosen flow */}
        <View style={{ marginTop: 12, gap: 7 }}>
          {(region === 'international'
            ? [
                'Paiement complet sécurisé en ligne (produit + livraison)',
                'Carte Visa / Mastercard acceptée',
                'Livraison à l\'adresse du destinataire en Guinée',
                'Suivi de commande en temps réel',
              ]
            : [
                'Payez uniquement les frais de livraison pour réserver votre livreur',
                'Inspectez votre produit avant de payer',
                'Livraison rapide à Conakry (3h–48h)',
                'Livraison sécurisée vérifiée par OTP',
              ]
          ).map(line => (
            <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Icon name="checkCircle" size={14} color={LMX.emerald} />
              <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>{t(line)}</Text>
            </View>
          ))}
        </View>

        {/* Accepted payment methods — only what the app actually supports */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>{t('Paiements acceptés')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[
              'Paiement à la livraison',
              'Portefeuille Loomodex',
              ...(ONLINE_PAYMENT_ENABLED ? ['Carte bancaire'] : []),
            ].map(m => (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: LMX.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 9, paddingVertical: 6 }}>
                <Icon name={m === 'Portefeuille Loomodex' ? 'wallet' : m === 'Carte bancaire' ? 'card' : 'money'} size={12} color={LMX.ink50} />
                <Text style={{ fontSize: 11, fontFamily: sans(500), color: LMX.ink70 }}>{t(m)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Coupon — kept last, directly above the order summary, so the customer
          completes their details and delivery address before hunting for a code.
          Hidden for guests: coupons need server-side cart validation (account only). */}
      {!isGuest && (
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Code promo')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', paddingLeft: 14, paddingRight: 6, height: 52 }}>
          <Icon name="tag" size={16} color={LMX.ink70} />
          <TextInput
            value={coupon}
            onChangeText={setCoupon}
            placeholder={t('Entrez un code promo')}
            placeholderTextColor={LMX.ink50}
            autoCapitalize="characters"
            style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(500), padding: 0 }}
          />
          <Pressable
            onPress={async () => {
              if (!coupon.trim()) return;
              setCouponBusy(true);
              try { await applyCoupon(coupon.trim()); setCoupon(''); }
              catch (e: any) { Alert.alert(t('Code promo'), friendlyError(e, t('Code invalide.'))); }
              finally { setCouponBusy(false); }
            }}
            disabled={couponBusy}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: LMX.brand }}
          >
            <Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 12.5 }}>{couponBusy ? '...' : t('Appliquer')}</Text>
          </Pressable>
        </View>
        {cart.coupons.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {cart.coupons.map(c => (
              <Pressable key={c} onPress={() => removeCoupon(c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.emeraldSoft, borderRadius: 999, paddingLeft: 12, paddingRight: 8, paddingVertical: 6 }}>
                <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.emerald, textTransform: 'uppercase' }}>{c}</Text>
                <Icon name="close" size={12} color={LMX.emerald} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
      )}

      {/* Order summary */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>{t('Votre commande')}</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
          {cart.items.map(item => (
            <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>{decodeEntities(item.name)} <Text style={{ color: LMX.ink50 }}>× {item.qty}</Text></Text>
              <Text style={{ fontFamily: mono(600), fontSize: 12.5 }}>{fr(item.line_total)} <Text style={{ fontSize: 9, color: LMX.ink50 }}>GNF</Text></Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: LMX.hairline, marginTop: 8, paddingTop: 10 }}>
            <SummaryRow label={t('Sous-total')} value={subtotal} />
            {quote
              ? <SummaryRow label={zone ? t('Livraison · {zone}', { zone: zone.label }) : t('Livraison')} value={delivery} />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, color: LMX.ink70 }}>{t('Livraison')}</Text>
                  <Text style={{ fontSize: 12, color: quoteError ? LMX.amber : LMX.ink50, fontFamily: sans(500) }}>
                    {quoteLoading ? t('Calcul…') : quoteError ? t('Frais à confirmer par le service client') : '—'}
                  </Text>
                </View>
              )}
            {cart.discount_total > 0 && <SummaryRow label={t('Réduction')} value={-cart.discount_total} accent />}
            <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Total')}</Text>
              <Price value={total} size="md" />
            </View>
          </View>
        </View>
      </View>

      </>)}
    </Screen>
  );
}
