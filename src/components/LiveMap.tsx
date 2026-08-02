import React, { useMemo, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX } from '../theme';

export interface LatLng { lat: number; lng: number; }

interface LiveMapProps {
  mapsKey: string;
  driver: LatLng | null;
  destination: { lat?: number | null; lng?: number | null; address?: string; city?: string };
  height?: number;
  onEta?: (eta: { duration: string; distance: string }) => void;
}

/**
 * Google Maps live tracking in a WebView (Expo Go compatible). Shows the driver,
 * the destination/customer, draws the driving route between them, and reports the
 * ETA + distance back to React Native via postMessage. Driver moves are injected
 * so the map never reloads.
 */
export function LiveMap({ mapsKey, driver, destination, height = 240, onEta }: LiveMapProps) {
  const ref = useRef<WebView>(null);
  const initial = useRef(driver);

  const html = useMemo(() => buildHtml(mapsKey, initial.current, destination), [mapsKey]);
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

  return (
    <View style={{ height, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border, backgroundColor: '#EAE6DA' }}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === 'eta' && onEta) onEta({ duration: msg.duration, distance: msg.distance });
          } catch {}
        }}
      />
    </View>
  );
}

function buildHtml(key: string, driver: LatLng | null, dest: LiveMapProps['destination']): string {
  const destAddress = `${dest.address ?? ''} ${dest.city ?? 'Conakry'}, Guinée`.trim();
  const d = driver ? `{lat:${driver.lat},lng:${driver.lng}}` : 'null';
  const destLL = (dest.lat != null && dest.lng != null) ? `{lat:${dest.lat},lng:${dest.lng}}` : 'null';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA}</style>
</head><body>
<div id="map"></div>
<script>
  var map, driverMarker, destMarker, dirSvc, dirRenderer, fallbackLine;
  var DRIVER = ${d};
  var DEST_LL = ${destLL};
  var DEST_ADDR = ${JSON.stringify(destAddress)};
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  var lastDir = 0;
  var useFallback = false; // true once Directions is unavailable (billing/quota/denied)

  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }

  // Great-circle distance (km) — no Directions/geometry library needed.
  function haversine(a, b){
    var R=6371, toR=Math.PI/180;
    var dLat=(b.lat()-a.lat())*toR, dLng=(b.lng()-a.lng())*toR;
    var la1=a.lat()*toR, la2=b.lat()*toR;
    var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return 2*R*Math.asin(Math.sqrt(h));
  }
  // Straight dashed line between driver and destination — shown whenever the Directions
  // route can't be drawn, so the customer always sees the connection.
  function drawFallbackLine(){
    if(!driverMarker || !destMarker) return;
    var path=[driverMarker.getPosition(), destMarker.getPosition()];
    if(!fallbackLine){
      fallbackLine = new google.maps.Polyline({ map:map, path:path, geodesic:true, strokeOpacity:0,
        icons:[{ icon:{ path:'M 0,-1 0,1', strokeOpacity:0.9, strokeColor:'#1E6BFF', scale:3 }, offset:'0', repeat:'14px' }] });
    } else { fallbackLine.setPath(path); fallbackLine.setMap(map); }
    var km=haversine(path[0], path[1]);
    post({type:'eta', duration:'', distance:(km<1 ? Math.round(km*1000)+' m' : km.toFixed(1)+' km')});
  }
  function clearFallbackLine(){ if(fallbackLine){ fallbackLine.setMap(null); } }
  function fit(){
    if(!map) return;
    var b = new google.maps.LatLngBounds(); var any=false;
    if(driverMarker){ b.extend(driverMarker.getPosition()); any=true; }
    if(destMarker){ b.extend(destMarker.getPosition()); any=true; }
    if(any){ map.fitBounds(b, 70); google.maps.event.addListenerOnce(map,'idle',function(){ if(map.getZoom()>16) map.setZoom(16); }); }
  }
  function dot(color){ return {path:google.maps.SymbolPath.CIRCLE, scale:9, fillColor:color, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }

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
        post({type:'eta', duration:leg.duration.text, distance:leg.distance.text});
      } else {
        // Directions unavailable (REQUEST_DENIED / OVER_QUERY_LIMIT / ZERO_RESULTS / billing off)
        useFallback = true; drawFallbackLine();
      }
    });
  }
  function placeDest(pos){
    if(!destMarker){ destMarker = new google.maps.Marker({position:pos, map:map, icon:dot('#10B981'), title:'Destination'}); }
    else { destMarker.setPosition(pos); }
    fit(); route();
  }
  function lmxUpdateDriver(lat,lng){
    var p = {lat:lat,lng:lng};
    if(!driverMarker){ driverMarker = new google.maps.Marker({position:p, map:map, icon:dot('#1E6BFF'), title:'Livreur'}); }
    else { driverMarker.setPosition(p); }
    fit(); route();
  }
  function lmxUpdateDest(lat,lng){ placeDest({lat:lat,lng:lng}); }
  window.lmxUpdateDriver = lmxUpdateDriver;
  window.lmxUpdateDest = lmxUpdateDest;

  function initMap(){
    var center = DRIVER || DEST_LL || CONAKRY;
    map = new google.maps.Map(document.getElementById('map'), {
      center: center, zoom: 14, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
    });
    dirSvc = new google.maps.DirectionsService();
    dirRenderer = new google.maps.DirectionsRenderer({map:map, suppressMarkers:true, preserveViewport:true, polylineOptions:{strokeColor:'#1E6BFF', strokeWeight:5, strokeOpacity:0.85}});
    if(DRIVER){ lmxUpdateDriver(DRIVER.lat, DRIVER.lng); }
    if(DEST_LL){ placeDest(DEST_LL); }
    else if(DEST_ADDR){ new google.maps.Geocoder().geocode({address:DEST_ADDR}, function(r,s){ if(s==='OK' && r[0]){ placeDest(r[0].geometry.location); } }); }
  }
  window.initMap = initMap;
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap"></script>
</body></html>`;
}
