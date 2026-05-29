import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LMX, FONT, sans, mono, shadow } from '../theme';
import { IMG } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Field, Wordmark } from '../components';

function Dot({ active }: { active?: boolean }) {
  return <View style={{ width: active ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: active ? LMX.ink : LMX.ink30 }} />;
}

function SocialBtn({ label, color, dark }: { label: string; color: string; dark?: boolean }) {
  return (
    <Pressable style={{
      height: 50, borderRadius: 14, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1,
    }}>
      <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: dark ? LMX.ink : '#fff', fontSize: 10, fontFamily: sans(700) }}>{label[0]}</Text>
      </View>
      <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ScreenOnboarding() {
  const nav = useNavigation<any>();
  return (
    <Screen padTop>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <Pressable onPress={() => nav.navigate('Main')}>
          <Text style={{ color: LMX.ink70, fontSize: 13, fontFamily: sans(500) }}>Skip</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
        <View style={{ height: 380 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 180, height: 220, borderRadius: 28, overflow: 'hidden', transform: [{ rotate: '-4deg' }], ...shadow('lg') }}>
            <Image source={{ uri: IMG('womens-genuine-leather-handbag') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', top: 40, right: 0, width: 150, height: 190, borderRadius: 24, overflow: 'hidden', transform: [{ rotate: '5deg' }], ...shadow('md') }}>
            <Image source={{ uri: IMG('wireless-bluetooth-headphones-pro') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 60, width: 200, height: 180, borderRadius: 26, overflow: 'hidden', transform: [{ rotate: '-2deg' }], ...shadow('md') }}>
            <Image source={{ uri: IMG('premium-perfume-gift-set') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', top: 130, right: 30, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: LMX.surface, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow('md') }}>
            <Icon name="truck" size={13} color={LMX.emerald} />
            <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.ink }}>24–48h Conakry</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 110, right: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: LMX.brand, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow('md') }}>
            <Icon name="shield" size={13} color="#fff" />
            <Text style={{ fontSize: 12, fontFamily: sans(600), color: '#fff' }}>Pay on delivery</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 28, paddingTop: 20 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 44, lineHeight: 44, color: LMX.ink }}>
          The market of Guinea, <Text style={{ fontFamily: FONT.displayItalic, color: LMX.accent }}>at your door.</Text>
        </Text>
        <Text style={{ marginTop: 16, fontSize: 14, lineHeight: 21, color: LMX.ink70 }}>
          Discover thousands of products from verified sellers across Conakry. Inspect before you pay — your trust is the rule.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}><Dot active /><Dot /><Dot /></View>
        <View style={{ flex: 1 }} />
        <Button variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('SignIn')}>Get started</Button>
      </View>
    </Screen>
  );
}

export function ScreenSignIn() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>Welcome back</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 38, lineHeight: 40, marginTop: 8, color: LMX.ink }}>
          Sign in to your{'\n'}<Text style={{ color: LMX.accent }}>Loomodex</Text> account
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 32, gap: 16 }}>
        <Field label="Phone number" prefix="+224" value="623 84 51 09" />
        <Field label="Password" value="password" trailingIcon="eye" secure />
        <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => nav.navigate('Forgot')}>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), textDecorationLine: 'underline' }}>Forgot password?</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Main')}>Sign in</Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 24 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: LMX.hairline }} />
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.4, textTransform: 'uppercase' }}>or continue with</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: LMX.hairline }} />
      </View>
      <View style={{ paddingHorizontal: 24, flexDirection: 'row', gap: 10 }}>
        <SocialBtn label="Orange Money" color="#FF7900" />
        <SocialBtn label="MTN MoMo" color="#FFCC00" dark />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: LMX.ink70 }}>New to Loomodex? </Text>
        <Pressable onPress={() => nav.navigate('SignUp')}><Text style={{ fontSize: 13, color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Create account</Text></Pressable>
      </View>
    </Screen>
  );
}

export function ScreenSignUp() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>Step 1 of 3 · Phone</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 38, marginTop: 8, color: LMX.ink }}>
          Create your{'\n'}<Text style={{ color: LMX.accent }}>Loomodex</Text> account
        </Text>
        <Text style={{ fontSize: 13, color: LMX.ink70, marginTop: 12, lineHeight: 20 }}>
          Join 5 000+ buyers across Guinea. We'll send a one-time code to verify your number.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 14 }}>
        <Field label="Full name" value="Aïssata Diallo" />
        <Field label="Phone number" prefix="+224" value="623 84 51 09" />
        <Field label="Password" value="password" trailingIcon="eye" secure />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 18, flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          <Icon name="check" size={13} color="#fff" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 12, color: LMX.ink70, lineHeight: 18, flex: 1 }}>
          I agree to Loomodex's <Text style={{ color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Terms of Use</Text> and <Text style={{ color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Privacy Policy</Text>.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('OTP')}>Send verification code</Button>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: LMX.ink70 }}>Already have an account? </Text>
        <Pressable onPress={() => nav.navigate('SignIn')}><Text style={{ fontSize: 13, color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Sign in</Text></Pressable>
      </View>
    </Screen>
  );
}

export function ScreenOTP() {
  const nav = useNavigation<any>();
  const cells = ['4', '7', '2', '1', '', ''];
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>Step 2 of 3 · Verify</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 38, marginTop: 8, color: LMX.ink }}>Enter the 6-digit{'\n'}code we sent</Text>
        <Text style={{ fontSize: 13, color: LMX.ink70, marginTop: 14, lineHeight: 20 }}>
          Sent to <Text style={{ color: LMX.ink, fontFamily: mono(600) }}>+224 623 84 51 09</Text>  ·  <Text style={{ color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Change</Text>
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
        {cells.map((d, i) => (
          <View key={i} style={{
            flex: 1, height: 64, borderRadius: 14, backgroundColor: LMX.surface,
            borderWidth: i === 4 ? 2 : 1, borderColor: i === 4 ? LMX.ink : LMX.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontFamily: mono(600), fontSize: 26, color: d ? LMX.ink : LMX.ink50 }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: LMX.ink70 }}>Didn't receive a code? <Text style={{ color: LMX.ink30 }}>Resend in <Text style={{ fontFamily: mono(600), color: LMX.ink70 }}>00:24</Text></Text></Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Main')}>Verify & continue</Button>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
        <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: LMX.hairline }}>
          <Icon name="shield" size={16} color={LMX.brand} />
          <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 16, flex: 1 }}>We use OTP to keep your account safe. Never share this code with anyone — not even Loomodex staff.</Text>
        </View>
      </View>
    </Screen>
  );
}

function ChannelOption({ icon, label, sub, selected }: { icon: any; label: string; sub: string; selected?: boolean }) {
  return (
    <View style={{
      flex: 1, padding: 14, borderRadius: LMX.r.lg, backgroundColor: LMX.surface,
      borderWidth: selected ? 2 : 1, borderColor: selected ? LMX.ink : LMX.border,
      flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={LMX.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{label}</Text>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 1, fontFamily: mono(400) }}>{sub}</Text>
      </View>
    </View>
  );
}

export function ScreenForgot() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>Account recovery</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 38, lineHeight: 40, marginTop: 8, color: LMX.ink }}>Forgot your{'\n'}password?</Text>
        <Text style={{ fontSize: 13.5, color: LMX.ink70, marginTop: 14, lineHeight: 21 }}>Enter the phone number linked to your account — we'll send a reset code via SMS.</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
        <Field label="Phone number" prefix="+224" value="623 84 51 09" />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Text style={{ fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500), marginBottom: 10 }}>Send code via</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ChannelOption icon="msg" label="SMS" sub="+224 ••• 5109" selected />
          <ChannelOption icon="phone" label="Call" sub="Voice OTP" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Reset')}>Send reset code</Button>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: LMX.ink70 }}>Remembered it? </Text>
        <Pressable onPress={() => nav.navigate('SignIn')}><Text style={{ fontSize: 13, color: LMX.ink, fontFamily: sans(600), textDecorationLine: 'underline' }}>Sign in</Text></Pressable>
      </View>
    </Screen>
  );
}

function Requirement({ label, met }: { label: string; met?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
      <View style={{
        width: 16, height: 16, borderRadius: 8, backgroundColor: met ? LMX.emerald : 'transparent',
        borderWidth: met ? 0 : 1.5, borderColor: LMX.ink30, alignItems: 'center', justifyContent: 'center',
      }}>
        {met && <Icon name="check" size={10} color="#fff" strokeWidth={3} />}
      </View>
      <Text style={{ fontSize: 12, color: met ? LMX.emerald : LMX.ink50 }}>{label}</Text>
    </View>
  );
}

export function ScreenResetPassword() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>Step 3 of 3 · New password</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 38, marginTop: 8, color: LMX.ink }}>Set a new{'\n'}password</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 14 }}>
        <Field label="New password" value="password12" trailingIcon="eye" secure />
        <Field label="Confirm password" value="password12" trailingIcon="eye" secure />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500) }}>Password strength</Text>
          <Text style={{ fontSize: 11, fontFamily: sans(700), color: LMX.emerald, textTransform: 'uppercase' }}>Strong</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3].map(i => <View key={i} style={{ flex: 1, height: 4, backgroundColor: LMX.emerald, borderRadius: 2 }} />)}
          <View style={{ flex: 1, height: 4, backgroundColor: LMX.ink10, borderRadius: 2 }} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Requirement label="At least 8 characters" met />
          <Requirement label="One uppercase letter" met />
          <Requirement label="One number" met />
          <Requirement label="One special character" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="check" onPress={() => nav.navigate('Main')}>Reset password</Button>
      </View>
    </Screen>
  );
}
