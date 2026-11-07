import { describe, expect, test } from "bun:test";
import { CHECK_IN_CENTER, evaluateLocation, haversineMeters } from "../lib/geofence";

const at = (dLat: number, dLng: number, accuracy = 10) => ({
  latitude: CHECK_IN_CENTER.latitude + dLat,
  longitude: CHECK_IN_CENTER.longitude + dLng,
  accuracy,
});

describe("haversineMeters", () => {
  test("zero for the same point, ~111 km per degree of latitude", () => {
    expect(haversineMeters(CHECK_IN_CENTER, CHECK_IN_CENTER)).toBe(0);
    const d = haversineMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(Math.round(d / 1000)).toBe(111);
  });
});

describe("evaluateLocation", () => {
  test("accepts the center and points just inside the radius", () => {
    expect(evaluateLocation(at(0, 0)).ok).toBe(true);
    expect(evaluateLocation(at(0.0015, 0)).ok).toBe(true); // ~167 m
  });
  test("rejects points outside the radius with the distance", () => {
    const v = evaluateLocation(at(0.003, 0)); // ~333 m
    expect(v).toMatchObject({ ok: false, reason: "out-of-range" });
  });
  test("rejects imprecise fixes even when close", () => {
    expect(evaluateLocation(at(0, 0, 500))).toMatchObject({ ok: false, reason: "inaccurate" });
  });
  test("rejects missing or malformed input", () => {
    for (const bad of [null, undefined, {}, { latitude: "x", longitude: 1, accuracy: 1 }, { latitude: 91, longitude: 0, accuracy: 1 }, { ...at(0, 0), accuracy: -1 }, { ...at(0, 0), latitude: NaN }]) {
      expect(evaluateLocation(bad)).toMatchObject({ ok: false, reason: "no-location" });
    }
  });
});
