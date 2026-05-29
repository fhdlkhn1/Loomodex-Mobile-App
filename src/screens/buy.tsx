import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, gnfShort } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Discount, ProductCard, Chip, SummaryRow } from '../components';

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: mono(600), fontSize: 15 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function ReviewItem({ name, location, rating, body, ago }: { name: string; location: string; rating: number; body: string; ago: string }) {
  return (
    <View style={{ padding: 16, borderRadius: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontFamily: sans(600) }}>{name.split(' ').map(n => n[0]).join('')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{name}</Text>
          <Text style={{ fontSize: 11, color: LMX.ink50 }}>{location} · {ago} ago</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 1 }}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={11} color={i <= rating ? LMX.amber : LMX.ink30} />)}</View>
      </View>
      <Text style={{ marginTop: 10, fontSize: 12.5, color: LMX.ink70, lineHeight: 18 }}>{body}</Text>
    </View>
  );
}

export function ScreenProductDetail() {
  const nav = useNavigation<any>();
  const p = PRODUCTS.find(x => x.slug === 'wireless-bluetooth-headphones-pro')!;
  return (
    <Screen
      padTop={false}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" size={20} color={LMX.ink} />
          </View>
          <Button variant="ghost" size="lg" style={{ flex: 1 }} onPress={() => nav.navigate('Cart')}>Add to cart</Button>
          <Button variant="accent" size="lg" style={{ flex: 1.2 }} onPress={() => nav.navigate('Cart')}>Buy now</Button>
        </View>
      }
    >
      <AppBar
        overlay
        left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />}
        right={<><IconBtn icon="share" bg="rgba(255,255,255,0.9)" /><IconBtn icon="bag" bg="rgba(255,255,255,0.9)" badge={3} onPress={() => nav.navigate('Cart')} /></>}
      />
      <View style={{ height: 360, backgroundColor: LMX.surfaceAlt }}>
        <Image source={{ uri: IMG(p.slug) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          {[0, 1, 2, 3].map(i => <View key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === 0 ? LMX.ink : 'rgba(255,255,255,0.7)' }} />)}
        </View>
      </View>
      <View style={{ marginTop: -22, backgroundColor: LMX.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Pressable onPress={() => nav.navigate('SellerStorefront')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11} color="#fff" /></View>
            <Text style={{ fontSize: 11, fontFamily: sans(600) }}>{p.seller}</Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: LMX.ink50 }}>· Sold {p.sold}+</Text>
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 28, lineHeight: 30, color: LMX.ink }}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 1 }}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={13} color={i <= 4 ? LMX.amber : LMX.ink30} />)}</View>
          <Text style={{ fontFamily: mono(600), fontSize: 12 }}>{p.rating}</Text>
          <Text style={{ fontSize: 12, color: LMX.ink50 }}>({p.reviews} reviews)</Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="checkCircle" size={12} color={LMX.emerald} /><Text style={{ fontSize: 11, color: LMX.emerald, fontFamily: sans(600) }}>In stock</Text></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Price value={p.price} was={p.was} size="xl" /><Discount off={p.off} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 10 }}>Color · <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>Matte black</Text></Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['#1a1814', '#E4DAC8', '#8C6F4A', '#B72458'].map((c, i) => (
              <View key={c} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c, borderWidth: i === 0 ? 2 : 1, borderColor: i === 0 ? LMX.ink : LMX.border }} />
            ))}
          </View>
        </View>
        <View style={{ marginTop: 18, padding: 16, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="truck" size={18} color={LMX.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Free delivery in Conakry</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>Arrives <Text style={{ color: LMX.ink, fontFamily: sans(500) }}>tomorrow</Text> · 14:00–18:00</Text>
          </View>
          <Icon name="chevR" size={16} color={LMX.ink50} />
        </View>
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600), marginBottom: 8 }}>Description</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: LMX.ink70 }}>
            Studio-grade active noise cancellation with 40 hours of playback. Plush memory-foam ear cushions, foldable steel frame, Bluetooth 5.3 multipoint, and a built-in mic for crystal-clear calls... <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>Read more</Text>
          </Text>
        </View>
        <View style={{ marginTop: 18, flexDirection: 'row', gap: 8, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LMX.hairline }}>
          <Spec label="Battery" value="40 h" /><Spec label="Bluetooth" value="5.3" /><Spec label="Weight" value="248 g" />
        </View>
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Recent reviews</Text>
            <Text style={{ fontSize: 12, color: LMX.ink70 }}>See all 184</Text>
          </View>
          <ReviewItem name="Mariama D." location="Ratoma" rating={5} ago="2d" body="Sound is incredible and the noise cancelling really works on the bus. Delivery took just one day. Recommended!" />
        </View>
      </View>
    </Screen>
  );
}

function SellerStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: mono(600), fontSize: 17 }}>{value}</Text>
      <Text style={{ fontSize: 9.5, color: LMX.ink50, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
    </View>
  );
}

export function ScreenSellerStorefront() {
  const nav = useNavigation<any>();
  return (
    <Screen padTop={false}>
      <AppBar overlay left={<IconBtn icon="chevL" bg="rgba(255,255,255,0.9)" onPress={() => nav.goBack()} />} right={<><IconBtn icon="share" bg="rgba(255,255,255,0.9)" /><IconBtn icon="bag" bg="rgba(255,255,255,0.9)" badge={3} onPress={() => nav.navigate('Cart')} /></>} />
      <LinearGradient colors={['#2E2A20', '#4F4A38', '#C99B5C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 160 }} />
      <View style={{ paddingHorizontal: 16, marginTop: -36 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff', padding: 4, alignSelf: 'flex-start' }}>
          <LinearGradient colors={['#C99B5C', '#8C6F4A']} style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 30, color: '#fff' }}>MD</Text>
          </LinearGradient>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 26, color: LMX.ink }}>Maison Diallo</Text>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={12} color="#fff" strokeWidth={2.5} /></View>
            </View>
            <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 4 }}><Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>● Open</Text> · Leather goods & accessories · Conakry</Text>
          </View>
          <Button variant="primary" size="sm">Follow</Button>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LMX.hairline }}>
          <SellerStat value="4.92" label="Rating" /><SellerStat value="218" label="Reviews" /><SellerStat value="196" label="Sold" /><SellerStat value="3y" label="On Loomodex" />
        </View>
        <Text style={{ marginTop: 14, fontSize: 12.5, color: LMX.ink70, lineHeight: 19 }}>Hand-crafted leather goods made in Coleah. Every piece is signed and guaranteed. Ships across Guinea — same-day in Conakry.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingVertical: 14 }}>
        <Chip active>All</Chip><Chip>Bags</Chip><Chip>Wallets</Chip><Chip>Belts</Chip><Chip>New</Chip>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[0, 1, 2, 3].map(i => <View key={i} style={{ width: '47.5%' }}><ProductCard product={PRODUCTS[6]} onPress={() => nav.navigate('ProductDetail')} /></View>)}
      </View>
    </Screen>
  );
}

function Stepper({ qty }: { qty: number }) {
  const [q, setQ] = React.useState(qty);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: LMX.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: LMX.hairline }}>
      <Pressable onPress={() => setQ(Math.max(1, q - 1))} style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={14} color={LMX.ink} /></Pressable>
      <Text style={{ minWidth: 18, textAlign: 'center', fontFamily: mono(600), fontSize: 13 }}>{q}</Text>
      <Pressable onPress={() => setQ(q + 1)} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={14} color="#fff" /></Pressable>
    </View>
  );
}

function CartItem({ p, qty, color }: { p: typeof PRODUCTS[number]; qty: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.border }}>
      <Image source={{ uri: IMG(p.slug) }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: LMX.surfaceAlt }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: sans(500), lineHeight: 17, flex: 1 }}>{p.name}</Text>
          <Icon name="close" size={16} color={LMX.ink50} />
        </View>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 4 }}>{color} · From <Text style={{ color: LMX.ink70, fontFamily: sans(500) }}>{p.seller}</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Price value={p.price} size="md" /><Stepper qty={qty} />
        </View>
      </View>
    </View>
  );
}

export function ScreenCart() {
  const nav = useNavigation<any>();
  const items = [
    { p: PRODUCTS[1], qty: 1, color: 'Matte black' },
    { p: PRODUCTS[12], qty: 2, color: 'Black' },
    { p: PRODUCTS[8], qty: 1, color: 'Original' },
  ];
  const subtotal = items.reduce((a, i) => a + i.p.price * i.qty, 0);
  const discount = items.reduce((a, i) => a + ((i.p.was || i.p.price) - i.p.price) * i.qty, 0);
  const delivery = 25000;
  const total = subtotal + delivery;
  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Checkout')}>{`Checkout · ${gnfShort(total)} GNF`}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Cart · 3 items" right={<IconBtn icon="receipt" />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ fontSize: 12.5, fontFamily: sans(500), flex: 1 }}>Add <Text style={{ fontFamily: mono(600) }}>110 000</Text> GNF more for <Text style={{ color: LMX.emerald, fontFamily: sans(600) }}>free delivery</Text></Text>
            <Icon name="truck" size={18} color={LMX.emerald} />
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: LMX.ink10, marginTop: 10, overflow: 'hidden' }}>
            <View style={{ width: '72%', height: '100%', backgroundColor: LMX.emerald }} />
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {items.map((it, i) => <CartItem key={i} {...it} />)}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', height: 50 }}>
          <Icon name="tag" size={16} color={LMX.ink70} />
          <Text style={{ flex: 1, fontSize: 13, color: LMX.ink50 }}>Promo code or voucher</Text>
          <Text style={{ color: LMX.ink, fontFamily: sans(600), fontSize: 13 }}>Apply</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SummaryRow label="Subtotal" value={subtotal} />
        <SummaryRow label="Discount" value={-discount} accent />
        <SummaryRow label="Delivery (Conakry)" value={delivery} />
        <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total</Text>
          <Price value={total} size="lg" />
        </View>
      </View>
    </Screen>
  );
}

function StepDot({ n, label, active, done }: { n: string; label: string; active?: boolean; done?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done ? LMX.ink : active ? LMX.accent : LMX.surface, borderWidth: !done && !active ? 1 : 0, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Icon name="check" size={12} color="#fff" /> : <Text style={{ fontSize: 11, fontFamily: mono(700), color: active ? '#fff' : LMX.ink50 }}>{n}</Text>}
      </View>
      <Text style={{ fontSize: 11.5, fontFamily: active ? sans(600) : sans(500), color: active ? LMX.ink : LMX.ink70 }}>{label}</Text>
    </View>
  );
}

function PayGlyph({ bg, text, dark }: { bg: string; text: string; dark?: boolean }) {
  return <View style={{ width: 28, height: 22, borderRadius: 5, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: dark ? LMX.ink : '#fff', fontSize: 9, fontFamily: sans(700) }}>{text}</Text></View>;
}

function PaymentOption({ icon, title, sub, badge, selected }: { icon: React.ReactNode; title: string; sub: string; badge?: { label: string; color: string }; selected?: boolean }) {
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? LMX.ink : LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{title}</Text>
          {badge && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: badge.color }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase' }}>{badge.label}</Text></View>}
        </View>
        <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{sub}</Text>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? LMX.ink : LMX.border, backgroundColor: selected ? LMX.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
      </View>
    </View>
  );
}

export function ScreenCheckout() {
  const nav = useNavigation<any>();
  return (
    <Screen footer={
      <View>
        <Button full variant="accent" size="lg" onPress={() => nav.navigate('OrderSuccess')}><Icon name="shield" size={16} color="#fff" /><Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 15 }}>Place order · 665 000 GNF</Text></Button>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, textAlign: 'center', marginTop: 8 }}>By placing your order, you agree to Loomodex's Terms & Refund Policy.</Text>
      </View>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Checkout" />
      <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StepDot n="1" label="Address" done />
          <View style={{ flex: 1, height: 1, backgroundColor: LMX.ink }} />
          <StepDot n="2" label="Payment" active />
          <View style={{ flex: 1, height: 1, backgroundColor: LMX.ink10 }} />
          <StepDot n="3" label="Review" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Delivery to</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={16} color={LMX.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Aïssata Diallo · +224 623 84 51 09</Text>
            <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 4, lineHeight: 17 }}>Immeuble Niger, 4ème étage{'\n'}Boulbinet, Kaloum · Conakry</Text>
          </View>
          <Text style={{ color: LMX.ink, fontFamily: sans(600), fontSize: 12 }}>Change</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Payment method</Text>
        <View style={{ gap: 10 }}>
          <PaymentOption selected badge={{ label: 'Recommended', color: LMX.emerald }} icon={<Icon name="money" size={20} color={LMX.ink} />} title="Cash on delivery" sub="Inspect before paying · No fees" />
          <PaymentOption icon={<PayGlyph bg="#FF7900" text="OM" />} title="Orange Money" sub="Pay via USSD #144#" />
          <PaymentOption icon={<PayGlyph bg="#FFCC00" text="MoMo" dark />} title="MTN Mobile Money" sub="MTN MoMo wallet" />
          <PaymentOption icon={<Icon name="card" size={20} color={LMX.ink} />} title="Card · Visa / Mastercard" sub="Add a card to checkout" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.hairline }}>
          <Icon name="shield" size={18} color={LMX.emerald} />
          <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 17, flex: 1 }}>Your driver will share a one-time code at the door. Confirm only after inspecting your order.</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Order summary</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {[PRODUCTS[1], PRODUCTS[12], PRODUCTS[8]].map((p, i) => (
                <Image key={p.id} source={{ uri: IMG(p.slug) }} style={{ width: 38, height: 38, borderRadius: 10, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: LMX.surface }} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>3 items · 4 units</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>From 2 sellers</Text>
            </View>
            <Icon name="chevR" size={14} color={LMX.ink50} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: LMX.hairline, paddingTop: 10 }}>
            <SummaryRow label="Subtotal (3 items)" value={680000} />
            <SummaryRow label="Delivery (Conakry)" value={25000} />
            <SummaryRow label="Promo · NEW10" value={-40000} accent />
            <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total to pay on delivery</Text>
              <Price value={665000} size="md" />
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
