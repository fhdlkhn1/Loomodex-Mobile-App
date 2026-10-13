import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX } from '../theme';
import type { LogisticsDriver } from '../api/delivery';

/** A GPS position older than this is "stale" (orange marker). */
export const DRIVER_STALE_SECONDS = 10 * 60;

export type DriverMapState = 'fresh' | 'stale' | 'off';

export const DRIVER_STATE_COLOR: Record<DriverMapState, string> = {
  fresh: '#10B981',
  stale: '#FF7A00',
  off:   '#9AA3AF',
};

export function driverMapState(d: LogisticsDriver): DriverMapState {
  if (d.available === false) return 'off';
  const age = d.loc_at ? Date.now() / 1000 - d.loc_at : Infinity;
  return d.stale || age > DRIVER_STALE_SECONDS ? 'stale' : 'fresh';
}

export function hasPosition(d: LogisticsDriver): boolean {
  return d.lat != null && d.lng != null && !(d.lat === 0 && d.lng === 0);
}

interface Props {
  mapsKey: string;
  drivers: LogisticsDriver[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Google Maps (WebView) with every driver that has shared a position. Marker colour:
 * green = available & fresh, orange = available but stale, grey = unavailable.
 * Driver data is injected on each refresh so the map never reloads.
 */
export function DriversMap({ mapsKey, drivers, selectedId, onSelect, style }: Props) {
  const ref = useRef<WebView>(null);
  const html = useMemo(() => buildHtml(mapsKey), [mapsKey]);
  const source = useMemo(() => ({ html }), [html]);

  const payload = useMemo(() => JSON.stringify(
    drivers.filter(hasPosition).map(d => ({
      id: d.id, lat: d.lat, lng: d.lng, name: d.name, color: DRIVER_STATE_COLOR[driverMapState(d)],
    }))
  ), [drivers]);

  const push = () => ref.current?.injectJavaScript(`window.lmxSetDrivers && window.lmxSetDrivers(${payload}); true;`);

  useEffect(() => { push(); }, [payload]);

  useEffect(() => {
    if (selectedId != null) ref.current?.injectJavaScript(`window.lmxFocus && window.lmxFocus(${selectedId}); true;`);
  }, [selectedId]);

  return (
    <View style={[{ borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border, backgroundColor: '#EAE6DA' }, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onLoadEnd={push}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m?.type === 'select' && typeof m.id === 'number') onSelect(m.id);
            if (m?.type === 'ready') push();
          } catch {}
        }}
      />
    </View>
  );
}

function buildHtml(key: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA}</style>
</head><body>
<div id="map"></div>
<script>
  var map, iw, markers = {}, DATA = null, fitted = false;
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function esc(s){ return String(s||'').replace(/[<>&"]/g,''); }
  function dot(color){ return {path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:color, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }
  function render(){
    if(!map || !DATA) return;
    var seen = {};
    DATA.forEach(function(d){
      seen[d.id] = true;
      var pos = {lat:d.lat, lng:d.lng};
      var m = markers[d.id];
      if(!m){
        m = new google.maps.Marker({position:pos, map:map, title:d.name});
        m.addListener('click', function(){ openInfo(d.id); post({type:'select', id:d.id}); });
        markers[d.id] = m;
      } else { m.setPosition(pos); }
      m.setIcon(dot(d.color));
      m.lmxName = d.name;
    });
    Object.keys(markers).forEach(function(id){ if(!seen[id]){ markers[id].setMap(null); delete markers[id]; } });
    if(!fitted && DATA.length){
      fitted = true;
      var b = new google.maps.LatLngBounds();
      DATA.forEach(function(d){ b.extend({lat:d.lat, lng:d.lng}); });
      if(DATA.length === 1){ map.setCenter(b.getCenter()); map.setZoom(15); }
      else { map.fitBounds(b, 60); google.maps.event.addListenerOnce(map,'idle',function(){ if(map.getZoom()>16) map.setZoom(16); }); }
    }
  }
  function openInfo(id){
    var m = markers[id]; if(!m) return;
    iw.setContent('<div style="font:600 12px sans-serif;padding:2px 4px">'+esc(m.lmxName)+'</div>');
    iw.open({map:map, anchor:m});
  }
  window.lmxSetDrivers = function(list){ DATA = list; render(); };
  window.lmxFocus = function(id){ var m = markers[id]; if(!m || !map) return; map.panTo(m.getPosition()); if(map.getZoom()<15) map.setZoom(15); openInfo(id); };
  function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {center:CONAKRY, zoom:12, disableDefaultUI:true, zoomControl:true, gestureHandling:'greedy'});
    iw = new google.maps.InfoWindow({disableAutoPan:true});
    render();
    post({type:'ready'});
  }
  window.initMap = initMap;
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap"></script>
</body></html>`;
}
