import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Chip, CategoryGlyph } from '../components';

function ContactChannel({ icon, label, sub, accent }: { icon: any; label: string; sub: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: accent ? LMX.accent : LMX.surface, borderRadius: LMX.r.lg, paddingVertical: 14, alignItems: 'center', borderWidth: accent ? 0 : 1, borderColor: LMX.border }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: accent ? 'rgba(255,255,255,0.18)' : LMX.surfaceAlt, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} color={accent ? '#fff' : LMX.ink} /></View>
      <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: accent ? '#fff' : LMX.ink }}>{label}</Text>
      <Text style={{ fontSize: 10, marginTop: 2, color: accent ? 'rgba(255,255,255,0.75)' : LMX.ink50 }}>{sub}</Text>
    </View>
  );
}

function ArticleRow({ title, reads, last }: { title: string; reads: string; last?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="receipt" size={13} color={LMX.ink70} /></View>
      <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(500), lineHeight: 17 }}>{title}</Text>
      <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: mono(400) }}>{reads}</Text>
      <Icon name="chevR" size={13} color={LMX.ink50} />
    </View>
  );
}

export function ScreenHelp() {
  const nav = useNavigation<any>();
  const cats = [
    { id: 'orders', label: 'Orders', n: 4, icon: 'package', hue: '#E5DDF0' },
    { id: 'pay', label: 'Payments', n: 4, icon: 'money', hue: '#E2F0E9' },
    { id: 'delivery', label: 'Delivery', n: 4, icon: 'truck', hue: '#F3DDD2' },
    { id: 'returns', label: 'Returns & refunds', n: 3, icon: 'refresh', hue: '#F0DAD8' },
    { id: 'account', label: 'My account', n: 3, icon: 'user', hue: '#DCE7E0' },
    { id: 'sellers', label: 'Sellers', n: 3, icon: 'storefront', hue: '#E7E0CF' },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Help center" right={<IconBtn icon="search" />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 29, color: LMX.ink }}>How can we help, <Text style={{ fontFamily: FONT.displayItalic, color: LMX.accent }}>Aïssata?</Text></Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={18} color={LMX.ink70} /><Text style={{ flex: 1, fontSize: 13.5, color: LMX.ink50 }}>Search articles, e.g. "refund"</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 18, flexDirection: 'row', gap: 8 }}>
        <ContactChannel icon="phone" label="WhatsApp" sub="Fastest" accent /><ContactChannel icon="headset" label="Phone" sub="9–20h" /><ContactChannel icon="receipt" label="Email" sub="24h" />
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Browse by topic</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {cats.map(c => (
            <View key={c.id} style={{ width: '47.5%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.hue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Icon name={c.icon as any} size={18} color={LMX.ink} /></View>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{c.label}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 3 }}>{c.n} articles</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Most read this week</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <ArticleRow title="How to confirm receipt at the door" reads="2.4K" />
          <ArticleRow title="Pay with Orange Money — step by step" reads="1.9K" />
          <ArticleRow title="What to do if your order is damaged" reads="1.2K" />
          <ArticleRow title="Become a verified seller in 5 minutes" reads="980" last />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Pressable onPress={() => nav.navigate('Support')} style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}><Icon name="headset" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontFamily: sans(600), color: '#fff' }}>Still need help?</Text>
            <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.6, marginTop: 2 }}>Live agents · Mon–Sun · 9am–8pm</Text>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: LMX.ink, fontSize: 12.5, fontFamily: sans(600) }}>Chat</Text></View>
        </Pressable>
      </View>
    </Screen>
  );
}

function TicketCard({ t }: { t: any }) {
  const statusLabel: any = { open: 'Open', waiting: 'Waiting', solved: 'Solved' };
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.badge + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon name="ticket" size={17} color={t.badge} /></View>
        {t.unread > 0 && <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LMX.bg }}><Text style={{ color: '#fff', fontFamily: mono(700), fontSize: 10 }}>{t.unread}</Text></View>}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: mono(600), fontSize: 10.5, color: LMX.ink50 }}>{t.id}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: t.badge + '1A' }}><Text style={{ fontSize: 9.5, fontFamily: sans(700), color: t.badge, textTransform: 'uppercase' }}>{statusLabel[t.status]}</Text></View>
        </View>
        <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(600), marginTop: 4 }}>{t.subject}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 11.5, color: LMX.ink50 }}>{t.last}</Text>
          <Text style={{ fontSize: 11.5, color: LMX.ink50, fontFamily: mono(400) }}>· {t.updated}</Text>
        </View>
      </View>
    </View>
  );
}

export function ScreenSupport() {
  const nav = useNavigation<any>();
  const tickets = [
    { id: 'TKT-8821', subject: 'My speaker arrived damaged', status: 'open', last: 'Agent will call in 10 min', updated: '12m', unread: 2, badge: LMX.rose },
    { id: 'TKT-8743', subject: 'Refund timing on LMX-202-902', status: 'waiting', last: 'You: thanks for the update', updated: '2h', unread: 0, badge: LMX.amber },
    { id: 'TKT-8612', subject: 'Address change for tomorrow', status: 'solved', last: 'Marked as solved by Aïcha', updated: '1d', unread: 0, badge: LMX.emerald },
    { id: 'TKT-8104', subject: 'Receipt not received by email', status: 'solved', last: 'Receipt re-sent · resolved', updated: '5d', unread: 0, badge: LMX.emerald },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.canGoBack() ? nav.goBack() : nav.navigate('Main')} />} title="Support tickets" right={<IconBtn icon="search" />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <LinearGradient colors={['#F37524', '#C44A0E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}><Icon name="ticket" size={20} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: sans(600), color: '#fff' }}>Open a new ticket</Text>
            <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.85, marginTop: 2 }}>Avg. first reply · 14 min</Text>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: LMX.accent, fontSize: 12, fontFamily: sans(700) }}>New</Text></View>
        </LinearGradient>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Chip active>All · 12</Chip><Chip>Open · 2</Chip><Chip>Waiting · 1</Chip><Chip>Solved · 9</Chip>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>{tickets.map(t => <TicketCard key={t.id} t={t} />)}</View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Pressable onPress={() => nav.navigate('Inquiries')} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="msg" size={18} color={LMX.ink} /></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>Product inquiries</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>7 questions to sellers</Text></View>
          <Icon name="chevR" size={16} color={LMX.ink50} />
        </Pressable>
      </View>
    </Screen>
  );
}

function InquiryCard({ product, q, replied, reply, ago }: any) {
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Image source={{ uri: IMG(product.slug) }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: sans(500) }}>{product.name}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{product.seller}</Text>
        </View>
        <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: replied ? LMX.emeraldSoft : LMX.accentSoft }}><Text style={{ fontSize: 9.5, fontFamily: sans(700), color: replied ? LMX.emerald : LMX.accent, textTransform: 'uppercase' }}>{replied ? 'Replied' : 'Pending'}</Text></View>
      </View>
      <View style={{ marginTop: 12, padding: 12, backgroundColor: LMX.surfaceAlt, borderRadius: 10 }}>
        <Text style={{ fontSize: 9, fontFamily: sans(700), color: LMX.ink50, textTransform: 'uppercase' }}>You · {ago} ago</Text>
        <Text style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17 }}>{q}</Text>
      </View>
      {reply && (
        <View style={{ marginTop: 8, padding: 12, backgroundColor: replied ? LMX.brandSoft : LMX.surfaceAlt, borderRadius: 10 }}>
          <Text style={{ fontSize: 12.5, lineHeight: 17, color: replied ? LMX.brandDeep : LMX.ink50, fontStyle: replied ? 'normal' : 'italic' }}>{reply}</Text>
        </View>
      )}
    </View>
  );
}

export function ScreenInquiries() {
  const nav = useNavigation<any>();
  const items = [
    { product: PRODUCTS[6], q: 'Is the leather full-grain or top-grain?', replied: true, reply: "Maison Diallo: It's full-grain Italian leather, hand-stitched.", ago: '2h' },
    { product: PRODUCTS[5], q: 'Does the laptop come with French keyboard layout?', replied: true, reply: 'PC Center: Yes — AZERTY by default, QWERTY on request.', ago: '5h' },
    { product: PRODUCTS[2], q: 'Is delivery free to Kindia?', replied: false, reply: 'Awaiting reply from Vision Pro', ago: '1d' },
    { product: PRODUCTS[12], q: 'How many hours does it charge a phone fully?', replied: true, reply: 'Tech Bazaar: 3 full charges for a Smartphone Pro Max.', ago: '3d' },
  ];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Inquiries" right={<IconBtn icon="plus" />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 14 }}>
        <Chip active>All · 7</Chip><Chip>Awaiting reply · 1</Chip><Chip>Replied · 6</Chip>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>{items.map((it, i) => <InquiryCard key={i} {...it} />)}</View>
    </Screen>
  );
}
