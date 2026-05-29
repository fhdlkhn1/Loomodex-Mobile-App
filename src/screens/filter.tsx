import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LMX, sans, mono, shadow } from '../theme';
import { Icon } from '../Icon';
import { Screen, Button, Chip, Toggle } from '../components';

function FilterSection({ title, detail, children }: { title: string; detail?: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{title}</Text>
        {detail ? <Text style={{ fontSize: 11, color: LMX.ink50, fontFamily: mono(400) }}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function PriceSlider() {
  return (
    <View style={{ height: 28, justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: LMX.ink10, borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: '12%', right: '32%', height: 4, backgroundColor: LMX.ink, borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: '12%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: LMX.ink, ...shadow('sm') }} />
      <View style={{ position: 'absolute', left: '68%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: LMX.ink, ...shadow('sm') }} />
    </View>
  );
}

function PriceInput({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <View style={{ backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{value}</Text>
        <Text style={{ fontSize: 10, color: LMX.ink50, marginLeft: 'auto' }}>GNF</Text>
      </View>
    </View>
  );
}

function FilterRow({ label, on }: { label: string; on?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Text style={{ flex: 1, fontSize: 13, color: LMX.ink, fontFamily: sans(500) }}>{label}</Text>
      <Toggle on={on} />
    </View>
  );
}

export function ScreenFilterSheet() {
  const nav = useNavigation<any>();
  return (
    <Screen bg="rgba(15,22,32,0.45)" padTop={false} scroll={false} contentStyle={{ justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: LMX.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', ...shadow('lg') }}>
        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: LMX.ink30 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 }}>
          <Text style={{ fontSize: 18, fontFamily: sans(600) }}>Filters</Text>
          <Pressable><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.accent }}>Clear all</Text></Pressable>
        </View>
        <Screen scroll padTop={false} contentStyle={{ paddingBottom: 8 }}>
          <FilterSection title="Category">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip active>Audio</Chip><Chip>TV & Video</Chip><Chip>Wearables</Chip><Chip>Power & charge</Chip><Chip>Cameras</Chip>
            </View>
          </FilterSection>
          <FilterSection title="Price range" detail="50K – 500K GNF">
            <PriceSlider />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <PriceInput label="Min" value="50 000" /><PriceInput label="Max" value="500 000" />
            </View>
          </FilterSection>
          <FilterSection title="Minimum rating">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[5, 4, 3].map(r => (
                <View key={r} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: r === 4 ? LMX.ink : LMX.surface, borderWidth: r === 4 ? 0 : 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Icon name="star" size={13} color={r === 4 ? '#fff' : LMX.amber} />
                  <Text style={{ fontSize: 13, fontFamily: sans(600), color: r === 4 ? '#fff' : LMX.ink }}>{r}+</Text>
                </View>
              ))}
            </View>
          </FilterSection>
          <FilterSection title="Seller">
            <FilterRow label="Verified sellers only" on />
            <FilterRow label="Loomodex official" />
            <FilterRow label="Free delivery" on />
          </FilterSection>
          <FilterSection title="Brand">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip active>Loomodex</Chip><Chip>JBL</Chip><Chip>Sony</Chip><Chip>Samsung</Chip><Chip>Generic</Chip>
            </View>
          </FilterSection>
        </Screen>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
          <Button variant="ghost" size="lg" style={{ flex: 1 }} onPress={() => nav.goBack()}>Reset</Button>
          <Button variant="accent" size="lg" style={{ flex: 1.5 }} onPress={() => nav.goBack()}>Show 142 results</Button>
        </View>
      </View>
    </Screen>
  );
}
