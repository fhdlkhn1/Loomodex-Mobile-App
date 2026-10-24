import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LMX, sans } from '../theme';
import { Icon } from '../Icon';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

/**
 * Seller application state for an account that is not a store yet (role still customer):
 * "awaiting approval" while WCFM waits for the administrator, or the refusal and its reason.
 * Re-reads the profile on focus while pending, so an approval switches to the seller tools.
 */
export function StoreApplicationBanner({ style }: { style?: any }) {
  const nav = useNavigation<any>();
  const { user, refreshUser, isVendor } = useAuth();
  const app = isVendor ? null : user?.store_application;

  useFocusEffect(useCallback(() => {
    if (app?.status === 'pending') refreshUser();
  }, [app?.status, refreshUser]));

  if (!app) return null;
  const pending = app.status === 'pending';
  const tint = pending ? LMX.amber : LMX.rose;
  const name = app.store_name ? ` « ${app.store_name} »` : '';

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: tint, backgroundColor: pending ? '#FFFBEB' : '#FFF5F5' }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={pending ? 'storefront' : 'alert'} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>
            {pending ? t('Boutique en attente d\'approbation') : t('Demande de boutique refusée')}
          </Text>
          <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 3, lineHeight: 18 }}>
            {pending
              ? t('Votre boutique%s est en cours de vérification par l\'administrateur. Vous pourrez vendre dès qu\'elle sera approuvée ; vous recevrez une notification.').replace('%s', name)
              : t('Votre demande de boutique%s n\'a pas été acceptée.').replace('%s', name)}
          </Text>
          {!pending && app.reason ? (
            <Text style={{ fontSize: 12.5, color: LMX.ink, marginTop: 6, lineHeight: 18 }}>
              {t('Motif :')} {app.reason}
            </Text>
          ) : null}
          {!pending && (
            <Pressable onPress={() => nav.navigate('Help')} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.rose }}>{t('Contacter le support')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
