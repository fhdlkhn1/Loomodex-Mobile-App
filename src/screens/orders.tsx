import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LMX, FONT, sans, mono, fr } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Price, Chip, SummaryRow, SettingRow, MapVisual, Field } from '../components';

function HelpTile({ icon, title, onPress }: { icon: any; title: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} color={LMX.ink} /></View>
      <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600) }}>{title}</Text>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </Pressable>
  );
}

export function ScreenOrderSuccess() {
  const nav = useNavigation<any>();
  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="ghost" size="lg" style={{ flex: 1 }} onPress={() => nav.navigate('Main')}>Continue shopping</Button>
        <Button variant="accent" size="lg" style={{ flex: 1 }} onPress={() => nav.navigate('OrderDetails')}>View order</Button>
      </View>
    }>
      <AppBar left={<IconBtn icon="close" onPress={() => nav.navigate('Main')} />} />
      <View style={{ paddingHorizontal: 28, paddingTop: 30, alignItems: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: LMX.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={42} color={LMX.emerald} strokeWidth={2.2} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, marginTop: 24, color: LMX.ink }}>Order placed!</Text>
        <Text style={{ marginTop: 12, fontSize: 14, lineHeight: 21, color: LMX.ink70, textAlign: 'center', maxWidth: 280 }}>Your order is being prepared by the seller. We'll notify you when it's on the way.</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 18, borderWidth: 1, borderColor: LMX.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Order number</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 15, marginTop: 4 }}>LMX-204-882</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Estimated</Text>
              <Text style={{ fontSize: 13, fontFamily: sans(600), marginTop: 4 }}>Tomorrow · 14–18h</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="money" size={16} color={LMX.emerald} />
            <Text style={{ flex: 1, fontSize: 12.5 }}>Pay <Text style={{ fontFamily: mono(600) }}>665 000 GNF</Text> on delivery</Text>
            <Icon name="shield" size={16} color={LMX.ink50} />
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, flexDirection: 'row', gap: 10 }}>
        <HelpTile icon="truck" title="Track order" onPress={() => nav.navigate('Tracking')} />
        <HelpTile icon="headset" title="Need help?" onPress={() => nav.navigate('Help')} />
      </View>
    </Screen>
  );
}

function Timeline() {
  const steps = [
    { label: 'Order placed', time: 'Today, 09:42', done: true },
    { label: 'Seller confirmed', time: '09:51', done: true },
    { label: 'Out for delivery', time: '11:08', done: true, active: true, sub: 'Mamadou picked up your order' },
    { label: 'At your door', time: 'ETA 11:38', done: false },
    { label: 'Delivered', time: '—', done: false },
  ];
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, borderWidth: 1, borderColor: LMX.border }}>
      {steps.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 14, paddingBottom: i === steps.length - 1 ? 12 : 18 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: s.done ? LMX.ink : LMX.surface, borderWidth: s.done ? 0 : 1.5, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}>
              {s.done && <Icon name="check" size={9} color="#fff" strokeWidth={2.5} />}
            </View>
            {i < steps.length - 1 && <View style={{ width: 1.5, flex: 1, backgroundColor: s.done ? LMX.ink : LMX.ink10, marginTop: 2, minHeight: 22 }} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: s.active ? sans(600) : sans(500), color: s.done ? LMX.ink : LMX.ink50 }}>{s.label}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, fontFamily: mono(400) }}>{s.time}</Text>
            </View>
            {s.sub ? <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{s.sub}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function ScreenTracking() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Track order" right={<IconBtn icon="headset" />} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ height: 250, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
          <MapVisual />
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: LMX.emerald }} />
              <Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>Mamadou is on the way</Text>
            </View>
            <View style={{ backgroundColor: LMX.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="truck" size={12} color="#fff" />
              <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>7 min away</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14, fontFamily: sans(600) }}>MB</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>Mamadou Bah</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Icon name="star" size={11} color={LMX.amber} />
              <Text style={{ fontSize: 11, fontFamily: mono(600), color: LMX.ink70 }}>4.92</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50 }}>· Yamaha 50 · 224-AB-04</Text>
            </View>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.surfaceAlt, borderWidth: 1, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color={LMX.ink} /></View>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="bell" size={18} color="#fff" /></View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Icon name="qr" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Verification code</Text>
            <Text style={{ fontFamily: mono(600), fontSize: 22, color: '#fff', letterSpacing: 4, marginTop: 2 }}>4 7 2 1</Text>
          </View>
          <Text style={{ fontSize: 10.5, color: '#fff', opacity: 0.6, maxWidth: 100, textAlign: 'right' }}>Share only with your driver at the door</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Order #LMX-204-882</Text>
          <Text style={{ color: LMX.ink50, fontFamily: mono(400), fontSize: 12 }}>665 000 GNF</Text>
        </View>
        <Timeline />
      </View>
    </Screen>
  );
}

function RecentTrack({ id, date, status, emerald, last, onPress }: { id: string; date: string; status: string; emerald?: boolean; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={15} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: mono(600) }}>{id}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{date}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {emerald && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: LMX.emerald }} />}
        <Text style={{ fontSize: 11, fontFamily: sans(600), color: emerald ? LMX.emerald : LMX.ink70 }}>{status}</Text>
      </View>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </Pressable>
  );
}

export function ScreenTrackEntry() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Track order" right={<IconBtn icon="headset" />} />
      <View style={{ paddingHorizontal: 24, alignItems: 'center', paddingTop: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LMX.border, marginTop: 20 }}>
          <Icon name="package" size={36} color={LMX.ink} strokeWidth={1.5} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 28, marginTop: 20, color: LMX.ink }}>Where is my order?</Text>
        <Text style={{ marginTop: 12, fontSize: 13, color: LMX.ink70, lineHeight: 20, textAlign: 'center', maxWidth: 280 }}>Enter your order number and registered phone — no account required.</Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 14 }}>
        <Field label="Order number" value="LMX-204-882" prefix="#" />
        <Field label="Phone number" prefix="+224" value="623 84 51 09" />
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Tracking')}>Track order</Button>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 28 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Recent</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <RecentTrack id="LMX-204-882" date="Today" status="On the way" emerald onPress={() => nav.navigate('Tracking')} />
          <RecentTrack id="LMX-204-431" date="Yesterday" status="Preparing" last />
        </View>
      </View>
    </Screen>
  );
}

function OrderCard({ order, onPress }: { order: any; onPress?: () => void }) {
  const statusColor = { active: LMX.emerald, prep: LMX.amber, done: LMX.ink70, refund: LMX.rose }[order.variant as string];
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={{ fontFamily: mono(600), fontSize: 12 }}>{order.id}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{order.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: order.variant === 'active' ? LMX.emeraldSoft : LMX.surfaceAlt }}>
          {order.variant === 'active' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusColor }} />}
          <Text style={{ color: statusColor, fontSize: 10.5, fontFamily: sans(700), textTransform: 'uppercase' }}>{order.status}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {order.items.slice(0, 3).map((p: any, i: number) => (
            <Image key={p.id} source={{ uri: IMG(p.slug) }} style={{ width: 38, height: 38, borderRadius: 10, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: LMX.surface }} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(500) }}>{order.items[0].name}{order.count > 1 ? ` + ${order.count - 1} more` : ''}</Text>
          <Text style={{ fontFamily: mono(400), fontSize: 12, color: LMX.ink70, marginTop: 4 }}>{fr(order.total)} <Text style={{ fontSize: 10, color: LMX.ink50 }}>GNF</Text></Text>
        </View>
      </View>
      <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: LMX.hairline, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {order.variant === 'active' && <><Text style={{ flex: 1, fontSize: 11.5, color: LMX.emerald, fontFamily: sans(600) }}>{order.eta}</Text><Button variant="primary" size="sm">Track</Button></>}
        {order.variant === 'prep' && <><Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink50 }}>Seller is preparing</Text><Button variant="soft" size="sm">Cancel</Button></>}
        {order.variant === 'done' && <><Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink50 }}>Delivered · review pending</Text><Button variant="soft" size="sm">Buy again</Button><Button variant="primary" size="sm">Review</Button></>}
        {order.variant === 'refund' && <><Text style={{ flex: 1, fontSize: 11.5, color: LMX.rose, fontFamily: sans(600) }}>Refund completed</Text><Button variant="soft" size="sm">Details</Button></>}
      </View>
    </Pressable>
  );
}

export function ScreenOrdersList() {
  const nav = useNavigation<any>();
  const orders = [
    { id: 'LMX-204-882', date: 'Today · 09:42', total: 665000, items: [PRODUCTS[1], PRODUCTS[12], PRODUCTS[8]], count: 3, status: 'On the way', variant: 'active', eta: 'ETA 11:38' },
    { id: 'LMX-204-431', date: 'Yesterday', total: 380000, items: [PRODUCTS[11]], count: 1, status: 'Preparing', variant: 'prep' },
    { id: 'LMX-203-770', date: 'Apr 28 · 16:20', total: 245000, items: [PRODUCTS[1]], count: 1, status: 'Delivered', variant: 'done' },
    { id: 'LMX-203-114', date: 'Apr 21', total: 1535000, items: [PRODUCTS[5], PRODUCTS[3]], count: 2, status: 'Delivered', variant: 'done' },
    { id: 'LMX-202-902', date: 'Apr 12', total: 95000, items: [PRODUCTS[12]], count: 1, status: 'Refunded', variant: 'refund' },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="My orders" right={<IconBtn icon="search" />} />
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 14, flexWrap: 'wrap' }}>
        <Chip active>All · 14</Chip><Chip>To pay</Chip><Chip>Preparing</Chip><Chip>On the way</Chip><Chip>Delivered</Chip><Chip>Returns</Chip>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {orders.map(o => <OrderCard key={o.id} order={o} onPress={() => nav.navigate('OrderDetails')} />)}
      </View>
      <View style={{ margin: 16, padding: 16, backgroundColor: LMX.surfaceAlt, borderRadius: LMX.r.lg, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: LMX.hairline }}>
        <Icon name="receipt" size={18} color={LMX.ink70} />
        <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70, lineHeight: 17 }}>Need a receipt? Tap any delivered order to download an invoice.</Text>
      </View>
    </Screen>
  );
}

function QuickActionTile({ icon, label, accent, onPress }: { icon: any; label: string; accent?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, paddingVertical: 14, borderRadius: LMX.r.lg, backgroundColor: accent ? LMX.ink : LMX.surface, borderWidth: accent ? 0 : 1, borderColor: LMX.border, alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={18} color={accent ? '#fff' : LMX.ink} />
      <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: accent ? '#fff' : LMX.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ScreenOrderDetails() {
  const nav = useNavigation<any>();
  const items = [
    { p: PRODUCTS[1], qty: 1, color: 'Matte black' },
    { p: PRODUCTS[12], qty: 2, color: 'Black' },
    { p: PRODUCTS[8], qty: 1, color: 'Original' },
  ];
  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="ghost" size="md" style={{ flex: 1 }}>Cancel order</Button>
        <Button variant="primary" size="md" style={{ flex: 1 }} icon="truck" onPress={() => nav.navigate('Tracking')}>Track live</Button>
      </View>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} right={<IconBtn icon="share" />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Order</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 22 }}>LMX-204-882</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: LMX.emeraldSoft }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: LMX.emerald }} />
            <Text style={{ color: LMX.emerald, fontSize: 11, fontFamily: sans(700), textTransform: 'uppercase' }}>On the way</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: LMX.ink50, marginTop: 6 }}>Placed today at 09:42 · ETA <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>11:38</Text></Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
        <QuickActionTile icon="truck" label="Track" accent onPress={() => nav.navigate('Tracking')} />
        <QuickActionTile icon="headset" label="Contact" />
        <QuickActionTile icon="receipt" label="Invoice" />
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Items · 3</Text>
      <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
        {items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center', borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: LMX.hairline }}>
            <Image source={{ uri: IMG(it.p.slug) }} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(500) }}>{it.p.name}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 3 }}>{it.color} · {it.p.seller}</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 12, marginTop: 4 }}>×{it.qty} · {fr(it.p.price * it.qty)} <Text style={{ fontSize: 9, color: LMX.ink50 }}>GNF</Text></Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Delivery & payment</Text>
      <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
        <SettingRow icon="pin" label="Boulbinet, Kaloum" sub="Aïssata Diallo · +224 ••• 5109" />
        <SettingRow icon="money" label="Cash on delivery" sub="665 000 GNF · Pay at door" last />
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Payment summary</Text>
      <View style={{ margin: 16, marginTop: 8, padding: 16, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
        <SummaryRow label="Subtotal (3 items)" value={680000} />
        <SummaryRow label="Delivery" value={25000} />
        <SummaryRow label="Promo · NEW10" value={-40000} accent />
        <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Total</Text><Price value={665000} size="md" />
        </View>
      </View>
    </Screen>
  );
}

export function ScreenReturnRequest() {
  const nav = useNavigation<any>();
  const reasons = [
    { id: 'damaged', label: 'Arrived damaged', icon: 'package', active: true },
    { id: 'wrong', label: 'Wrong item received', icon: 'refresh' },
    { id: 'quality', label: 'Quality not as described', icon: 'shield' },
    { id: 'size', label: 'Wrong size or fit', icon: 'sliders' },
    { id: 'late', label: 'Arrived too late', icon: 'truck' },
    { id: 'other', label: 'Other reason', icon: 'msg' },
  ];
  const p = PRODUCTS[4];
  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.goBack()}>Submit return request</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Request return" />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={{ uri: IMG(p.slug) }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: LMX.surfaceAlt }} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{p.name}</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 3, fontFamily: mono(400) }}>LMX-203-770 · Delivered Apr 28</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text style={{ fontFamily: mono(600), fontSize: 12.5 }}>{fr(p.price)}</Text>
              <Text style={{ fontSize: 10, color: LMX.ink50 }}>GNF</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Why are you returning this?</Text>
      <View style={{ margin: 16, marginTop: 8, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
        {reasons.map((r, i) => (
          <View key={r.id} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: i < reasons.length - 1 ? 1 : 0, borderBottomColor: LMX.hairline, backgroundColor: r.active ? LMX.accentSoft : 'transparent' }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: r.active ? LMX.accent : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={r.icon as any} size={15} color={r.active ? '#fff' : LMX.ink} /></View>
            <Text style={{ flex: 1, fontSize: 13, fontFamily: r.active ? sans(600) : sans(500), color: r.active ? LMX.accent : LMX.ink }}>{r.label}</Text>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: r.active ? LMX.accent : LMX.border, backgroundColor: r.active ? LMX.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {r.active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </View>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Tell us more (optional)</Text>
        <View style={{ backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: LMX.r.lg, padding: 14, minHeight: 80 }}>
          <Text style={{ fontSize: 13, color: LMX.ink50, lineHeight: 19 }}>Speaker has a crack on the left grill. Sound works but distorts at higher volume.</Text>
        </View>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Refund to</Text>
      <View style={{ margin: 16, marginTop: 8, padding: 16, borderRadius: LMX.r.lg, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 26, borderRadius: 6, backgroundColor: '#FF7900', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 9, fontFamily: sans(700) }}>OM</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>Orange Money · ••• 5109</Text>
          <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Refund within 2–5 business days</Text>
        </View>
        <Icon name="chevR" size={14} color={LMX.ink50} />
      </View>
    </Screen>
  );
}

function SubRating({ label, rating, last }: { label: string; rating: number; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 2 }}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={14} color={i <= rating ? LMX.amber : LMX.ink30} />)}</View>
    </View>
  );
}

export function ScreenWriteReview() {
  const nav = useNavigation<any>();
  const p = PRODUCTS[1];
  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={() => nav.goBack()}>Submit review</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Write a review" right={<Text style={{ color: LMX.ink50, fontSize: 13, fontFamily: sans(600) }}>Draft</Text>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={{ uri: IMG(p.slug) }} style={{ width: 54, height: 54, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{p.name}</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>From {p.seller}</Text>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 18, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: LMX.ink70, marginBottom: 14 }}>How would you rate this product?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={32} color={LMX.amber} strokeWidth={1.3} />)}</View>
        <Text style={{ marginTop: 12, fontFamily: FONT.displayItalic, fontSize: 18, color: LMX.emerald }}>Excellent</Text>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Rate by aspect</Text>
      <View style={{ margin: 16, marginTop: 8, padding: 16, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border }}>
        <SubRating label="Quality" rating={5} />
        <SubRating label="Value for money" rating={4} />
        <SubRating label="Delivery speed" rating={5} />
        <SubRating label="Description accuracy" rating={4} last />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: LMX.r.lg, padding: 16, minHeight: 120 }}>
          <Text style={{ fontSize: 13.5, color: LMX.ink, lineHeight: 20 }}>Studio-quality sound and the noise cancellation makes the bus commute much better. Battery easily lasts a full week of work calls.</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Add photos (optional)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Image source={{ uri: IMG(p.slug) }} style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: LMX.surfaceAlt }} />
          <View style={{ width: 76, height: 76, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', backgroundColor: LMX.surface, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="plus" size={18} color={LMX.ink70} /><Text style={{ fontSize: 10, fontFamily: sans(500), color: LMX.ink70 }}>Add</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
