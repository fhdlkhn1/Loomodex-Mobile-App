import React from 'react';
import Svg, { Path, Circle, Rect, G, SvgProps } from 'react-native-svg';

export type IconName =
  | 'home' | 'search' | 'bag' | 'heart' | 'user' | 'chevL' | 'chevR' | 'chevD' | 'chevU'
  | 'close' | 'plus' | 'minus' | 'filter' | 'sliders' | 'star' | 'share' | 'pin' | 'truck'
  | 'check' | 'checkCircle' | 'shield' | 'qr' | 'bell' | 'mic' | 'flame' | 'arrowR'
  | 'arrowDownLeft' | 'eye' | 'grid' | 'list' | 'location' | 'phone' | 'package' | 'refresh'
  | 'sparkle' | 'tag' | 'money' | 'moMo' | 'receipt' | 'settings' | 'storefront' | 'headset'
  | 'wallet' | 'card' | 'bike' | 'key' | 'ticket' | 'msg' | 'chart' | 'pencil' | 'arrowU'
  | 'arrowD' | 'download';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = '#0F1620', strokeWidth = 1.6 }: Props) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  const svg: SvgProps = { width: size, height: size, viewBox: '0 0 24 24' };
  const paths: Record<IconName, React.ReactNode> = {
    home: <Path {...s} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    search: <><Circle {...s} cx="11" cy="11" r="7" /><Path {...s} d="m20 20-3.5-3.5" /></>,
    bag: <><Path {...s} d="M5 7h14l-1 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" /><Path {...s} d="M9 7V5a3 3 0 0 1 6 0v2" /></>,
    heart: <Path {...s} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
    user: <><Circle {...s} cx="12" cy="8" r="4" /><Path {...s} d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>,
    chevL: <Path {...s} d="m15 6-6 6 6 6" />,
    chevR: <Path {...s} d="m9 6 6 6-6 6" />,
    chevD: <Path {...s} d="m6 9 6 6 6-6" />,
    chevU: <Path {...s} d="m6 15 6-6 6 6" />,
    close: <Path {...s} d="M6 6l12 12M18 6 6 18" />,
    plus: <Path {...s} d="M12 5v14M5 12h14" />,
    minus: <Path {...s} d="M5 12h14" />,
    filter: <Path {...s} d="M3 6h18M6 12h12M10 18h4" />,
    sliders: <><Path {...s} d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><Circle {...s} cx="16" cy="6" r="2" /><Circle {...s} cx="8" cy="12" r="2" /><Circle {...s} cx="18" cy="18" r="2" /></>,
    star: <Path {...s} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3 9.4l6-.9z" />,
    share: <><Circle {...s} cx="6" cy="12" r="2.5" /><Circle {...s} cx="18" cy="6" r="2.5" /><Circle {...s} cx="18" cy="18" r="2.5" /><Path {...s} d="m8 11 8-4M8 13l8 4" /></>,
    pin: <><Path {...s} d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><Circle {...s} cx="12" cy="10" r="2.5" /></>,
    truck: <><Path {...s} d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><Circle {...s} cx="7" cy="18" r="2" /><Circle {...s} cx="17" cy="18" r="2" /></>,
    check: <Path {...s} d="m5 12 5 5L20 7" />,
    checkCircle: <><Circle {...s} cx="12" cy="12" r="9" /><Path {...s} d="m8 12 3 3 5-6" /></>,
    shield: <><Path {...s} d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" /><Path {...s} d="m9 12 2 2 4-4" /></>,
    qr: <><Rect {...s} x="3" y="3" width="7" height="7" rx="1" /><Rect {...s} x="14" y="3" width="7" height="7" rx="1" /><Rect {...s} x="3" y="14" width="7" height="7" rx="1" /><Path {...s} d="M14 14h3v3M20 14v3M14 20h3M20 20h0" /></>,
    bell: <><Path {...s} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><Path {...s} d="M10 21a2 2 0 0 0 4 0" /></>,
    mic: <><Rect {...s} x="9" y="3" width="6" height="11" rx="3" /><Path {...s} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    flame: <Path {...s} d="M12 22c4 0 7-3 7-7 0-3-2-4-3-7-3 2-4 5-6 4-1-1-1-3 0-5-3 1-5 5-5 8 0 4 3 7 7 7z" />,
    arrowR: <Path {...s} d="M5 12h14M13 6l6 6-6 6" />,
    arrowDownLeft: <Path {...s} d="M17 7 7 17M7 9v8h8" />,
    eye: <><Path {...s} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><Circle {...s} cx="12" cy="12" r="3" /></>,
    grid: <><Rect {...s} x="3" y="3" width="7" height="7" rx="1" /><Rect {...s} x="14" y="3" width="7" height="7" rx="1" /><Rect {...s} x="3" y="14" width="7" height="7" rx="1" /><Rect {...s} x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><Path {...s} d="M8 6h13M8 12h13M8 18h13" /><Circle {...s} cx="4" cy="6" r="1" /><Circle {...s} cx="4" cy="12" r="1" /><Circle {...s} cx="4" cy="18" r="1" /></>,
    location: <><Path {...s} d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><Circle {...s} cx="12" cy="10" r="2.5" /></>,
    phone: <Path {...s} d="M22 17v3a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 19 19 0 0 1-6-6A19 19 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2H7l2 5-2 1a13 13 0 0 0 6 6l1-2 5 2z" />,
    package: <><Path {...s} d="M3 7 12 3l9 4v10l-9 4-9-4z" /><Path {...s} d="M3 7l9 4 9-4M12 11v10" /></>,
    refresh: <Path {...s} d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.5L3 16M3 21v-5h5" />,
    sparkle: <Path {...s} d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />,
    tag: <><Path {...s} d="M3 12V4h8l10 10-8 8z" /><Circle {...s} cx="8" cy="8" r="1.5" /></>,
    money: <><Rect {...s} x="2" y="6" width="20" height="12" rx="2" /><Circle {...s} cx="12" cy="12" r="2.5" /><Path {...s} d="M6 9h0M18 15h0" /></>,
    moMo: <><Circle {...s} cx="12" cy="12" r="9" /><Path {...s} d="M7 14V9l3 4 3-4v5M16 9v5h1" /></>,
    receipt: <><Path {...s} d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" /><Path {...s} d="M8 8h8M8 12h8M8 16h5" /></>,
    settings: <><Circle {...s} cx="12" cy="12" r="3" /><Path {...s} d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3h0a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5h0a1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8v0a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z" /></>,
    storefront: <Path {...s} d="M3 9 5 4h14l2 5M3 9v11h18V9M3 9h18M9 14h6" />,
    headset: <Path {...s} d="M3 14v-2a9 9 0 0 1 18 0v2M3 14v4a2 2 0 0 0 2 2h2v-6H3M21 14v4a2 2 0 0 1-2 2h-2v-6h4" />,
    wallet: <><Path {...s} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H5a2 2 0 0 1 0-4h14V5a1 1 0 0 0-1-1H5a2 2 0 0 0-2 3z" /><Circle {...s} cx="17" cy="13" r="1.5" /></>,
    card: <><Rect {...s} x="2" y="6" width="20" height="13" rx="2" /><Path {...s} d="M2 11h20M6 16h3" /></>,
    bike: <><Circle {...s} cx="6" cy="17" r="3" /><Circle {...s} cx="18" cy="17" r="3" /><Path {...s} d="M6 17 10 9h4l3 8M14 9h-3M14 5h3l1 4" /></>,
    key: <><Circle {...s} cx="8" cy="14" r="4" /><Path {...s} d="M11 12.5 21 3M17 7l3 3M15 9l3 3" /></>,
    ticket: <><Path {...s} d="M3 8v3a2 2 0 0 1 0 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" /><Path {...s} d="M9 6v12" strokeDasharray="2 2" /></>,
    msg: <><Path {...s} d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4 1 4z" /><Path {...s} d="M8 11h0M12 11h0M16 11h0" /></>,
    chart: <Path {...s} d="M3 21h18M5 17V9M10 17V5M15 17v-6M20 17v-9" />,
    pencil: <Path {...s} d="m4 20 4-1L20 7l-3-3L5 16zM13 6l3 3" />,
    arrowU: <Path {...s} d="M12 19V5M5 12l7-7 7 7" />,
    arrowD: <Path {...s} d="M12 5v14M5 12l7 7 7-7" />,
    download: <Path {...s} d="M12 4v12M6 12l6 6 6-6M4 20h16" />,
  };
  return <Svg {...svg}>{paths[name]}</Svg>;
}

export function CategoryGlyph({ id, size = 28 }: { id: string; size?: number }) {
  const c = '#1a1814';
  const s = { stroke: c, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  const svg: SvgProps = { width: size, height: size, viewBox: '0 0 24 24' };
  switch (id) {
    case 'phones':
      return <Svg {...svg}><Rect {...s} x="7" y="3" width="10" height="18" rx="2" /><Path {...s} d="M11 18h2" /></Svg>;
    case 'fashion':
      return <Svg {...svg}><Path {...s} d="M8 4 5 7l2 2 1-1v12h8V8l1 1 2-2-3-3-3 1h-2z" /></Svg>;
    case 'electronics':
      return <Svg {...svg}><Rect {...s} x="3" y="6" width="14" height="10" rx="1.5" /><Path {...s} d="M17 9h3v4h-3M7 19h6" /></Svg>;
    case 'beauty':
      return <Svg {...svg}><Path {...s} d="M9 3h6v3l-2 2v3h-2V8L9 6z" /><Rect {...s} x="8" y="11" width="8" height="10" rx="2" /></Svg>;
    case 'home':
      return <Svg {...svg}><Path {...s} d="M5 8h14l-1 12H6zM9 8V4h6v4" /></Svg>;
    case 'laptops':
      return <Svg {...svg}><Rect {...s} x="4" y="5" width="16" height="11" rx="1.5" /><Path {...s} d="M2 19h20" /></Svg>;
    case 'baby':
      return <Svg {...svg}><Circle {...s} cx="12" cy="8" r="4" /><Path {...s} d="M8 14c-3 1-4 4-4 6h16c0-2-1-5-4-6" /></Svg>;
    case 'sports':
      return <Svg {...svg}><Circle {...s} cx="12" cy="12" r="9" /><Path {...s} d="M12 3c2 3 2 6 0 9s-2 6 0 9M3 12c3-2 6-2 9 0s6 2 9 0" /></Svg>;
    default:
      return null;
  }
}
