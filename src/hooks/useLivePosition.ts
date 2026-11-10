import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { driverApi } from '../api/delivery';

export interface LatLng { lat: number; lng: number; }

/**
 * locating — waiting for the first fix · ok — position known · denied — permission refused ·
 * off — location services disabled on the phone · timeout — no fix after FIX_TIMEOUT_MS ·
 * error — the location module failed.
 */
export type GpsStatus = 'locating' | 'ok' | 'denied' | 'off' | 'timeout' | 'error';

const FIX_TIMEOUT_MS = 25000;

let askedThisSession = false;

/**
 * Location permission without a request loop. On Android a permission request pauses and
 * resumes the app (even when it answers at once), so a request made on every "app active"
 * event re-triggers itself forever — the status and navigation bars blink non-stop.
 * We only check, and show the system prompt at most once per launch (or on `force`, i.e.
 * the user tapped "Retry"), and never when Android can no longer show it.
 */
export async function ensureLocationPermission(force = false): Promise<boolean> {
  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.status === 'granted') return true;
  if (!cur.canAskAgain || (askedThisSession && !force)) return false;
  askedThisSession = true;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * The driver's live position, robust on every device:
 *  - shows the last known position immediately (no blank wait),
 *  - asks for a network-based first fix (works on Wi-Fi tablets without a GPS chip),
 *  - then follows the high-accuracy GPS watch,
 *  - reports permission / services-off / timeout so the screen can offer "Retry"
 *    instead of loading forever.
 * With `report`, each fix is also sent to the server (logistics + customer tracking).
 */
export function useLivePosition({ enabled = true, report = false, timeInterval = 5000, distanceInterval = 10 }: {
  enabled?: boolean; report?: boolean; timeInterval?: number; distanceInterval?: number;
} = {}) {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<GpsStatus>('locating');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let got = false;
    let sub: Location.LocationSubscription | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const accept = (c: Location.LocationObjectCoords) => {
      if (cancelled) return;
      got = true;
      setPos({ lat: c.latitude, lng: c.longitude });
      setStatus('ok');
      if (report) driverApi.updateLocation(c.latitude, c.longitude, c.heading ?? 0).catch(() => {});
    };

    setStatus(s => (s === 'ok' ? s : 'locating'));
    (async () => {
      try {
        const granted = await ensureLocationPermission(attempt > 0);
        if (cancelled) return;
        if (!granted) { setStatus('denied'); return; }
        if (!(await Location.hasServicesEnabledAsync())) { if (!cancelled) setStatus('off'); return; }
        if (cancelled) return;

        timer = setTimeout(() => { if (!got && !cancelled) setStatus('timeout'); }, FIX_TIMEOUT_MS);

        const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(() => null);
        if (last) accept(last.coords);

        // Network-based first fix — fast, and the only source on devices without GPS hardware.
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then(p => accept(p.coords)).catch(() => {});

        const s = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval, distanceInterval },
          p => accept(p.coords),
        );
        if (cancelled) s.remove(); else sub = s;
      } catch {
        if (!cancelled && !got) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (sub) sub.remove();
    };
  }, [enabled, report, timeInterval, distanceInterval, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { pos, status, retry };
}
