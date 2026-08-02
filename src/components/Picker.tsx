import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { LMX, sans } from '../theme';
import { Icon } from '../Icon';

export interface PickerOption { value: string; label: string; }

interface PickerProps {
  label: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

/** Labelled select field that opens a modal list (RN has no native <select>). */
export function Picker({ label, value, options, placeholder, onChange, disabled, required }: PickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>
        {label}{required ? ' *' : ''}
      </Text>
      <Pressable
        onPress={() => !disabled && options.length > 0 && setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: disabled ? LMX.surfaceAlt : LMX.surface,
          borderWidth: 1, borderColor: LMX.border, borderRadius: 14, paddingHorizontal: 16, height: 54, opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: sans(selected ? 500 : 400), fontSize: 14.5, color: selected ? LMX.ink : LMX.ink50 }}>
          {selected ? selected.label : (placeholder ?? 'Sélectionner…')}
        </Text>
        <Icon name="chevD" size={16} color={LMX.ink50} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: LMX.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
              <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink }}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={16} color={LMX.ink} />
              </Pressable>
            </View>
            <ScrollView>
              {options.map(o => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => { onChange(o.value); setOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: LMX.hairline, backgroundColor: active ? LMX.brandSoft : 'transparent' }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: sans(active ? 600 : 400), color: active ? LMX.brand : LMX.ink }}>{o.label}</Text>
                    {active && <Icon name="check" size={16} color={LMX.brand} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
