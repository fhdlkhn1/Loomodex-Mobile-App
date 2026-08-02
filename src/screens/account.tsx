import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Discount, ProductCard, SettingRow, Field, Toggle, MapVisual, Chip } from '../components';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { profileApi } from '../api/profile';
import { Product as ApiProduct } from '../api/products';

// Map an API product to the shape ProductCard expects
function apiToCard(p: ApiProduct) {
  return {
    id: String(p.id), name: p.name, slug: p.slug, price: p.price,
    was: p.regular_price > p.price ? p.regular_price : null, off: p.off,
    cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image,
  };
}

// ── Wishlist (Saved collections) ───────────────────────────────
function CollectionCard({ label, count, slug, bg, active }: { label: string; count: number; slug?: string; bg?: string; active?: boolean }) {
  return (
    <View style={{ width: 132, borderRadius: 14, overflow: 'hidden', backgroundColor: bg || LMX.surface, borderWidth: active ? 1.5 : 1, borderColor: active ? LMX.ink : LMX.border, padding: 10 }}>
      {slug ? (
        <Image source={{ uri: IMG(slug) }} style={{ height: 78, borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <View style={{ height: 78, borderRadius: 8, backgroundColor: LMX.surfaceAlt, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name="heart" size={22} color={LMX.ink} /></View>
      )}
      <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{label}</Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink70, marginTop: 2 }}>{count} items</Text>
    </View>
  );
}

export function ScreenWishlist() {
  const nav = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const [items, setItems]   = useState<ApiProduct[]>([]);
  const [loading, setLoad]  = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn) { setLoad(false); return; }
    try {
      const { products } = await profileApi.getWishlist();
      setItems(products ?? []);
    } catch {}
    finally { setLoad(false); }
  }, [isLoggedIn]);

  // Refresh whenever the screen regains focus (so toggles elsewhere reflect)
  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`Liste de souhaits · ${items.length}`} right={<View style={{ width: 38 }} />} />

      {!isLoggedIn ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="heart" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 16, fontFamily: sans(600), textAlign: 'center' }}>Connectez-vous pour voir vos favoris</Text>
          <Button variant="accent" onPress={() => nav.navigate('SignIn')}>Se connecter</Button>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="heart" size={42} color={LMX.ink30} strokeWidth={1.4} /></View>
          <Text style={{ fontFamily: FONT.display, fontSize: 24, textAlign: 'center' }}>Votre liste est vide</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, lineHeight: 20, textAlign: 'center', maxWidth: 260 }}>Touchez le cœur sur un produit pour l'enregistrer ici.</Text>
          <Button variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Main')}>Découvrir des produits</Button>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {items.map(p => (
            <View key={p.id} style={{ width: '47.5%' }}>
              <ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

// ── Liste de souhaits (FR) — detailed live list ────────────────
export function ScreenListeSouhaits() {
  const nav = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems]  = useState<ApiProduct[]>([]);
  const [loading, setLoad] = useState(true);
  const [busyId, setBusy]  = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) { setLoad(false); return; }
    try {
      const { products } = await profileApi.getWishlist();
      setItems(products ?? []);
    } catch {}
    finally { setLoad(false); }
  }, [isLoggedIn]);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const remove = async (id: number) => {
    setItems(prev => prev.filter(p => p.id !== id)); // optimistic
    try { await profileApi.toggleWishlist(id); } catch { load(); }
  };

  const add = async (p: ApiProduct) => {
    setBusy(p.id);
    try {
      await addToCart(p.id, 1);
      Alert.alert('Ajouté !', `${p.name} ajouté au panier.`);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'ajouter au panier.");
    } finally { setBusy(null); }
  };

  if (!isLoggedIn) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Liste de souhaits" right={<View style={{ width: 38 }} />} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Icon name="heart" size={48} color={LMX.ink30} />
          <Text style={{ fontSize: 16, fontFamily: sans(600), textAlign: 'center' }}>Connectez-vous pour voir vos favoris</Text>
          <Button variant="accent" onPress={() => nav.navigate('SignIn')}>Se connecter</Button>
        </View>
      </Screen>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Liste de souhaits" right={<View style={{ width: 38 }} />} />
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}><Icon name="heart" size={42} color={LMX.ink30} strokeWidth={1.4} /></View>
          <Text style={{ fontFamily: FONT.display, fontSize: 26, textAlign: 'center', color: LMX.ink }}>Votre liste de souhaits est vide</Text>
          <Text style={{ marginTop: 12, fontSize: 13.5, color: LMX.ink70, lineHeight: 20, textAlign: 'center', maxWidth: 260 }}>Touchez le cœur sur un produit pour l'enregistrer ici et le retrouver plus tard.</Text>
          <View style={{ marginTop: 24 }}><Button variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Main')}>Découvrir des produits</Button></View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Liste de souhaits" right={<IconBtn icon="share" />} />
      {loading ? (
        <View style={{ paddingTop: 60 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Text style={{ fontSize: 12.5, color: LMX.ink70 }}><Text style={{ color: LMX.ink, fontFamily: sans(600) }}>{items.length} article{items.length !== 1 ? 's' : ''}</Text> enregistré{items.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {items.map(p => {
              const stock = p.in_stock;
              const was = p.regular_price > p.price ? p.regular_price : null;
              return (
                <View key={p.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border, flexDirection: 'row' }}>
                  <Pressable onPress={() => nav.navigate('ProductDetail', { productId: p.id })} style={{ width: 116, backgroundColor: LMX.surfaceAlt }}>
                    <Image source={{ uri: p.image || IMG(p.slug) }} style={{ width: '100%', height: '100%' }} />
                    {p.off > 0 && <View style={{ position: 'absolute', top: 8, left: 8 }}><Discount off={p.off} /></View>}
                  </Pressable>
                  <View style={{ flex: 1, padding: 12, paddingLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <Pressable style={{ flex: 1 }} onPress={() => nav.navigate('ProductDetail', { productId: p.id })}>
                        <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', marginBottom: 3 }}>{p.seller}</Text>
                        <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: sans(600), lineHeight: 17 }}>{p.name}</Text>
                      </Pressable>
                      <Pressable onPress={() => remove(p.id)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="heart" size={16} color={LMX.rose} /></Pressable>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stock ? LMX.emerald : LMX.ink30 }} />
                        <Text style={{ fontSize: 11, fontFamily: sans(600), color: stock ? LMX.emerald : LMX.ink50 }}>{stock ? 'En stock' : 'Rupture de stock'}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Price value={p.price} was={was} size="md" />
                      <Pressable onPress={() => stock && add(p)} disabled={!stock || busyId === p.id} style={{ height: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: stock ? LMX.ink : LMX.surfaceAlt, borderWidth: stock ? 0 : 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: busyId === p.id ? 0.6 : 1 }}>
                        <Icon name="bag" size={14} color={stock ? '#fff' : LMX.ink50} />
                        <Text style={{ fontSize: 12, fontFamily: sans(600), color: stock ? '#fff' : LMX.ink50 }}>{stock ? 'Ajouter' : "M'avertir"}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

// ── Account hub ────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: LMX.surface, padding: 14 }}>
      <Text style={{ fontFamily: mono(600), fontSize: 19 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
    </View>
  );
}

function OrderTab({ icon, label, count, dot }: { icon: any; label: string; count: number; dot?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12 }}>
      <View>
        <Icon name={icon} size={20} color={LMX.ink} />
        {count > 0 && (
          <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: dot ? LMX.accent : LMX.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 9.5, fontFamily: mono(700) }}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 10.5, fontFamily: sans(500), color: LMX.ink70 }}>{label}</Text>
    </View>
  );
}

export function ScreenAccount() {
  const nav = useNavigation<any>();
  const { user, isLoggedIn, logout, isVendor, isDriver, isLogistics, isSupport, isAdmin } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<{ orders: number; wishlist: number; reviews: number } | null>(null);

  useFocusEffect(useCallback(() => {
    if (!isLoggedIn) { setStats(null); return; }
    let alive = true;
    profileApi.stats().then(s => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [isLoggedIn]));

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          nav.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        }
      }
    ]);
  };

  // Not logged in — show login prompt
  if (!isLoggedIn) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="user" size={36} color={LMX.ink30} />
          </View>
          <Text style={{ fontFamily: FONT.display, fontSize: 26, color: LMX.ink, textAlign: 'center' }}>Connectez-vous</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center', marginTop: 10, lineHeight: 20 }}>
            Connectez-vous pour suivre vos commandes, gérer votre compte et bien plus.
          </Text>
          <View style={{ marginTop: 24, gap: 12, width: '100%' }}>
            <Button full variant="accent" size="lg" onPress={() => nav.navigate('SignIn')}>Se connecter</Button>
            <Button full variant="ghost" size="lg" onPress={() => nav.navigate('SignUp')}>Créer un compte</Button>
          </View>
        </View>
      </Screen>
    );
  }

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.username || 'Utilisateur';
  const walletDisplay = `${Math.round(user?.wallet ?? 0).toLocaleString('fr-FR')} GNF`;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <ExpoImage source={require('../../assets/logo.png')} style={{ width: 134, height: 30 }} contentFit="contain" />
          <View style={{ flexDirection: 'row' }}>
            <IconBtn icon="settings" onPress={() => nav.navigate('AccountDetails')} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient colors={['#FF7A00', '#1E6BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              : <Text style={{ fontFamily: FONT.display, fontSize: 24, color: '#fff' }}>{initials}</Text>
            }
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 20, color: LMX.ink }}>{fullName}</Text>
            <Text style={{ fontSize: 12, color: LMX.ink50, marginTop: 3, fontFamily: mono(400) }}>{user?.email}</Text>
            {user?.phone ? <Text style={{ fontSize: 11.5, color: LMX.ink50, fontFamily: mono(400) }}>{user.phone}</Text> : null}
          </View>
          <Pressable onPress={() => nav.navigate('AccountDetails')} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface }}>
            <Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>Modifier</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 1, marginTop: 18, backgroundColor: LMX.hairline, borderRadius: 14, overflow: 'hidden' }}>
          <Stat label="Commandes" value={stats ? String(stats.orders) : '—'} />
          <Stat label="Favoris" value={stats ? String(stats.wishlist) : '—'} />
          <Stat label="Avis" value={stats ? String(stats.reviews) : '—'} />
        </View>
      </View>

      {/* Settings */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <SettingRow icon="pin"         label="Adresses"         sub="Gérer mes adresses"     onPress={() => nav.navigate('Addresses')} />
          <SettingRow icon="wallet"      label="Mon portefeuille"  sub={walletDisplay}          onPress={() => nav.navigate('Wallet')} />
          <SettingRow icon="package"     label="Suivre une commande"                            onPress={() => nav.navigate('TrackEntry')} />
          <SettingRow icon="headset"     label="Aide"                                           onPress={() => nav.navigate('Help')} last />
        </View>
      </View>

      {/* Business tools — each row gated to the matching role */}
      {(isVendor || isDriver || isLogistics || isSupport || isAdmin) && (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Outils professionnels</Text>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
            {(isVendor || isAdmin)    && <SettingRow icon="chart"  label="Tableau de bord vendeur"  sub="Ventes, commandes, produits" onPress={() => nav.navigate('Seller')} />}
            {(isDriver || isAdmin)    && <SettingRow icon="bike"   label="Tableau de bord livreur"  sub="Mes livraisons assignées"   onPress={() => nav.navigate('Driver')} />}
            {(isSupport || isAdmin)   && <SettingRow icon="headset" label="Support client"          sub="Confirmer / rejeter commandes" onPress={() => nav.navigate('CS')} />}
            {(isLogistics || isAdmin) && <SettingRow icon="truck"  label="Opérations logistique"   sub="Assigner les livreurs"       onPress={() => nav.navigate('Logistics')} last />}
          </View>
        </View>
      )}

      {/* Logout */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.rose + '44', backgroundColor: '#FFF5F5' }}>
          {loggingOut
            ? <ActivityIndicator color={LMX.rose} />
            : <>
                <Icon name="arrowU" size={16} color={LMX.rose} />
                <Text style={{ fontSize: 14, fontFamily: sans(600), color: LMX.rose }}>Déconnexion</Text>
              </>
          }
        </Pressable>
      </View>

      {/* Delete account (App Store requirement) — customers & vendors only */}
      {!isDriver && !isLogistics && !isSupport && !isAdmin && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}>
          <Pressable
            onPress={() => Alert.alert(
              'Supprimer le compte',
              'Cette action est définitive : votre compte et vos informations seront supprimés. Vos commandes passées sont conservées de façon anonyme. Continuer ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer définitivement', style: 'destructive',
                  onPress: async () => {
                    try {
                      await profileApi.deleteAccount();
                      await logout();
                      nav.reset({ index: 0, routes: [{ name: 'SignIn' }] });
                    } catch (e: any) {
                      Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
                    }
                  },
                },
              ]
            )}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 12.5, color: LMX.ink50, textDecorationLine: 'underline' }}>Supprimer mon compte</Text>
          </Pressable>
        </View>
      )}

      {/* Accepted payments + about (app-appropriate "footer") */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Paiements acceptés</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {[
            { label: 'Paiement à la livraison', icon: 'money' as const },
            { label: 'Portefeuille Loomodex',   icon: 'wallet' as const },
          ].map(m => (
            <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: LMX.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 9, paddingVertical: 6 }}>
              <Icon name={m.icon} size={12} color={LMX.ink50} />
              <Text style={{ fontSize: 11, fontFamily: sans(500), color: LMX.ink70 }}>{m.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 11.5, color: LMX.ink50, textAlign: 'center' }}>Loomodex · Marketplace de Guinée</Text>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, textAlign: 'center', marginTop: 2, opacity: 0.7 }}>Version 1.0.0</Text>
      </View>
    </Screen>
  );
}

// ── Account details ────────────────────────────────────────────
export function ScreenAccountDetails() {
  const nav = useNavigation<any>();
  const { user, setUser, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName]   = useState(user?.last_name ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [saving, setSaving]       = useState(false);

  // Inline change-password
  const [showPw, setShowPw]   = useState(false);
  const [curPw, setCurPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [pwBusy, setPwBusy]   = useState(false);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || '?';

  const save = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.update({ first_name: firstName, last_name: lastName, billing_phone: phone });
      setUser(updated);
      Alert.alert('Enregistré', 'Vos informations ont été mises à jour.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.');
    } finally { setSaving(false); refreshUser(); }
  };

  const changePassword = async () => {
    if (newPw.length < 6) { Alert.alert('Trop court', 'Le nouveau mot de passe doit faire au moins 6 caractères.'); return; }
    setPwBusy(true);
    try {
      await profileApi.changePassword(curPw, newPw);
      setCurPw(''); setNewPw(''); setShowPw(false);
      Alert.alert('Succès', 'Mot de passe mis à jour.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Mot de passe actuel incorrect.');
    } finally { setPwBusy(false); }
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mes informations" right={<Pressable onPress={save}><Text style={{ color: LMX.accent, fontSize: 13, fontFamily: sans(600) }}>Enregistrer</Text></Pressable>} />
      <View style={{ paddingBottom: 18, alignItems: 'center' }}>
        <View>
          <LinearGradient colors={['#F37524', '#0EA5E9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={{ width: 88, height: 88, borderRadius: 44 }} />
              : <Text style={{ fontFamily: FONT.display, fontSize: 42, color: '#fff' }}>{initials}</Text>}
          </LinearGradient>
        </View>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Informations personnelles</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Prénom" value={firstName} onChangeText={setFirstName} /></View>
          <View style={{ flex: 1 }}><Field label="Nom" value={lastName} onChangeText={setLastName} /></View>
        </View>
        <Field label="Téléphone" prefix="+224" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={user?.email ?? ''} />
        <Text style={{ fontSize: 10.5, color: LMX.ink50, paddingLeft: 4 }}>L'email ne peut pas être modifié depuis l'application.</Text>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Sécurité</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <SettingRow icon="key" label="Changer le mot de passe" sub={showPw ? 'Masquer' : 'Mettre à jour votre mot de passe'} onPress={() => setShowPw(v => !v)} last={!showPw} />
          {showPw && (
            <View style={{ padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
              <Field label="Mot de passe actuel" value={curPw} onChangeText={setCurPw} secure />
              <Field label="Nouveau mot de passe" value={newPw} onChangeText={setNewPw} secure />
              <Button variant="primary" size="md" onPress={changePassword} disabled={pwBusy}>{pwBusy ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}</Button>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

// ── Addresses ──────────────────────────────────────────────────
function AddressCard({ label, name, phone, line, area, icon, primary, onPress }: any) {
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: primary ? 2 : 1, borderColor: primary ? LMX.ink : LMX.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={17} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{label}</Text>
          {primary && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LMX.ink }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase' }}>Par défaut</Text></View>}
        </View>
        <Text style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 17 }}>{name} · <Text style={{ fontFamily: mono(400), fontSize: 11.5 }}>{phone}</Text></Text>
        <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 4, lineHeight: 17 }}>{line}{'\n'}<Text style={{ color: LMX.ink50 }}>{area}</Text></Text>
      </View>
      <Pressable onPress={onPress}><Icon name="pencil" size={16} color={LMX.ink50} /></Pressable>
    </View>
  );
}

export function ScreenAddresses() {
  const nav = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const [addr, setAddr]    = useState<any | null>(null);
  const [loading, setLoad] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!isLoggedIn) { setLoad(false); return; }
    let alive = true;
    setLoad(true);
    profileApi.getAddresses()
      .then(({ addresses }) => { if (alive) setAddr(addresses?.[0] ?? null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoad(false); });
    return () => { alive = false; };
  }, [isLoggedIn]));

  const hasAddress = addr && (addr.address_1 || addr.city);

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mes adresses" right={<IconBtn icon="pencil" onPress={() => nav.navigate('AddressForm')} />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ height: 130, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
          <MapVisual />
          <View style={{ position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={12} color={LMX.brand} /><Text style={{ fontSize: 11, fontFamily: sans(600) }}>{addr?.city || 'Conakry'}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 30 }}><ActivityIndicator color={LMX.brand} /></View>
      ) : hasAddress ? (
        <View style={{ paddingHorizontal: 16 }}>
          <AddressCard
            label="Adresse de livraison"
            name={`${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim() || '—'}
            phone={addr.phone || '—'}
            line={[addr.address_1, addr.address_2].filter(Boolean).join(', ') || '—'}
            area={[addr.city, addr.country === 'GN' ? 'Guinée' : addr.country].filter(Boolean).join(', ')}
            icon="home"
            primary
            onPress={() => nav.navigate('AddressForm')}
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, alignItems: 'center', gap: 12, paddingTop: 20 }}>
          <Icon name="pin" size={40} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70, fontFamily: sans(500) }}>Aucune adresse enregistrée</Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Pressable onPress={() => nav.navigate('AddressForm')} style={{ paddingVertical: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', borderRadius: LMX.r.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name={hasAddress ? 'pencil' : 'plus'} size={16} color={LMX.ink} /><Text style={{ color: LMX.ink, fontFamily: sans(600), fontSize: 13 }}>{hasAddress ? "Modifier l'adresse" : 'Ajouter une adresse'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

// ── Add / edit address ─────────────────────────────────────────
function LabelPick({ icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <View style={{ flex: 1, paddingVertical: 12, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: active ? 2 : 1, borderColor: active ? LMX.ink : LMX.border, alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={18} color={LMX.ink} /><Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>{label}</Text>
    </View>
  );
}

export function ScreenAddressForm() {
  const nav = useNavigation<any>();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName]   = useState(user?.last_name ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [street, setStreet]       = useState('');
  const [neighborhood, setHood]   = useState('');
  const [city, setCity]           = useState('Conakry');
  const [loading, setLoad]        = useState(true);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { addresses } = await profileApi.getAddresses();
        const a = addresses?.[0];
        if (a) {
          if (a.first_name) setFirstName(a.first_name);
          if (a.last_name)  setLastName(a.last_name);
          if (a.phone)      setPhone(a.phone);
          if (a.address_1)  setStreet(a.address_1);
          if (a.address_2)  setHood(a.address_2);
          if (a.city)       setCity(a.city);
        }
      } catch {}
      finally { setLoad(false); }
    })();
  }, []);

  const save = async () => {
    if (!street.trim() || !city.trim()) { Alert.alert('Champs requis', 'Veuillez renseigner l\'adresse et la ville.'); return; }
    setSaving(true);
    try {
      await profileApi.saveAddress({
        type: 'billing',
        first_name: firstName, last_name: lastName, phone,
        address_1: street, address_2: neighborhood, city, country: 'GN',
      });
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'enregistrer l\'adresse.');
    } finally { setSaving(false); }
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving || loading}>{saving ? 'Enregistrement...' : 'Enregistrer l\'adresse'}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Adresse de livraison" right={<Pressable onPress={save}><Text style={{ color: LMX.accent, fontSize: 13, fontFamily: sans(600) }}>Enregistrer</Text></Pressable>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ height: 150, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
          <MapVisual />
          <View style={{ position: 'absolute', top: '40%', left: '50%', marginLeft: -18 }}><Icon name="pin" size={36} color={LMX.accent} strokeWidth={2.5} /></View>
          <View style={{ position: 'absolute', top: 10, left: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="location" size={12} color={LMX.brand} /><Text style={{ flex: 1, fontSize: 11, fontFamily: sans(600) }}>{neighborhood || city || 'Conakry'}</Text>
          </View>
        </View>
      </View>
      {loading ? (
        <View style={{ paddingTop: 24 }}><ActivityIndicator color={LMX.brand} /></View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Prénom" value={firstName} onChangeText={setFirstName} /></View>
            <View style={{ flex: 1 }}><Field label="Nom" value={lastName} onChangeText={setLastName} /></View>
          </View>
          <Field label="Téléphone de livraison" prefix="+224" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Adresse & bâtiment" value={street} onChangeText={setStreet} placeholder="Immeuble Niger, 4ème étage" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Quartier / commune" value={neighborhood} onChangeText={setHood} placeholder="Kaloum" /></View>
            <View style={{ flex: 1 }}><Field label="Ville" value={city} onChangeText={setCity} /></View>
          </View>
        </View>
      )}
    </Screen>
  );
}
