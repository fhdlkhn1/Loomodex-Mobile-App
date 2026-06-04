import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Discount, ProductCard, SettingRow, Field, Toggle, MapVisual, Chip } from '../components';
import { useAuth } from '../context/AuthContext';

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
  const saved = [PRODUCTS[3], PRODUCTS[6], PRODUCTS[11], PRODUCTS[14], PRODUCTS[2], PRODUCTS[10]];
  return (
    <Screen>
      <AppBar left={<View style={{ width: 38 }} />} title="Saved · 12" right={<IconBtn icon="filter" />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
        <CollectionCard label="All" count={12} active />
        <CollectionCard label="Wedding gifts" count={4} bg="#F0DAD8" slug="premium-perfume-gift-set" />
        <CollectionCard label="For Aïssa" count={5} bg="#E5DDF0" slug="womens-genuine-leather-handbag" />
        <CollectionCard label="Home setup" count={3} bg="#E7E0CF" slug="stainless-steel-kitchen-set-12-piece" />
        <View style={{ width: 84, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="plus" size={18} color={LMX.ink70} /><Text style={{ fontSize: 10.5, fontFamily: sans(500), color: LMX.ink70 }}>New list</Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Pressable onPress={() => nav.navigate('ListeSouhaits')} style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600), color: '#fff' }}>2 items just dropped in price</Text>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, marginTop: 2 }}>Save up to 21% on saved products</Text>
          </View>
          <Icon name="chevR" size={16} color="#fff" />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {saved.map(p => <View key={p.id} style={{ width: '47.5%' }}><ProductCard product={p} onPress={() => nav.navigate('ProductDetail')} /></View>)}
      </View>
    </Screen>
  );
}

// ── Liste de souhaits (FR) ─────────────────────────────────────
export function ScreenListeSouhaits({ route }: any) {
  const nav = useNavigation<any>();
  const empty = route?.params?.empty;
  const saved = [
    { p: PRODUCTS[6], stock: true },
    { p: PRODUCTS[3], stock: true },
    { p: PRODUCTS[12], stock: true },
    { p: PRODUCTS[2], stock: false },
  ];
  if (empty) {
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
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12.5, color: LMX.ink70 }}><Text style={{ color: LMX.ink, fontFamily: sans(600) }}>4 articles</Text> enregistrés</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name="bag" size={14} color={LMX.accent} /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.accent }}>Tout ajouter</Text></View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {saved.map(({ p, stock }) => (
          <View key={p.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border, flexDirection: 'row' }}>
            <View style={{ width: 116, backgroundColor: LMX.surfaceAlt }}>
              <Image source={{ uri: IMG(p.slug) }} style={{ width: '100%', height: '100%' }} />
              {p.off > 0 && <View style={{ position: 'absolute', top: 8, left: 8 }}><Discount off={p.off} /></View>}
            </View>
            <View style={{ flex: 1, padding: 12, paddingLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', marginBottom: 3 }}>{p.seller}</Text>
                  <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: sans(600), lineHeight: 17 }}>{p.name}</Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="heart" size={16} color={LMX.rose} /></View>
              </View>
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stock ? LMX.emerald : LMX.ink30 }} />
                  <Text style={{ fontSize: 11, fontFamily: sans(600), color: stock ? LMX.emerald : LMX.ink50 }}>{stock ? 'En stock' : 'Rupture de stock'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Price value={p.price} was={p.was} size="md" />
                <View style={{ height: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: stock ? LMX.ink : LMX.surfaceAlt, borderWidth: stock ? 0 : 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="bag" size={14} color={stock ? '#fff' : LMX.ink50} />
                  <Text style={{ fontSize: 12, fontFamily: sans(600), color: stock ? '#fff' : LMX.ink50 }}>{stock ? 'Ajouter' : "M'avertir"}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ backgroundColor: LMX.brandSoft, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={14} color={LMX.brandDeep} />
          <Text style={{ flex: 1, fontSize: 12, fontFamily: sans(600), color: LMX.brandDeep }}>Baisse de prix sur 1 article enregistré</Text>
          <Icon name="chevR" size={12} color={LMX.brandDeep} />
        </View>
      </View>
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
  const { user, isLoggedIn, logout, isVendor, isDriver } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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
  const walletDisplay = user?.wallet ? `${Math.round(user.wallet).toLocaleString('fr-FR')} GNF` : '0 GNF';

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 110, height: 30 }} resizeMode="contain" />
          <View style={{ flexDirection: 'row' }}>
            <IconBtn icon="bell" onPress={() => nav.navigate('Notifications')} />
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
          <Stat label="Commandes" value="—" /><Stat label="Favoris" value="—" /><Stat label="Avis" value="—" />
        </View>
      </View>

      {/* Order quick tabs */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 4, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row' }}>
          <OrderTab icon="package" label="À payer" count={0} />
          <OrderTab icon="refresh" label="Préparation" count={0} />
          <OrderTab icon="truck" label="En route" count={0} />
          <OrderTab icon="checkCircle" label="Avis" count={0} />
        </View>
      </View>

      {/* Sell on Loomodex CTA */}
      {!isVendor && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Pressable onPress={() => nav.navigate('Seller')} style={{ backgroundColor: LMX.navy, borderRadius: LMX.r.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="storefront" size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 17, color: '#fff' }}>Vendre sur Loomodex</Text>
              <Text style={{ fontSize: 11, color: '#fff', opacity: 0.7, marginTop: 3 }}>500+ vendeurs · ouvrir une boutique en 5 min</Text>
            </View>
            <Icon name="chevR" size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Settings */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <SettingRow icon="pin"         label="Adresses"         sub="Gérer mes adresses"     onPress={() => nav.navigate('Addresses')} />
          <SettingRow icon="money"       label="Paiement"         sub="Orange · MTN · Cash"    onPress={() => nav.navigate('PaymentMethods')} />
          <SettingRow icon="wallet"      label="Mon portefeuille"  sub={walletDisplay}          onPress={() => nav.navigate('Wallet')} />
          <SettingRow icon="heart"       label="Liste de souhaits" sub="Mes favoris"            onPress={() => nav.navigate('Wishlist')} />
          <SettingRow icon="bell"        label="Notifications"     sub="Push, SMS"              onPress={() => nav.navigate('Notifications')} />
          <SettingRow icon="package"     label="Suivre une commande"                            onPress={() => nav.navigate('TrackEntry')} />
          <SettingRow icon="refresh"     label="Demander un retour"                             onPress={() => nav.navigate('ReturnRequest')} />
          <SettingRow icon="headset"     label="Aide"                                           onPress={() => nav.navigate('Help')} last />
        </View>
      </View>

      {/* Business tools — visible to vendors/drivers/admin */}
      {(isVendor || isDriver || user?.roles?.includes('administrator')) && (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Outils professionnels</Text>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
            {isVendor && <SettingRow icon="chart"     label="Tableau de bord vendeur"  onPress={() => nav.navigate('Seller')} />}
            {isDriver  && <SettingRow icon="bike"      label="Tableau de bord livreur"  onPress={() => nav.navigate('Driver')} />}
            <SettingRow icon="truck"      label="Opérations logistique" onPress={() => nav.navigate('Logistics')} last />
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
    </Screen>
  );
}

// ── Notifications ──────────────────────────────────────────────
function NotifRow({ title, sub, time, unread, icon, accent }: any) {
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={17} color={accent} /></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: unread ? sans(600) : sans(500), flex: 1 }}>{title}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: mono(400) }}>{time}</Text>
        </View>
        <Text style={{ fontSize: 11.5, color: LMX.ink70, marginTop: 3, lineHeight: 16 }}>{sub}</Text>
      </View>
      {unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LMX.accent, marginTop: 4 }} />}
    </View>
  );
}

export function ScreenNotifications() {
  const nav = useNavigation<any>();
  const today = [
    { title: 'Mamadou is on the way', sub: 'Order LMX-204-882 · 7 min away', time: 'Now', unread: true, icon: 'truck', accent: LMX.emerald },
    { title: 'Price drop on a saved item', sub: 'Sport Smartwatch Elite — now 320 000 GNF', time: '1h', unread: true, icon: 'tag', accent: LMX.accent },
    { title: 'Seller confirmed your order', sub: 'Maison Diallo accepted LMX-204-431', time: '3h', unread: false, icon: 'checkCircle', accent: LMX.ink },
  ];
  const earlier = [
    { title: 'Flash deal · 30% off Smart TV', sub: 'Ends in 8h · only 12 left', time: 'Yesterday', unread: false, icon: 'flame', accent: LMX.accent },
    { title: 'How was your order?', sub: 'Tap to rate Wireless Headphones Pro', time: '2d', unread: false, icon: 'star', accent: LMX.amber },
    { title: 'Your phone number is verified', sub: '+224 623 84 51 09 confirmed', time: '5d', unread: false, icon: 'shield', accent: LMX.emerald },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Notifications" right={<IconBtn icon="settings" />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 14 }}>
        <Chip active>All · 6</Chip><Chip>Orders</Chip><Chip>Price drops</Chip><Chip>Promos</Chip>
      </ScrollView>
      <Text style={{ paddingHorizontal: 16, paddingBottom: 6, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Today</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>{today.map((n, i) => <NotifRow key={i} {...n} />)}</View>
      <Text style={{ paddingHorizontal: 16, paddingBottom: 6, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Earlier</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>{earlier.map((n, i) => <NotifRow key={i} {...n} />)}</View>
      <Text style={{ textAlign: 'center', fontSize: 12.5, color: LMX.ink70, fontFamily: sans(500) }}>Mark all as read</Text>
    </Screen>
  );
}

// ── Account details ────────────────────────────────────────────
export function ScreenAccountDetails() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Account details" right={<Text style={{ color: LMX.accent, fontSize: 13, fontFamily: sans(600) }}>Save</Text>} />
      <View style={{ paddingBottom: 18, alignItems: 'center' }}>
        <View>
          <LinearGradient colors={['#F37524', '#0EA5E9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 42, color: '#fff' }}>A</Text>
          </LinearGradient>
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: LMX.ink, borderWidth: 3, borderColor: LMX.bg, alignItems: 'center', justifyContent: 'center' }}><Icon name="pencil" size={13} color="#fff" /></View>
        </View>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Personal information</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
        <Field label="Full name" value="Aïssata Diallo" />
        <Field label="Phone number" prefix="+224" value="623 84 51 09" trailingIcon="checkCircle" />
        <Field label="Email (optional)" value="aissata.diallo@gmail.com" />
        <Field label="Date of birth" value="14 March 1996" />
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Security & sign-in</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <SettingRow icon="key" label="Change password" sub="Last changed 2 months ago" />
          <SettingRow icon="shield" label="Two-factor auth" sub="SMS · +224 ••• 5109" />
          <SettingRow icon="phone" label="Connected devices" sub="2 devices" last />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Pressable style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: LMX.rose, borderRadius: LMX.r.lg }}><Text style={{ color: LMX.rose, fontFamily: sans(600), fontSize: 13 }}>Delete account</Text></Pressable>
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
          {primary && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LMX.ink }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase' }}>Default</Text></View>}
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
  const addresses = [
    { label: 'Home', name: 'Aïssata Diallo', phone: '+224 623 84 51 09', line: 'Immeuble Niger, 4ème étage, Boulbinet', area: 'Kaloum, Conakry', icon: 'home', primary: true },
    { label: 'Office', name: 'Aïssata Diallo', phone: '+224 623 84 51 09', line: 'Loomodex HQ, Avenue de la République', area: 'Almamya, Conakry', icon: 'storefront' },
    { label: 'Parents', name: 'Mariama Diallo', phone: '+224 622 14 77 03', line: 'Lot 22, Quartier Coleah', area: 'Matam, Conakry', icon: 'user' },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Addresses" right={<IconBtn icon="plus" onPress={() => nav.navigate('AddressForm')} />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ height: 130, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
          <MapVisual />
          <View style={{ position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={12} color={LMX.brand} /><Text style={{ fontSize: 11, fontFamily: sans(600) }}>3 saved · Conakry</Text>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {addresses.map((a, i) => <AddressCard key={i} {...a} onPress={() => nav.navigate('AddressForm')} />)}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Pressable onPress={() => nav.navigate('AddressForm')} style={{ paddingVertical: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', borderRadius: LMX.r.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="plus" size={16} color={LMX.ink} /><Text style={{ color: LMX.ink, fontFamily: sans(600), fontSize: 13 }}>Add new address</Text>
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
  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={() => nav.goBack()}>Save address</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Add address" right={<Text style={{ color: LMX.accent, fontSize: 13, fontFamily: sans(600) }}>Save</Text>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ height: 150, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
          <MapVisual />
          <View style={{ position: 'absolute', top: '40%', left: '50%', marginLeft: -18 }}><Icon name="pin" size={36} color={LMX.accent} strokeWidth={2.5} /></View>
          <View style={{ position: 'absolute', top: 10, left: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="location" size={12} color={LMX.brand} /><Text style={{ flex: 1, fontSize: 11, fontFamily: sans(600) }}>Boulbinet, Kaloum · Conakry</Text><Icon name="refresh" size={12} color={LMX.ink50} />
          </View>
        </View>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Address type</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
        <LabelPick icon="home" label="Home" active /><LabelPick icon="storefront" label="Office" /><LabelPick icon="plus" label="Other" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
        <Field label="Recipient name" value="Aïssata Diallo" />
        <Field label="Phone for delivery" prefix="+224" value="623 84 51 09" />
        <Field label="Street address & building" value="Immeuble Niger, 4ème étage" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Neighborhood" value="Boulbinet" /></View>
          <View style={{ flex: 1 }}><Field label="City" value="Conakry" /></View>
        </View>
        <Field label="Delivery notes (optional)" value="Ring twice. Gate code 22B." />
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={15} color={LMX.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Set as default address</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Used at checkout by default</Text>
          </View>
          <Toggle on />
        </View>
      </View>
    </Screen>
  );
}
