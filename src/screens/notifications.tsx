import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LMX, sans } from '../theme';
import { Icon, IconName } from '../Icon';
import { Screen, AppBar, IconBtn } from '../components';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../api/notifications';
import { openNotificationTarget } from '../notificationRouting';
import { appRoleFor } from '../roles';
import { t, locale } from '../i18n';

type Look = { icon: IconName; color: string; bg: string };
const OK: Look    = { icon: 'checkCircle', color: LMX.emerald, bg: LMX.emeraldSoft };
const INFO: Look  = { icon: 'package',     color: LMX.brand,   bg: LMX.brandSoft };
const ROAD: Look  = { icon: 'truck',       color: LMX.accent,  bg: LMX.accentSoft };
const RIDER: Look = { icon: 'bike',        color: LMX.brand,   bg: LMX.brandSoft };
const NEW: Look   = { icon: 'bag',         color: LMX.brand,   bg: LMX.brandSoft };
const MONEY: Look = { icon: 'money',       color: LMX.accent,  bg: LMX.accentSoft };
const BAD: Look   = { icon: 'alert',       color: LMX.rose,    bg: '#FEE2E2' };

// Icon + tint per notification type (event types come from the plugin's catalogue;
// the older status-based types are kept for existing history rows).
const LOOK: Record<string, Look> = {
  order_placed: NEW, new_order: NEW, vendor_new_order: NEW,
  fee_review_needed: MONEY, fee_adjusted: MONEY, fee_accepted: MONEY, fee_declined: BAD,
  order_confirmed: OK, order_rejected: BAD, order_cancelled: BAD,
  partner_assigned: ROAD, partner_transferred_away: ROAD, ready_dispatch: ROAD,
  driver_assigned: RIDER, driver_unassigned: RIDER,
  picked_up: ROAD, driver_on_way: ROAD, order_shipped: INFO,
  driver_arrived: { icon: 'pin', color: LMX.accent, bg: LMX.accentSoft },
  delivered: OK, order_delivered: OK, vendor_completed: OK,
  delivery_failed: BAD,
  address_changed: { icon: 'location', color: LMX.brand, bg: LMX.brandSoft },
  incident_reported: BAD, incident_resolved: OK,
  remittance_recorded: { icon: 'wallet', color: LMX.emerald, bg: LMX.emeraldSoft },
  order_packed: { icon: 'package', color: LMX.emerald, bg: LMX.emeraldSoft },
  order_status: INFO,
  promo: { icon: 'flame', color: LMX.rose, bg: '#FEE2E2' },
  system: { icon: 'bell', color: LMX.ink70, bg: LMX.surfaceAlt },
};

const fallback: Look = { icon: 'bell', color: LMX.ink70, bg: LMX.surfaceAlt };

/**
 * created_at is MySQL local time ("2026-07-15 15:30:00"). Hermes won't reliably
 * parse that with a space, so normalise to ISO and treat it as device-local.
 */
function timeAgo(mysql: string): string {
  const ts = Date.parse(mysql.replace(' ', 'T'));
  if (Number.isNaN(ts)) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return t("À l'instant");
  if (mins < 60) return t('Il y a {n} min', { n: mins });
  const h = Math.floor(mins / 60);
  if (h < 24) return t('Il y a {n} h', { n: h });
  const d = Math.floor(h / 24);
  if (d === 1) return t('Hier');
  if (d < 7) return t('Il y a {n} j', { n: d });
  return new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

function Row({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const look = LOOK[n.type] ?? fallback;
  const unread = !n.read;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: unread ? LMX.brandSoft : LMX.surface,
        borderBottomWidth: 1, borderBottomColor: LMX.hairline,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: look.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={look.icon} size={18} color={look.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontFamily: sans(unread ? 700 : 600), color: LMX.ink }}>{n.title}</Text>
        <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 2, lineHeight: 17 }}>{n.body}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 5 }}>{timeAgo(n.created_at)}</Text>
      </View>
      {unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LMX.rose, marginTop: 6 }} />}
    </Pressable>
  );
}

/**
 * Inbox for every role. Rows stay highlighted until opened (or "mark all read");
 * tapping one marks it read and opens the screen it is about for the recipient's role.
 */
export function ScreenNotifications() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { items, unread, loading, hasMore, refresh, loadMore, markRead, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onPull = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  const open = async (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (opening) return;
    setOpening(true);
    try {
      await openNotificationTarget(nav, { type: n.type, ...(n.data ?? {}) }, user?.roles);
    } finally {
      setOpening(false);
    }
  };

  const isCustomer = appRoleFor(user?.roles) === 'customer';
  const empty = !loading && items.length === 0;

  return (
    <Screen
      scroll={!empty}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={LMX.brand} colors={[LMX.brand]} />}
    >
      <AppBar
        left={nav.canGoBack() ? <IconBtn icon="chevL" onPress={() => nav.goBack()} /> : <View style={{ width: 38 }} />}
        title={t('Notifications')}
        bell={false}
        right={<View style={{ width: 38 }} />}
      />

      {empty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={30} color={LMX.ink30} />
          </View>
          <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink, marginTop: 4 }}>{t('Aucune notification')}</Text>
          <Text style={{ fontSize: 12.5, color: LMX.ink50, textAlign: 'center', lineHeight: 18 }}>
            {isCustomer
              ? t('Vous serez informé ici du suivi de vos commandes, des offres flash et des annonces.')
              : t('Vous serez informé ici des commandes et des actions qui vous concernent.')}
          </Text>
          <Pressable onPress={onPull} style={{ marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: LMX.surfaceAlt }}>
            <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{refreshing ? t('Chargement…') : t('Actualiser')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {unread > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 }}>
              <Text style={{ fontSize: 12.5, color: LMX.ink70, fontFamily: sans(600) }}>
                {unread === 1 ? t('1 non lue') : t('{n} non lues', { n: unread })}
              </Text>
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={{ fontSize: 12.5, color: LMX.brand, fontFamily: sans(600) }}>{t('Tout marquer comme lu')}</Text>
              </Pressable>
            </View>
          )}

          <View style={{ backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
            {items.map(n => (
              <Row key={n.id} n={n} onPress={() => open(n)} />
            ))}
          </View>

          {((loading && !refreshing) || opening) && (
            <View style={{ paddingVertical: 18 }}>
              <ActivityIndicator color={LMX.brand} />
            </View>
          )}

          {hasMore && !loading && (
            <Pressable onPress={loadMore} style={{ alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: LMX.surfaceAlt }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{t('Afficher plus')}</Text>
            </Pressable>
          )}
        </>
      )}
    </Screen>
  );
}
