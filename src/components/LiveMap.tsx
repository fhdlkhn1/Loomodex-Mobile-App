import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX, sans } from '../theme';
import { t, getLanguage } from '../i18n';

export interface LatLng { lat: number; lng: number; }

/** A labelled pin that is shown on the map but not part of the driving route. */
export interface MapPin { lat?: number | null; lng?: number | null; label?: string; color?: string; }

/** One turn-by-turn instruction of the driving route. */
export interface NavStep { text: string; distance: string; maneuver?: string; }

/** Route / map health, reported by the map so screens can show a clear message + "Retry". */
export type RouteStatus =
  | { kind: 'ok' }
  /** Road route unavailable — a straight line is drawn. reason = Google status (REQUEST_DENIED, ZERO_RESULTS…). */
  | { kind: 'fallback'; reason: string; km: number }
  /** The destination address could not be located. */
  | { kind: 'nodest' }
  /** Google Maps itself failed: 'auth' = key refused / billing, 'load' = no connection. */
  | { kind: 'map-error'; reason: 'auth' | 'load' };

/** Pin colours shared by every map (legend + markers). */
export const PIN_COLOR = { store: '#FF7A00', customer: '#10B981', driver: '#1E6BFF' } as const;

interface LiveMapProps {
  mapsKey: string;
  driver: LatLng | null;
  destination: { lat?: number | null; lng?: number | null; address?: string; city?: string };
  height?: number;
  /** Name shown on the destination pin (e.g. the store name). */
  destinationLabel?: string;
  /** Destination pin colour (default green = customer). */
  destinationColor?: string;
  /** Third pin (e.g. the store once the parcel is picked up, or the customer before pickup). */
  extra?: MapPin | null;
  /** Name shown when the driver pin is tapped. */
  driverLabel?: string;
  onEta?: (eta: { duration: string; distance: string; steps?: NavStep[] }) => void;
  onRouteStatus?: (status: RouteStatus) => void;
  /** Change this number to re-centre the map on the route (e.g. a "Recentrer" button). */
  recenterKey?: number;
  /** Corner radius / border (full-screen navigation uses false). */
  rounded?: boolean;
}

const has = (p?: { lat?: number | null; lng?: number | null } | null): p is { lat: number; lng: number } =>
  !!p && typeof p.lat === 'number' && typeof p.lng === 'number';

/**
 * Google Maps live tracking in a WebView (Expo Go compatible). Shows up to three pins —
 * the driver, the destination (store or customer) and an optional extra pin — draws the
 * driving route driver → destination, and reports the ETA + distance back to React Native
 * via postMessage. Position changes are injected so the map never reloads.
 */
export function LiveMap({ mapsKey, driver, destination, height = 240, destinationLabel, destinationColor, extra, driverLabel, onEta, onRouteStatus, recenterKey, rounded = true }: LiveMapProps) {
  const ref = useRef<WebView>(null);
  // Bumped when the system kills the WebView renderer (memory pressure) → remount the map
  // instead of letting Android close the whole app.
  const [renderKey, setRenderKey] = useState(0);
  // Latest positions: the map page is (re)built from them, so a page rebuilt after a renderer
  // crash starts with the current driver / destination instead of the first-mount values.
  const latest = useRef({ driver, destination, extra });
  latest.current = { driver, destination, extra };

  const html = useMemo(() => buildHtml(mapsKey, latest.current.driver, latest.current.destination, {
    destLabel: destinationLabel, destColor: destinationColor,
    extra: latest.current.extra ?? null,
    driverTitle: driverLabel || t('Livreur'), destTitle: t('Destination'),
    lang: getLanguage(),
  }), [mapsKey, renderKey]);

  // Once the page has loaded, send the current positions again: the GPS watch only reports
  // movement, so a standing driver would otherwise stay off a freshly (re)loaded map.
  const onLoadEnd = () => {
    const { driver: d, destination: dest, extra: x } = latest.current;
    const js: string[] = [];
    if (d) js.push(`window.lmxUpdateDriver && window.lmxUpdateDriver(${d.lat}, ${d.lng});`);
    if (has(dest)) js.push(`window.lmxUpdateDest && window.lmxUpdateDest(${dest.lat}, ${dest.lng});`);
    if (has(x)) js.push(`window.lmxUpdateExtra && window.lmxUpdateExtra(${x.lat}, ${x.lng});`);
    if (js.length && ref.current) ref.current.injectJavaScript(js.join(' ') + ' true;');
  };
  // Stable source object — prevents the WebView from reloading the map on every re-render (polling)
  const source = useMemo(() => ({ html }), [html]);

  useEffect(() => {
    if (driver && ref.current) {
      ref.current.injectJavaScript(`window.lmxUpdateDriver && window.lmxUpdateDriver(${driver.lat}, ${driver.lng}); true;`);
    }
  }, [driver?.lat, driver?.lng]);

  // Update destination (e.g. customer's live location changes) without reload
  useEffect(() => {
    if (destination?.lat != null && destination?.lng != null && ref.current) {
      ref.current.injectJavaScript(`window.lmxUpdateDest && window.lmxUpdateDest(${destination.lat}, ${destination.lng}); true;`);
    }
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    if (has(extra) && ref.current) {
      ref.current.injectJavaScript(`window.lmxUpdateExtra && window.lmxUpdateExtra(${extra.lat}, ${extra.lng}); true;`);
    }
  }, [extra?.lat, extra?.lng]);

  useEffect(() => {
    if (recenterKey && ref.current) ref.current.injectJavaScript(`window.lmxRecenter && window.lmxRecenter(); true;`);
  }, [recenterKey]);

  return (
    <View style={[{ height, overflow: 'hidden', backgroundColor: '#EAE6DA' }, rounded && { borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border }]}>
      <WebView
        key={renderKey}
        ref={ref}
        originWhitelist={['*']}
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onLoadEnd={onLoadEnd}
        onRenderProcessGone={() => setRenderKey(k => k + 1)}
        onContentProcessDidTerminate={() => setRenderKey(k => k + 1)}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === 'eta' && onEta) onEta({ duration: msg.duration, distance: msg.distance, steps: msg.steps });
            else if (msg?.type === 'route' && onRouteStatus) {
              if (msg.status === 'ok') onRouteStatus({ kind: 'ok' });
              else if (msg.status === 'nodest') onRouteStatus({ kind: 'nodest' });
              else onRouteStatus({ kind: 'fallback', reason: String(msg.reason || ''), km: Number(msg.km) || 0 });
            } else if (msg?.type === 'maperror' && onRouteStatus) {
              onRouteStatus({ kind: 'map-error', reason: msg.reason === 'auth' ? 'auth' : 'load' });
            }
          } catch {}
        }}
      />
    </View>
  );
}

/** Colour legend under a map: one chip per pin actually shown. */
export function MapLegend({ items }: { items: { color: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 }}>
      {items.map(it => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.color }} />
          <Text style={{ fontSize: 11, color: LMX.ink70, fontFamily: sans(500) }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const js = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

function buildHtml(key: string, driver: LatLng | null, dest: LiveMapProps['destination'], o: {
  destLabel?: string; destColor?: string; extra: MapPin | null; driverTitle: string; destTitle: string; lang: string;
}): string {
  // Only geocode when there is an actual address to look up (no pin and no address = no destination pin).
  const destAddress = (dest.address || dest.city) ? `${dest.address ?? ''} ${dest.city ?? 'Conakry'}, Guinée`.trim() : '';
  const d = driver ? `{lat:${driver.lat},lng:${driver.lng}}` : 'null';
  const destLL = has(dest) ? `{lat:${dest.lat},lng:${dest.lng}}` : 'null';
  const extraLL = has(o.extra) ? `{lat:${o.extra.lat},lng:${o.extra.lng}}` : 'null';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA}</style>
</head><body>
<div id="map"></div>
<script>
  var map, driverMarker, destMarker, extraMarker, dirSvc, dirRenderer, fallbackLine;
  var DRIVER = ${d};
  var DEST_LL = ${destLL};
  var EXTRA_LL = ${extraLL};
  var DEST_ADDR = ${js(destAddress)};
  var DEST_LABEL = ${js(o.destLabel ?? '')};
  var EXTRA_LABEL = ${js(o.extra?.label ?? '')};
  var EXTRA_COLOR = ${js(o.extra?.color ?? PIN_COLOR.store)};
  var DRIVER_TITLE = ${js(o.driverTitle)};
  var DRIVER_COLOR = ${js(PIN_COLOR.driver)};
  var DEST_TITLE = ${js(o.destTitle)};
  var DEST_COLOR = ${js(o.destColor ?? PIN_COLOR.customer)};
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  var lastDir = 0;
  var useFallback = false; // true once Directions is unavailable (billing/quota/denied)
  var userMoved = false;   // the viewer panned the map: stop auto-fitting until "recentre"

  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  // Google calls this when the key is refused (invalid key, API not enabled, billing off).
  window.gm_authFailure = function(){ post({type:'maperror', reason:'auth'}); };
  function stepText(html){
    return String(html||'').replace(/<div[^>]*>/g,' — ').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ').trim();
  }
  function esc(s){ return String(s).replace(/[<>&]/g,''); }

  // Great-circle distance (km) — no Directions/geometry library needed.
  function haversine(a, b){
    var R=6371, toR=Math.PI/180;
    var dLat=(b.lat()-a.lat())*toR, dLng=(b.lng()-a.lng())*toR;
    var la1=a.lat()*toR, la2=b.lat()*toR;
    var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return 2*R*Math.asin(Math.sqrt(h));
  }
  // Straight dashed line between driver and destination — shown whenever the Directions
  // route can't be drawn, so the viewer always sees the connection.
  function drawFallbackLine(){
    if(!driverMarker || !destMarker) return;
    var path=[driverMarker.getPosition(), destMarker.getPosition()];
    if(!fallbackLine){
      fallbackLine = new google.maps.Polyline({ map:map, path:path, geodesic:true, strokeOpacity:0,
        icons:[{ icon:{ path:'M 0,-1 0,1', strokeOpacity:0.9, strokeColor:DRIVER_COLOR, scale:3 }, offset:'0', repeat:'14px' }] });
    } else { fallbackLine.setPath(path); fallbackLine.setMap(map); }
    var km=haversine(path[0], path[1]);
    post({type:'eta', duration:'', distance:(km<1 ? Math.round(km*1000)+' m' : km.toFixed(1)+' km')});
  }
  function clearFallbackLine(){ if(fallbackLine){ fallbackLine.setMap(null); } }
  function fit(force){
    if(!map) return;
    if(userMoved && !force) return;
    var b = new google.maps.LatLngBounds(); var n=0;
    [driverMarker, destMarker, extraMarker].forEach(function(m){ if(m){ b.extend(m.getPosition()); n++; } });
    if(n>1){ map.fitBounds(b, 70); google.maps.event.addListenerOnce(map,'idle',function(){ if(map.getZoom()>16) map.setZoom(16); }); }
    else if(n===1){ map.setCenter(b.getCenter()); if(map.getZoom()<14) map.setZoom(15); }
  }
  function dot(color){ return {path:google.maps.SymbolPath.CIRCLE, scale:9, fillColor:color, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }
  function infoOn(marker, label, open){
    if(!label) return;
    var iw = new google.maps.InfoWindow({content:'<div style="font:600 12px sans-serif;padding:2px 4px">'+esc(label)+'</div>', disableAutoPan:true});
    if(open) iw.open({map:map, anchor:marker});
    marker.addListener('click', function(){ iw.open({map:map, anchor:marker}); });
  }

  function route(){
    if(!driverMarker || !destMarker || !dirSvc) return;
    // If we've already fallen back, keep the straight line following the markers each update.
    if(useFallback) drawFallbackLine();
    var now = Date.now(); if(now - lastDir < 45000) return; lastDir = now;
    dirSvc.route({origin:driverMarker.getPosition(), destination:destMarker.getPosition(), travelMode:'DRIVING'}, function(res, st){
      if(st==='OK' && res.routes[0]){
        useFallback = false; clearFallbackLine();
        dirRenderer.setDirections(res);
        var leg = res.routes[0].legs[0];
        var steps = (leg.steps||[]).map(function(s){ return {text:stepText(s.instructions), distance:(s.distance&&s.distance.text)||'', maneuver:s.maneuver||''}; });
        post({type:'eta', duration:leg.duration.text, distance:leg.distance.text, steps:steps});
        post({type:'route', status:'ok'});
      } else {
        // Directions unavailable (REQUEST_DENIED / OVER_QUERY_LIMIT / ZERO_RESULTS / billing off)
        useFallback = true; drawFallbackLine();
        var km = haversine(driverMarker.getPosition(), destMarker.getPosition());
        post({type:'route', status:'fallback', reason:String(st), km:km});
      }
    });
  }
  function placeDest(pos){
    if(!destMarker){
      destMarker = new google.maps.Marker({position:pos, map:map, icon:dot(DEST_COLOR), title:DEST_LABEL || DEST_TITLE, zIndex:2});
      infoOn(destMarker, DEST_LABEL, true);
    }
    else { destMarker.setPosition(pos); }
    fit(); route();
  }
  // The update functions may be called (injected) before Google Maps has loaded:
  // keep the latest value and let initMap() place it.
  function lmxUpdateDriver(lat,lng){
    var p = {lat:lat,lng:lng};
    if(!map){ DRIVER = p; return; }
    if(!driverMarker){
      driverMarker = new google.maps.Marker({position:p, map:map, icon:dot(DRIVER_COLOR), title:DRIVER_TITLE, zIndex:3});
      infoOn(driverMarker, DRIVER_TITLE, false);
    }
    else { driverMarker.setPosition(p); }
    fit(); route();
  }
  function lmxUpdateDest(lat,lng){ if(!map){ DEST_LL = {lat:lat,lng:lng}; return; } placeDest({lat:lat,lng:lng}); }
  function lmxUpdateExtra(lat,lng){
    var p = {lat:lat,lng:lng};
    if(!map){ EXTRA_LL = p; return; }
    if(!extraMarker){
      extraMarker = new google.maps.Marker({position:p, map:map, icon:dot(EXTRA_COLOR), title:EXTRA_LABEL, zIndex:1});
      infoOn(extraMarker, EXTRA_LABEL, false);
    } else { extraMarker.setPosition(p); }
    fit();
  }
  window.lmxRecenter = function(){ userMoved = false; fit(true); };
  window.lmxUpdateDriver = lmxUpdateDriver;
  window.lmxUpdateDest = lmxUpdateDest;
  window.lmxUpdateExtra = lmxUpdateExtra;

  function initMap(){
    var center = DRIVER || DEST_LL || EXTRA_LL || CONAKRY;
    map = new google.maps.Map(document.getElementById('map'), {
      center: center, zoom: 14, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
    });
    map.addListener('dragstart', function(){ userMoved = true; });
    dirSvc = new google.maps.DirectionsService();
    dirRenderer = new google.maps.DirectionsRenderer({map:map, suppressMarkers:true, preserveViewport:true, polylineOptions:{strokeColor:DRIVER_COLOR, strokeWeight:5, strokeOpacity:0.85}});
    if(EXTRA_LL){ lmxUpdateExtra(EXTRA_LL.lat, EXTRA_LL.lng); }
    if(DRIVER){ lmxUpdateDriver(DRIVER.lat, DRIVER.lng); }
    if(DEST_LL){ placeDest(DEST_LL); }
    else if(DEST_ADDR){ new google.maps.Geocoder().geocode({address:DEST_ADDR}, function(r,s){ if(s==='OK' && r[0]){ placeDest(r[0].geometry.location); } else { post({type:'route', status:'nodest'}); } }); }
  }
  window.initMap = initMap;
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=${encodeURIComponent(o.lang)}&region=GN&callback=initMap" onerror="post({type:'maperror', reason:'load'})"></script>
</body></html>`;
}
