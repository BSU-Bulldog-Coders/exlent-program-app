import type { CheckInResult } from "@/app/attend/actions";
import { CHECK_IN_RADIUS_METERS, MAX_ACCURACY_METERS, type Coordinates } from "@/lib/geofence";

export type LocationProblem = "denied" | "unavailable" | "timeout" | "unsupported";

export class LocationError extends Error {
  constructor(readonly problem: LocationProblem) {
    super(problem);
  }
}

/** One fresh, high-accuracy browser fix. Rejects with a LocationError. */
export function getPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return reject(new LocationError("unsupported"));
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      (error) =>
        reject(
          new LocationError(
            error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable",
          ),
        ),
      // maximumAge 0: never reuse a cached fix from somewhere else.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export const PROBLEM_COPY: Record<LocationProblem, { title: string; body: string }> = {
  denied: {
    title: "Location access is blocked",
    body: "Check-in needs your location to confirm you're at the Computer Science Building. If your browser asks again, choose Allow. If it doesn't, location is blocked for this site: open the lock or tune icon next to the address bar, set Location to Allow, then try again.",
  },
  unavailable: {
    title: "Couldn't find your location",
    body: "Your device couldn't determine where you are. Check that location services are on, then try again.",
  },
  timeout: {
    title: "Location timed out",
    body: "Finding your location took too long. Move near a window or outdoors, then try again.",
  },
  unsupported: {
    title: "Location isn't supported",
    body: "This browser can't share your location. Try a different browser or device.",
  },
};

/** User-facing message for any non-success check-in result. */
export function describeFailure(result: CheckInResult) {
  switch (result.status) {
    case "checked-in":
    case "already":
      return "";
    case "out-of-range":
      return `You're about ${result.distanceMeters} m away. Move within ${CHECK_IN_RADIUS_METERS} m of the Computer Science Building to check in.`;
    case "inaccurate":
      return `Your location isn't precise enough (±${result.accuracyMeters} m, need ±${MAX_ACCURACY_METERS} m). Move near a window or outdoors and try again.`;
    case "no-location":
      return "We couldn't read your location. Try again.";
    case "expired":
      return "This QR code has expired. Scan the code on the screen again.";
    case "invalid":
      return "This QR code isn't valid. Scan the code on the screen again.";
    case "closed":
      return "This class is no longer taking attendance.";
    case "not-student":
      return "Only students check in to classes.";
    case "unauthorized":
      return "Please sign in to check in.";
  }
}
