// Pure geofence helpers. No server-only imports so tests and the client can share them.

/** Computer Science Building, Bowie State University (OpenStreetMap building centroid). */
export const CHECK_IN_CENTER = { latitude: 39.0172516, longitude: -76.7595146 } as const;
/** How close a student must be to check in. Wide enough to absorb indoor GPS drift. */
export const CHECK_IN_RADIUS_METERS = 200;
/** Fixes less precise than this are rejected: they can't tell "in the room" from "across campus". */
export const MAX_ACCURACY_METERS = 100;

export type Coordinates = { latitude: number; longitude: number; accuracy: number };

const EARTH_RADIUS_METERS = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters between two lat/lng points. */
export function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type LocationVerdict =
  | { ok: true; distanceMeters: number; accuracyMeters: number }
  | { ok: false; reason: "no-location" }
  | { ok: false; reason: "inaccurate"; accuracyMeters: number }
  | { ok: false; reason: "out-of-range"; distanceMeters: number };

/** Decides whether a client-reported position is close enough to check in. Treats the input as untrusted. */
export function evaluateLocation(input: unknown): LocationVerdict {
  const c = input as Partial<Coordinates> | null | undefined;
  const valid =
    !!c &&
    Number.isFinite(c.latitude) && Math.abs(c.latitude as number) <= 90 &&
    Number.isFinite(c.longitude) && Math.abs(c.longitude as number) <= 180 &&
    Number.isFinite(c.accuracy) && (c.accuracy as number) >= 0;
  if (!valid) return { ok: false, reason: "no-location" };
  const { latitude, longitude, accuracy } = c as Coordinates;

  if (accuracy > MAX_ACCURACY_METERS) {
    return { ok: false, reason: "inaccurate", accuracyMeters: Math.round(accuracy) };
  }
  const distanceMeters = Math.round(haversineMeters(CHECK_IN_CENTER, { latitude, longitude }));
  return distanceMeters <= CHECK_IN_RADIUS_METERS
    ? { ok: true, distanceMeters, accuracyMeters: Math.round(accuracy) }
    : { ok: false, reason: "out-of-range", distanceMeters };
}
