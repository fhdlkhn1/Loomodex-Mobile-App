import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LMX, sans } from '../theme';
import { Icon, IconName } from '../Icon';
import { Screen, AppBar, IconBtn } from '../components';
import { useNotifications } from '../context/NotificationsContext';
import { AppNotification, NotificationType } from '../api/notifications';

// Icon + tint per notification type (types come from the plugin)
const LOOK: Record<NotificationType, { icon: IconName; color: string; bg: string }> = {
  order_confirmed:  { icon: 'checkCircle', color: LMX.emerald, bg: LMX.emeraldSoft },
  order_shipped:    { icon: 'package',     color: LMX.brand,   bg: LMX.brandSoft },
  driver_assigned:  { icon: 'bike',        color: LMX.brand,   bg: LMX.brandSoft },
  driver_on_way:    { icon: 'truck',       color: LMX.accent,  bg: LMX.accentSoft },
  order_delivered:  { icon: 'checkCircle', color: LMX.emerald, bg: LMX.emeraldSoft },
  order_status:     { icon: 'package',     color: LMX.brand,   bg: LMX.brandSoft },
  new_order:        { icon: 'bag',         color: LMX.brand,   bg: LMX.brandSoft },
  vendor_new_order: { icon: 'bag',         color: LMX.brand,   bg: LMX.brandSoft },
  vendor_completed: { icon: 'checkCircle', color: LMX.emerald, bg: LMX.emeraldSoft },
  ready_dispatch:   { icon: 'truck',       color: LMX.accent,  bg: LMX.accentSoft },
  promo:            { icon: 'flame',       color: LMX.rose,    bg: '#FEE2E2' },
  system:           { icon: 'bell',        color: LMX.ink70,   bg: LMX.surfaceAlt },
};

const fallback = { icon: 'bell' as IconName, color: LMX.ink70, bg: LMX.surfaceAlt };

/**
 * created_at is MySQL local time ("2026-07-15 15:30:00"). Hermes won't reliably
 * parse that with a space, so normalise to ISO and treat it as device-local.
 */
function timeAgo(mysql: string): string {
  const t = Date.parse(mysql.replace(' ', 'T'));
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Hier';
  if (d < 7) return `Il y a ${d} j`;
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function Row({ n, highlight, onPress }: { n: AppNotification; highlight: boolean; onPress: () => void }) {
  const look = LOOK[n.type] ?? fallback;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: highlight ? LMX.brandSoft : LMX.surface,
        borderBottomWidth: 1, borderBottomColor: LMX.hairline,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: look.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={look.icon} size={18} color={look.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontFamily: sans(highlight ? 700 : 600), color: LMX.ink }}>{n.title}</Text>
        <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 2, lineHeight: 17 }}>{n.body}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 5 }}>{timeAgo(n.created_at)}</Text>
      </View>
      {highlight && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LMX.rose, marginTop: 6 }} />}
    </Pressable>
  );
}

export function ScreenNotifications() {
  const nav = useNavigation<any>();
  const { items, unread, loading, hasMore, refresh, loadMore, markAllRead } = useNotifications();

  // Which rows were unread when this visit began. The badge clears the moment the
  // screen opens, but those rows stay highlighted so the user can still see what's new.
  const wasUnread = useRef<Set<number>>(new Set());

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    items.forEach(n => { if (!n.read) wasUnread.current.add(n.id); });
    if (unread > 0) markAllRead();
  }, [items, unread, markAllRead]);

  const open = (n: AppNotification) => {
    const orderId = n.data?.order_id;
    if (orderId) nav.navigate('OrderDetails', { orderId });
  };

  const empty = !loading && items.length === 0;

  return (
    <Screen scroll={!empty}>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Main'))} />}
        title="Notifications"
        bell={false}
        right={<View style={{ width: 38 }} />}
      />

      {empty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={30} color={LMX.ink30} />
          </View>
          <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink, marginTop: 4 }}>Aucune notification</Text>
          <Text style={{ fontSize: 12.5, color: LMX.ink50, textAlign: 'center', lineHeight: 18 }}>
            Vous serez informé ici du suivi de vos commandes, des offres flash et des annonces.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
            {items.map(n => (
              <Row key={n.id} n={n} highlight={wasUnread.current.has(n.id)} onPress={() => open(n)} />
            ))}
          </View>

          {loading && (
            <View style={{ paddingVertical: 18 }}>
              <ActivityIndicator color={LMX.brand} />
            </View>
          )}

          {hasMore && !loading && (
            <Pressable onPress={loadMore} style={{ alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: LMX.surfaceAlt }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>Afficher plus</Text>
            </Pressable>
          )}
        </>
      )}
    </Screen>
  );
}
