import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LMX, FONT, sans, mono, fr } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Field, Toggle, MapVisual, CategoryGlyph } from '../components';

function Chart() {
  const pts = [10, 18, 12, 28, 22, 40, 32, 46, 38, 52, 44, 58];
  const max = 60, w = 320, h = 60;
  const sx = (i: number) => (i / (pts.length - 1)) * w;
  const sy = (v: number) => h - (v / max) * h;
  const path = pts.map((v, i) => (i === 0 ? 'M' : 'L') + sx(i) + ' ' + sy(v)).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Defs><SvgGrad id="cg" x1="0" x2="0" y1="0" y2="1"><Stop offset="0%" stopColor="#D94C1F" stopOpacity="0.4" /><Stop offset="100%" stopColor="#D94C1F" stopOpacity="0" /></SvgGrad></Defs>
      <Path d={area} fill="url(#cg)" />
      <Path d={path} stroke="#D94C1F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatCard({ label, value, trend, icon, highlight }: any) {
  return (
    <View style={{ width: '47.5%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: highlight ? LMX.ink : LMX.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
        <Icon name={icon} size={14} color={LMX.ink50} />
      </View>
      <Text style={{ fontFamily: mono(600), fontSize: 22, marginTop: 6 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: highlight ? LMX.accent : LMX.ink50, marginTop: 2, fontFamily: highlight ? sans(600) : sans(500) }}>{trend}</Text>
    </View>
  );
}

function SellerOrder({ buyer, loc, product, qty, status, eta }: any) {
  const isNew = status === 'new';
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: isNew ? LMX.accent : LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {isNew && <View style={{ position: 'absolute', top: -6, right: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: LMX.accent, borderRadius: 4 }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase' }}>New · {eta}</Text></View>}
      <Image source={{ uri: IMG(product.slug) }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: LMX.surfaceAlt }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{product.name} · ×{qty}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}><Icon name="user" size={11} color={LMX.ink50} /><Text style={{ fontSize: 11, color: LMX.ink50 }}>{buyer} · {loc}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 12 }}>{fr(product.price * qty)} GNF</Text>
          <Text style={{ fontSize: 10, color: LMX.ink50 }}>· Cash on delivery</Text>
        </View>
      </View>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={16} color="#fff" /></View>
    </View>
  );
}

function ActionCard({ icon, label, sub }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>{label}</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>{sub}</Text></View>
    </View>
  );
}

export function ScreenSeller() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Seller dashboard</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>Maison Diallo</Text>
          </View>
          <IconBtn icon="bell" badge={5} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.xl, padding: 20, overflow: 'hidden' }}>
          <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Earnings this month</Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 40, color: '#fff', marginTop: 8 }}>8 460 000<Text style={{ fontSize: 14, opacity: 0.7, fontFamily: sans(400) }}> GNF</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(78,194,144,0.18)' }}><Text style={{ fontSize: 11, fontFamily: mono(600), color: '#7BE0AE' }}>+24%</Text></View>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.6 }}>vs last month</Text>
          </View>
          <View style={{ marginTop: 20, height: 60 }}><Chart /></View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatCard label="Orders to fulfil" value="6" trend="+2 today" icon="package" highlight />
        <StatCard label="New messages" value="3" trend="2 unread" icon="bell" />
        <StatCard label="Store visits" value="412" trend="+18%" icon="eye" />
        <StatCard label="Rating" value="4.92" trend="218 reviews" icon="star" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Orders to prepare</Text><Text style={{ fontSize: 12, color: LMX.ink70 }}>See all 6</Text>
        </View>
        <View style={{ gap: 10 }}>
          <SellerOrder buyer="A. Diallo" loc="Kaloum" product={PRODUCTS[6]} qty={1} status="new" eta="20 min" />
          <SellerOrder buyer="F. Bah" loc="Ratoma" product={PRODUCTS[6]} qty={2} status="prep" eta="" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 10 }}>
        <Pressable style={{ flex: 1 }} onPress={() => nav.navigate('AddProduct')}><ActionCard icon="plus" label="Add product" sub="List a new item" /></Pressable>
        <ActionCard icon="tag" label="Run promo" sub="Boost sales" />
      </View>
    </Screen>
  );
}

function ProductToggle({ icon, label, sub, on, last }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>{label}</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{sub}</Text></View>
      <Toggle on={on} />
    </View>
  );
}

export function ScreenAddProduct() {
  const nav = useNavigation<any>();
  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="ghost" size="lg" style={{ flex: 1 }}>Save as draft</Button>
        <Button variant="accent" size="lg" style={{ flex: 1.5 }} icon="arrowR" onPress={() => nav.goBack()}>Publish</Button>
      </View>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Add product" right={<Text style={{ color: LMX.ink50, fontSize: 13, fontFamily: sans(600) }}>Draft</Text>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Listing progress</Text>
          <Text style={{ fontSize: 11, fontFamily: mono(600) }}>60%</Text>
        </View>
        <View style={{ height: 4, backgroundColor: LMX.ink10, borderRadius: 2 }}><View style={{ width: '60%', height: '100%', backgroundColor: LMX.accent, borderRadius: 2 }} /></View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Photos · 4 / 8</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ width: 88, height: 88, borderRadius: 14, overflow: 'hidden', backgroundColor: LMX.surfaceAlt, borderWidth: i === 0 ? 2 : 0, borderColor: LMX.ink }}>
              <Image source={{ uri: IMG(PRODUCTS[6].slug) }} style={{ width: '100%', height: '100%' }} />
              {i === 0 && <View style={{ position: 'absolute', bottom: 4, left: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LMX.ink }}><Text style={{ color: '#fff', fontSize: 9, fontFamily: sans(700), textTransform: 'uppercase' }}>Main</Text></View>}
            </View>
          ))}
          <View style={{ width: 88, height: 88, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', backgroundColor: LMX.surface, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="plus" size={22} color={LMX.ink70} /><Text style={{ fontSize: 10, fontFamily: sans(600), color: LMX.ink70 }}>Add</Text>
          </View>
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
        <Field label="Product name" value="Genuine leather handbag · Mali" />
        <View>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Description</Text>
          <View style={{ backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: 14, padding: 14, minHeight: 80 }}>
            <Text style={{ fontSize: 13, color: LMX.ink50, lineHeight: 19 }}>Hand-stitched full-grain leather handbag with brass hardware. Made in Coleah, Conakry.</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Price (GNF)" value="350 000" /></View>
          <View style={{ flex: 1 }}><Field label="Stock units" value="12" /></View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Category</Text>
        <View style={{ backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#E5DDF0', alignItems: 'center', justifyContent: 'center' }}><CategoryGlyph id="fashion" size={16} /></View>
          <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600) }}>Fashion · Women · Bags</Text>
          <Icon name="chevR" size={14} color={LMX.ink50} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <ProductToggle icon="truck" label="Free delivery in Conakry" sub="Buyers pay shipping outside" on />
          <ProductToggle icon="flame" label="Boost as flash deal" sub="2% commission on featured" />
          <ProductToggle icon="refresh" label="14-day returns accepted" sub="Builds buyer trust" on last />
        </View>
      </View>
    </Screen>
  );
}

function DriverStat({ value, label }: { value: string; label: string }) {
  return <View><Text style={{ fontFamily: mono(600), fontSize: 16, color: '#fff' }}>{value}</Text><Text style={{ fontSize: 9.5, color: '#fff', opacity: 0.65, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text></View>;
}

function DriverQueue({ idx, addr, name, km, pay }: any) {
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: LMX.surfaceAlt, borderWidth: 1, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: mono(600), fontSize: 12 }}>{idx}</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{addr} · {name}</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{km} km · cash on delivery</Text></View>
      <Text style={{ fontFamily: mono(600), fontSize: 12.5, color: LMX.emerald }}>+{pay}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text></Text>
    </View>
  );
}

export function ScreenDriver() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: sans(600), color: '#fff' }}>MB</Text>
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: LMX.emerald, borderWidth: 2, borderColor: LMX.bg }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Driver · Online</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>Mamadou Bah</Text>
          </View>
          <Toggle on />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <LinearGradient colors={['#0F1620', '#0B7FB5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: LMX.r.xl, padding: 20, overflow: 'hidden' }}>
          <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Today's earnings</Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 36, color: '#fff', marginTop: 8 }}>285 000<Text style={{ fontSize: 13, opacity: 0.7, fontFamily: sans(400) }}> GNF</Text></Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <DriverStat value="12" label="Trips" /><DriverStat value="68 km" label="Distance" /><DriverStat value="4.92" label="Rating" />
          </View>
        </LinearGradient>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Active delivery</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LMX.emerald }} /><Text style={{ fontSize: 10.5, color: LMX.emerald, fontFamily: sans(700), textTransform: 'uppercase' }}>En route</Text></View>
        </View>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 2, borderColor: LMX.ink, overflow: 'hidden' }}>
          <View style={{ height: 130 }}><MapVisual /></View>
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bike" size={16} color={LMX.ink} /></View>
              <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>Drop · Aïssata Diallo</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Immeuble Niger · Kaloum · 2.4 km</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={{ fontFamily: mono(600), fontSize: 14 }}>7 min</Text><Text style={{ fontSize: 10.5, color: LMX.ink50 }}>ETA 11:38</Text></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button variant="ghost" size="md" style={{ flex: 1 }} icon="phone">Call</Button>
              <Button variant="primary" size="md" style={{ flex: 2 }} icon="arrowR">Mark as arrived</Button>
            </View>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Up next · 3 deliveries</Text><Text style={{ fontSize: 12, color: LMX.ink70 }}>Route</Text>
        </View>
        <View style={{ gap: 10 }}>
          <DriverQueue idx="2" addr="Boulbinet" name="A. Camara" km="3.1" pay="25 000" />
          <DriverQueue idx="3" addr="Almamya" name="Y. Sylla" km="4.8" pay="25 000" />
          <DriverQueue idx="4" addr="Ratoma" name="F. Bah" km="9.2" pay="40 000" />
        </View>
      </View>
    </Screen>
  );
}

function LogiRow({ icon, label, children }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={13} color={LMX.ink70} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 12.5, color: LMX.ink, marginTop: 2, lineHeight: 17 }}>{children}</Text>
      </View>
    </View>
  );
}

function LogisticsOrderCard({ o }: { o: any }) {
  const STATUS: any = {
    prep: { label: 'Preparing', color: LMX.amber }, ready: { label: 'Ready to assign', color: LMX.accent },
    assigned: { label: 'Assigned', color: LMX.brand }, route: { label: 'In route', color: LMX.brandDeep },
    done: { label: 'Delivered', color: LMX.emerald }, failed: { label: 'Failed', color: LMX.rose },
  };
  const OTP: any = {
    pending: { label: 'OTP pending', color: LMX.ink50, icon: 'shield' }, shared: { label: 'OTP shared', color: LMX.brand, icon: 'qr' },
    verified: { label: 'OTP verified', color: LMX.emerald, icon: 'checkCircle' }, failed: { label: 'OTP failed', color: LMX.rose, icon: 'close' },
  };
  const st = STATUS[o.status], otp = OTP[o.otp];
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: o.status === 'failed' ? LMX.rose : LMX.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.id}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: mono(400) }}>· {o.total} GNF</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: st.color + '1A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
          <Text style={{ fontSize: 10, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{st.label}</Text>
        </View>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <LogiRow icon="user" label="Customer">{o.customer} · <Text style={{ fontFamily: mono(400), fontSize: 11 }}>{o.phone}</Text></LogiRow>
        <LogiRow icon="storefront" label="Pickup">{o.vendor}</LogiRow>
        <LogiRow icon="pin" label="Drop">{o.address} <Text style={{ backgroundColor: LMX.surfaceAlt, fontSize: 10, fontFamily: sans(600), color: LMX.ink70 }}> {o.zone} </Text></LogiRow>
        <LogiRow icon="money" label="Payment">{o.pay}</LogiRow>
      </View>
      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: LMX.hairline, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {o.driver ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 9.5, fontFamily: sans(700) }}>{o.driver.split(' ').map((n: string) => n[0]).join('')}</Text></View>
            <Text style={{ fontSize: 12, fontFamily: sans(600) }}>{o.driver}</Text>
          </View>
        ) : (
          <View style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: LMX.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="bike" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>Assign driver</Text><Icon name="chevD" size={13} color="#fff" />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name={otp.icon} size={13} color={otp.color} /><Text style={{ fontSize: 10.5, fontFamily: sans(600), color: otp.color }}>{otp.label}</Text></View>
      </View>
    </View>
  );
}

export function ScreenLogistics() {
  const nav = useNavigation<any>();
  const counts = [
    { id: 'prep', label: 'Preparing', n: 14, color: LMX.amber }, { id: 'ready', label: 'Ready to assign', n: 6, color: LMX.accent },
    { id: 'assigned', label: 'Assigned', n: 9, color: LMX.brand }, { id: 'route', label: 'In route', n: 18, color: LMX.brandDeep },
    { id: 'done', label: 'Delivered', n: 92, color: LMX.emerald }, { id: 'failed', label: 'Failed', n: 3, color: LMX.rose },
  ];
  const orders = [
    { id: 'LMX-204-882', status: 'ready', customer: 'Aïssata Diallo', phone: '+224 623 84 51 09', vendor: 'Audio House', address: 'Immeuble Niger, Boulbinet', zone: 'Kaloum', pay: 'COD', total: '665 000', driver: null, otp: 'pending' },
    { id: 'LMX-204-871', status: 'route', customer: 'Fatoumata Bah', phone: '+224 612 09 73 22', vendor: 'Maison Diallo', address: 'Lot 22, Quartier Coleah', zone: 'Ratoma', pay: 'Orange Money', total: '350 000', driver: 'Mamadou Bah', otp: 'shared' },
    { id: 'LMX-204-863', status: 'assigned', customer: 'Ibrahim Camara', phone: '+224 620 55 18 40', vendor: 'Tech Bazaar', address: 'Av. de la République', zone: 'Almamya', pay: 'MTN MoMo', total: '320 000', driver: 'Fatou Kaba', otp: 'pending' },
    { id: 'LMX-204-840', status: 'failed', customer: 'Yaya Sylla', phone: '+224 628 71 03 95', vendor: 'Cuisine Plus', address: 'Cité Chemin de Fer', zone: 'Matam', pay: 'COD', total: '680 000', driver: 'Ibrahim Sow', otp: 'failed' },
  ];
  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Logistics</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>Conakry hub</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: LMX.emeraldSoft }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LMX.emerald }} /><Text style={{ fontSize: 10.5, fontFamily: sans(700), color: LMX.emerald, textTransform: 'uppercase' }}>Live · 18</Text>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {counts.map((c, i) => (
          <View key={c.id} style={{ width: '31.5%', backgroundColor: LMX.surface, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: i === 1 ? LMX.accent : LMX.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.color }} /><Text style={{ fontFamily: mono(600), fontSize: 20 }}>{c.n}</Text></View>
            <Text style={{ fontSize: 10, color: LMX.ink50, marginTop: 4, fontFamily: sans(600) }}>{c.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Delivery orders</Text>
        <Text style={{ fontSize: 11.5, color: LMX.ink70, fontFamily: mono(400) }}>142 total</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>{orders.map(o => <LogisticsOrderCard key={o.id} o={o} />)}</View>
    </Screen>
  );
}
