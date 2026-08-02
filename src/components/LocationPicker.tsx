import React, { useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX } from '../theme';

export interface LatLng { lat: number; lng: number; }

interface Props {
  mapsKey: string;
  value: LatLng | null;
  onChange: (ll: LatLng) => void;
  height?: number;
}

/**
 * Checkout location picker. The customer searches for an address, or taps / drags the
 * pin on the map, to set the exact delivery spot. Reports {lat,lng} back to React Native.
 *
 * Deliberately has no "use my current location" button: customers often order on behalf
 * of someone else (family, friends, gifts), so their GPS position is frequently not the
 * delivery address. The address is entered manually instead.
 *
 * Optional — the order can still be placed without a pin.
 */
export function LocationPicker({ mapsKey, value, onChange, height = 220 }: Props) {
  const initial = useRef(value);

  const html = useMemo(() => buildHtml(mapsKey, initial.current), [mapsKey]);
  // Stable source object — prevents the WebView from reloading the map on every re-render
  const source = useMemo(() => ({ html }), [html]);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ height, borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border, backgroundColor: '#EAE6DA' }}>
        <WebView
          originWhitelist={['*']}
          source={source}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          onMessage={(e) => {
            try {
              const m = JSON.parse(e.nativeEvent.data);
              if (m?.type === 'pick' && typeof m.lat === 'number' && typeof m.lng === 'number') {
                onChange({ lat: m.lat, lng: m.lng });
              }
            } catch {}
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: LMX.ink50, textAlign: 'center' }}>
        {value
          ? 'Position enregistrée · touchez la carte pour ajuster'
          : "Recherchez l'adresse de livraison ou touchez la carte pour aider le livreur"}
      </Text>
    </View>
  );
}

function buildHtml(key: string, value: LatLng | null): string {
  const start = value ? `{lat:${value.lat},lng:${value.lng}}` : 'null';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA}
  #search{position:absolute;top:8px;left:8px;right:8px;height:40px;padding:0 12px;border:1px solid #d8d8d8;border-radius:10px;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,0.15);outline:none;box-sizing:border-box;z-index:5}
  .pac-container{z-index:9999}
</style>
</head><body>
<input id="search" type="text" autocomplete="off" placeholder="Rechercher une adresse ou un lieu…" />
<div id="map"></div>
<script>
  var map, marker;
  var START = ${start};
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function pin(color){ return {path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:color, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }
  function place(pos){
    if(!marker){ marker = new google.maps.Marker({position:pos, map:map, draggable:true, icon:pin('#1E6BFF')});
      marker.addListener('dragend', function(){ var p = marker.getPosition(); post({type:'pick', lat:p.lat(), lng:p.lng()}); });
    } else { marker.setPosition(pos); }
  }
  function initMap(){
    var c = START || CONAKRY;
    map = new google.maps.Map(document.getElementById('map'), {center:c, zoom: START?16:13, disableDefaultUI:true, zoomControl:true, gestureHandling:'greedy'});
    if(START){ place(START); }
    map.addListener('click', function(e){ var ll={lat:e.latLng.lat(), lng:e.latLng.lng()}; place(ll); post({type:'pick', lat:ll.lat, lng:ll.lng}); });
    // Type-ahead address search (Places Autocomplete), biased to Guinea / Conakry
    var inp = document.getElementById('search');
    if(inp && google.maps.places){
      var ac = new google.maps.places.Autocomplete(inp, {componentRestrictions:{country:['gn','pk']}, fields:['geometry'], types:['geocode']});
      ac.bindTo('bounds', map);
      ac.addListener('place_changed', function(){
        var p = ac.getPlace();
        if(p && p.geometry && p.geometry.location){
          var loc = p.geometry.location;
          place({lat:loc.lat(), lng:loc.lng()}); map.panTo(loc); map.setZoom(16);
          post({type:'pick', lat:loc.lat(), lng:loc.lng()});
        }
      });
    }
  }
  window.initMap = initMap;
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=initMap"></script>
</body></html>`;
}
