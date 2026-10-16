import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { LMX } from '../theme';
import { t } from '../i18n';

export interface LatLng { lat: number; lng: number; }

interface Props {
  mapsKey: string;
  value: LatLng | null;
  onChange: (ll: LatLng) => void;
  height?: number;
  /** Replaces the checkout hint under the map. */
  hint?: string;
  /** Pin colour (defaults to brand blue). */
  pinColor?: string;
  /**
   * Store mode (seller "Ma boutique", mirrors the website pickup-location form): a place
   * search with a Google suggestions dropdown (Places API New, else legacy Places) plus a
   * "Rechercher" button that geocodes the text (Google, else OpenStreetMap). Guinea only.
   */
  storeSearch?: boolean;
  /** "Quartier, Commune, Conakry, Guinea" — when there is no pin yet the map jumps there. */
  area?: string;
  /** Search feedback (store mode). */
  onStatus?: (s: { msg: string; kind: 'info' | 'ok' | 'error' } | null) => void;
}

const STATUS_MSG: Record<string, { fr: string; kind: 'info' | 'ok' | 'error' }> = {
  searching: { fr: 'Recherche…', kind: 'info' },
  found:     { fr: 'Lieu trouvé — ajustez le pin si besoin, puis validez la position.', kind: 'ok' },
  notfound:  { fr: 'Aucun résultat pour cette recherche.', kind: 'error' },
  failed:    { fr: 'Recherche indisponible pour le moment. Touchez la carte pour placer le pin.', kind: 'error' },
  area:      { fr: 'Carte centrée sur le quartier choisi — touchez la carte pour placer le magasin.', kind: 'info' },
};

/**
 * Checkout location picker. The customer searches for an address, or taps / drags the
 * pin on the map, to set the exact delivery spot. Reports {lat,lng} back to React Native.
 *
 * Deliberately has no "use my current location" button: customers often order on behalf
 * of someone else (family, friends, gifts), so their GPS position is frequently not the
 * delivery address. The address is entered manually instead.
 *
 * Optional — the order can still be placed without a pin.
 *
 * When `value` is changed from outside (e.g. a "use my current location" button on the
 * store form), the pin moves there without reloading the map.
 */
export function LocationPicker({ mapsKey, value, onChange, height = 220, hint, pinColor = '#1E6BFF', storeSearch = false, area, onStatus }: Props) {
  const ref = useRef<WebView>(null);
  const initial = useRef(value);
  const lastReported = useRef<string>(value ? `${value.lat},${value.lng}` : '');

  const initialArea = useRef(area);
  const html = useMemo(() => storeSearch
    ? buildStoreHtml(mapsKey, initial.current, pinColor, initialArea.current ?? '', t('Rechercher un lieu, une rue, un quartier…'), t('Rechercher'))
    : buildHtml(mapsKey, initial.current, pinColor, t('Rechercher une adresse ou un lieu…')), [mapsKey]);
  // Stable source object — prevents the WebView from reloading the map on every re-render
  const source = useMemo(() => ({ html }), [html]);

  useEffect(() => {
    if (!value || !ref.current) return;
    const k = `${value.lat},${value.lng}`;
    if (k === lastReported.current) return;
    lastReported.current = k;
    ref.current.injectJavaScript(`window.lmxSetPin && window.lmxSetPin(${value.lat}, ${value.lng}); true;`);
  }, [value?.lat, value?.lng]);

  // Selected neighbourhood changed → show it (only moves the view while there is no pin).
  useEffect(() => {
    if (!storeSearch || !area || !ref.current) return;
    ref.current.injectJavaScript(`window.lmxShowArea && window.lmxShowArea(${JSON.stringify(area)}); true;`);
  }, [area, storeSearch]);

  return (
    <View style={{ gap: 8 }}>
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
              const m = JSON.parse(e.nativeEvent.data);
              if (m?.type === 'pick' && typeof m.lat === 'number' && typeof m.lng === 'number') {
                lastReported.current = `${m.lat},${m.lng}`;
                onChange({ lat: m.lat, lng: m.lng });
              } else if (m?.type === 'status' && onStatus) {
                const def = STATUS_MSG[m.key];
                onStatus(def ? { msg: t(def.fr), kind: def.kind } : null);
              }
            } catch {}
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: LMX.ink50, textAlign: 'center' }}>
        {hint ?? (value
          ? t('Position enregistrée · touchez la carte pour ajuster')
          : t("Recherchez l'adresse de livraison ou touchez la carte pour aider le livreur"))}
      </Text>
    </View>
  );
}

function buildHtml(key: string, value: LatLng | null, color: string, searchPlaceholder: string): string {
  const start = value ? `{lat:${value.lat},lng:${value.lng}}` : 'null';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA}
  #search{position:absolute;top:8px;left:8px;right:8px;height:40px;padding:0 12px;border:1px solid #d8d8d8;border-radius:10px;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,0.15);outline:none;box-sizing:border-box;z-index:5}
  .pac-container{z-index:9999}
</style>
</head><body>
<input id="search" type="text" autocomplete="off" placeholder="${searchPlaceholder.replace(/[<>&"]/g, '')}" />
<div id="map"></div>
<script>
  var map, marker;
  var START = ${start};
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function pin(color){ return {path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:color, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }
  function place(pos){
    if(!marker){ marker = new google.maps.Marker({position:pos, map:map, draggable:true, icon:pin(${JSON.stringify(color)})});
      marker.addListener('dragend', function(){ var p = marker.getPosition(); post({type:'pick', lat:p.lat(), lng:p.lng()}); });
    } else { marker.setPosition(pos); }
  }
  window.lmxSetPin = function(lat,lng){ if(!map){ START={lat:lat,lng:lng}; return; } var p={lat:lat,lng:lng}; place(p); map.panTo(p); if(map.getZoom()<16) map.setZoom(16); };
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

const jsStr = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

/**
 * Store pickup-location map — same behaviour as the website (loomodex/assets/js/store-location.js):
 * live Google Places suggestions restricted to Guinea (Places API New → legacy Places →
 * none), a Search button / Enter that geocodes the text (Google → OpenStreetMap), Conakry
 * centre by default and the selected neighbourhood while no pin is placed.
 */
function buildStoreHtml(key: string, value: LatLng | null, color: string, area: string, placeholder: string, searchLabel: string): string {
  const start = value ? `{lat:${value.lat},lng:${value.lng}}` : 'null';
  const attr = (v: string) => v.replace(/[<>&"]/g, '');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:#EAE6DA;font-family:-apple-system,Roboto,sans-serif}
  #bar{position:absolute;top:8px;left:8px;right:8px;z-index:5;display:flex;gap:6px}
  #search{flex:1;min-width:0;height:40px;padding:0 12px;border:1px solid #d8d8d8;border-radius:10px;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,0.15);outline:none;box-sizing:border-box;background:#fff}
  #go{height:40px;padding:0 12px;border:0;border-radius:10px;background:#0B1F3A;color:#fff;font-size:13px;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.15)}
  #sugg{position:absolute;top:52px;left:8px;right:8px;z-index:6;margin:0;padding:4px 0;list-style:none;background:#fff;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);max-height:170px;overflow-y:auto;display:none}
  #sugg li{padding:9px 12px;border-bottom:1px solid #f0f0f0}
  #sugg li:last-child{border-bottom:0}
  #sugg li:active{background:#EEF4FF}
  .m{display:block;font-size:13.5px;font-weight:600;color:#0B1F3A}
  .s{display:block;font-size:11.5px;color:#7a8394;margin-top:1px}
</style>
</head><body>
<div id="bar"><input id="search" type="text" autocomplete="off" enterkeyhint="search" placeholder="${attr(placeholder)}" /><button id="go" type="button">${attr(searchLabel)}</button></div>
<ul id="sugg"></ul>
<div id="map"></div>
<script>
  var map, marker, geocoder;
  var START = ${start};
  var AREA = ${jsStr(area)};
  var COLOR = ${jsStr(color)};
  var CONAKRY = {lat:9.6412,lng:-13.5784};
  var inp = document.getElementById('search'), btn = document.getElementById('go'), box = document.getElementById('sugg');
  function post(o){ try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function status(k){ post({type:'status', key:k}); }
  function pin(c){ return {path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:c, fillOpacity:1, strokeColor:'#fff', strokeWeight:3}; }
  function place(pos){
    if(!marker){ marker = new google.maps.Marker({position:pos, map:map, draggable:true, icon:pin(COLOR)});
      marker.addListener('dragend', function(){ var p = marker.getPosition(); post({type:'pick', lat:p.lat(), lng:p.lng()}); });
    } else { marker.setPosition(pos); }
  }
  function pick(res){ place(res); map.panTo(res); map.setZoom(17); post({type:'pick', lat:res.lat, lng:res.lng}); status('found'); }
  window.lmxSetPin = function(lat,lng){ if(!map){ START={lat:lat,lng:lng}; return; } var p={lat:lat,lng:lng}; place(p); map.panTo(p); if(map.getZoom()<16) map.setZoom(16); };

  // ---- Geocoding: Google (Guinea only), else OpenStreetMap ----
  function nominatim(q, cb){
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gn&q='+encodeURIComponent(q), {headers:{'Accept':'application/json'}})
      .then(function(r){ return r.json(); })
      .then(function(d){ cb(d && d[0] ? {lat:parseFloat(d[0].lat), lng:parseFloat(d[0].lon)} : null, false); })
      .catch(function(){ cb(null, true); });
  }
  function geocode(q, cb){
    if(!geocoder){ nominatim(q, cb); return; }
    geocoder.geocode({address:q, componentRestrictions:{country:'GN'}}, function(r, st){
      if(st==='OK' && r && r[0]){ var l=r[0].geometry.location; cb({lat:l.lat(), lng:l.lng()}, false); }
      else if(st==='ZERO_RESULTS'){ cb(null, false); }
      else { nominatim(q, cb); } // REQUEST_DENIED (Geocoding API off) etc.
    });
  }

  // Selected neighbourhood → move the view there, never a pin the store already placed.
  window.lmxShowArea = function(q){
    AREA = q;
    if(!map || marker || !q) return;
    geocode(q, function(res){ if(res && !marker){ map.panTo(res); map.setZoom(15); status('area'); } });
  };

  function runSearch(){
    var q = (inp.value||'').trim(); if(!q) return;
    hide(); inp.blur(); status('searching');
    geocode(q, function(res, failed){ if(!res){ status(failed ? 'failed' : 'notfound'); return; } pick(res); });
  }

  // ---- Google Places suggestions ----
  var places = null, token = null, items = [], timer = null, seq = 0;
  function getPlaces(cb){
    if(places){ cb(places); return; }
    function legacyOrNone(){ var lib = google.maps.places; places = lib && lib.AutocompleteService ? {mode:'legacy', lib:lib} : {mode:'none'}; cb(places); }
    if(typeof google.maps.importLibrary === 'function'){
      google.maps.importLibrary('places').then(function(lib){ if(lib && lib.AutocompleteSuggestion){ places={mode:'new', lib:lib}; cb(places); } else legacyOrNone(); }).catch(legacyOrNone);
    } else legacyOrNone();
  }
  function newToken(lib){ try { return lib && lib.AutocompleteSessionToken ? new lib.AutocompleteSessionToken() : null; } catch(e){ return null; } }
  function byPlaceId(id, done){
    if(!geocoder){ done(null); return; }
    geocoder.geocode({placeId:id}, function(r, st){ if(st==='OK' && r && r[0]){ var l=r[0].geometry.location; done({lat:l.lat(), lng:l.lng()}); } else done(null); });
  }
  function fetchSugg(q, cb){
    getPlaces(function(p){
      if(p.mode==='none'){ cb(null); return; }
      if(!token) token = newToken(p.lib);
      if(p.mode==='new'){
        var req = {input:q, includedRegionCodes:['gn']}; if(token) req.sessionToken = token;
        p.lib.AutocompleteSuggestion.fetchAutocompleteSuggestions(req).then(function(res){
          cb((res.suggestions||[]).filter(function(s){ return s.placePrediction; }).map(function(s){
            var pp = s.placePrediction;
            return { main: pp.mainText ? pp.mainText.text : pp.text.text, sub: pp.secondaryText ? pp.secondaryText.text : '', text: pp.text.text,
              locate: function(done){ var pl = pp.toPlace(); pl.fetchFields({fields:['location']}).then(function(){ done(pl.location ? {lat:pl.location.lat(), lng:pl.location.lng()} : null); }).catch(function(){ byPlaceId(pp.placeId, done); }); } };
          }));
        }).catch(function(){
          // Places API (New) not enabled on this key -> try the legacy Places API once.
          var legacy = google.maps.places && google.maps.places.AutocompleteService ? google.maps.places : null;
          places = legacy ? {mode:'legacy', lib:legacy} : {mode:'none'}; token = null;
          if(legacy) fetchSugg(q, cb); else cb(null);
        });
        return;
      }
      var svc = new p.lib.AutocompleteService();
      var lreq = {input:q, componentRestrictions:{country:'gn'}}; if(token) lreq.sessionToken = token;
      svc.getPlacePredictions(lreq, function(preds, st){
        if(st==='ZERO_RESULTS'){ cb([]); return; }
        if(st!=='OK' || !preds){ places = {mode:'none'}; cb(null); return; }
        cb(preds.map(function(pr){ var sf = pr.structured_formatting||{};
          return { main: sf.main_text || pr.description, sub: sf.secondary_text || '', text: pr.description, locate: function(done){ byPlaceId(pr.place_id, done); } }; }));
      });
    });
  }
  function hide(){ box.style.display='none'; box.innerHTML=''; items=[]; }
  function render(list){
    items = list||[]; box.innerHTML='';
    if(!items.length){ hide(); return; }
    items.forEach(function(s, i){
      var li = document.createElement('li');
      var m = document.createElement('span'); m.className='m'; m.textContent=s.main; li.appendChild(m);
      if(s.sub){ var sb = document.createElement('span'); sb.className='s'; sb.textContent=s.sub; li.appendChild(sb); }
      li.addEventListener('mousedown', function(e){ e.preventDefault(); });
      li.addEventListener('click', function(){ choose(i); });
      box.appendChild(li);
    });
    box.style.display='block';
  }
  function choose(i){
    var s = items[i]; if(!s) return;
    inp.value = s.text; hide(); inp.blur(); status('searching');
    s.locate(function(res){ token = null; if(res) pick(res); else runSearch(); });
  }
  inp.addEventListener('input', function(){
    clearTimeout(timer);
    var q = inp.value.trim();
    if(q.length < 2 || !window.google){ hide(); return; }
    timer = setTimeout(function(){
      var my = ++seq;
      fetchSugg(q, function(list){ if(my!==seq) return; if(list===null){ hide(); return; } render(list); });
    }, 250);
  });
  inp.addEventListener('keydown', function(e){
    if(e.key==='Enter'){ e.preventDefault(); if(items.length) choose(0); else runSearch(); }
    else if(e.key==='Escape'){ hide(); }
  });
  inp.addEventListener('blur', function(){ setTimeout(hide, 300); });
  btn.addEventListener('click', runSearch);

  function initMap(){
    geocoder = google.maps.Geocoder ? new google.maps.Geocoder() : null;
    map = new google.maps.Map(document.getElementById('map'), {center: START || CONAKRY, zoom: START?16:12, disableDefaultUI:true, zoomControl:true, gestureHandling:'greedy'});
    if(START){ place(START); }
    else if(AREA){ window.lmxShowArea(AREA); }
    map.addListener('click', function(e){ hide(); var ll={lat:e.latLng.lat(), lng:e.latLng.lng()}; place(ll); post({type:'pick', lat:ll.lat, lng:ll.lng}); });
  }
  window.initMap = initMap;
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=initMap"></script>
</body></html>`;
}
