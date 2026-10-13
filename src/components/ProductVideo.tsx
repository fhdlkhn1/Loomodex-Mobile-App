import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX, sans } from '../theme';
import { Icon } from '../Icon';
import { t } from '../i18n';

const youtubeId = (url: string): string | null => {
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
};

const vimeoId = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/);
  return m ? m[1] : null;
};

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The HTML page the WebView renders: an embed for YouTube/Vimeo, else an HTML5 player. */
function videoHtml(url: string): string {
  const yt = youtubeId(url);
  const vm = !yt ? vimeoId(url) : null;
  const body = yt
    ? `<iframe src="https://www.youtube.com/embed/${yt}?playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
    : vm
      ? `<iframe src="https://player.vimeo.com/video/${vm}?playsinline=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${attr(url)}" controls playsinline webkit-playsinline preload="metadata"></video>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
iframe,video{position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:#000;object-fit:contain}</style>
</head><body>${body}</body></html>`;
}

/** Plays a product video inside the app (uploaded file, YouTube or Vimeo link). */
export function ProductVideo({ url, style }: { url: string; style?: StyleProp<ViewStyle> }) {
  const html = useMemo(() => videoHtml(url), [url]);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }, style]}>
        <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center' }}>{t('Impossible de lire la vidéo ici.')}</Text>
        <Pressable onPress={() => Linking.openURL(url).catch(() => {})} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
          <Icon name="play" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: sans(600), fontSize: 13 }}>{t('Ouvrir la vidéo')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: '#000', overflow: 'hidden' }, style]}>
      <WebView
        source={{ html, baseUrl: 'https://loomodex.com' }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        startInLoadingState
        renderLoading={() => (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        onError={() => setFailed(true)}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    </View>
  );
}
