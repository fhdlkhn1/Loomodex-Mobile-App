import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LMX, FONT, sans } from '../theme';
import { Icon } from '../Icon';
import { Screen, Button, LangToggle, Wordmark } from '../components';
import { useAuth } from '../context/AuthContext';
import { IS_DRIVERS_APP } from '../appVariant';
import { t } from '../i18n';

/**
 * Shown when an account signs in to the wrong store app: a customer / seller / customer
 * service account in Loomodex Drivers, or (once the Drivers app is live) a driver or
 * logistics account in the customer app. Only option: sign out.
 */
export function ScreenWrongApp() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try { await logout(); } finally { setBusy(false); }
  };

  return (
    <Screen padTop>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <LangToggle />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80, gap: 14 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: LMX.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={IS_DRIVERS_APP ? 'bag' : 'bike'} size={34} color={LMX.accent} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 24, color: LMX.ink, textAlign: 'center' }}>
          {IS_DRIVERS_APP ? t('Application réservée aux livreurs') : t('Utilisez Loomodex Drivers')}
        </Text>
        <Text style={{ fontSize: 14, color: LMX.ink70, textAlign: 'center', lineHeight: 21 }}>
          {IS_DRIVERS_APP
            ? t("Loomodex Drivers est réservée aux livreurs, aux responsables logistiques et aux partenaires logistiques. Pour acheter, vendre ou gérer le service client, utilisez l'application Loomodex.")
            : t("Les livreurs, les responsables logistiques et les partenaires logistiques utilisent désormais l'application Loomodex Drivers. Téléchargez-la sur Google Play ou l'App Store et connectez-vous avec le même compte.")}
        </Text>
        <View style={{ width: '100%', marginTop: 10 }}>
          {busy
            ? <ActivityIndicator color={LMX.brand} />
            : <Button full variant="accent" size="lg" onPress={signOut}>{t('Se déconnecter')}</Button>}
        </View>
        <Text style={{ fontSize: 11.5, color: LMX.ink50, fontFamily: sans(500) }}>{t('Même compte, mêmes identifiants.')}</Text>
      </View>
    </Screen>
  );
}
