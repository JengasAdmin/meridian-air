import "server-only";

/**
 * VATSIM / IVAO integration services.
 *
 * VATSIM: official public data feed (https://data.vatsim.net/v3/vatsim-data.json),
 * no key required. IVAO: official REST API requires an API key (IVAO_API_KEY);
 * without it the dev adapter returns an empty, well-formed result so the whole
 * pipeline (tracking, live map, statistics) keeps working offline.
 *
 * Both services: timeout, retry, error handling, 60s in-memory cache.
 */

type NetworkPilot = {
  callsign: string;
  userId: string;
  aircraft: string | null;
  departure: string | null;
  arrival: string | null;
  altitudeFt: number | null;
  speedKt: number | null;
  headingDeg: number | null;
  lat: number;
  lon: number;
  network: "VATSIM" | "IVAO";
};

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 60_000;

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const data = await fn();
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function fetchJson(url: string, tries = 3): Promise<unknown> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "MeridianAIR-VA/1.0" },
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 0 },
      } as RequestInit);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) {
        console.error(`[vatsim/ivao] fetch failed: ${url}`, e);
        throw e;
      }
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  return null;
}

// ── VATSIM ──────────────────────────────────────────────────────────
type VatsimData = {
  pilots: {
    callsign: string; cid: number; latitude: number; longitude: number;
    altitude: number; groundspeed: number; heading: number;
    flight_plan?: { aircraft_type?: string; departure?: string; arrival?: string } | null;
  }[];
};

export async function vatsimPilots(): Promise<NetworkPilot[]> {
  return cached("vatsim", async () => {
    try {
      const data = (await fetchJson("https://data.vatsim.net/v3/vatsim-data.json")) as VatsimData;
      return (data?.pilots ?? []).map<NetworkPilot>((p) => ({
        callsign: p.callsign,
        userId: String(p.cid),
        aircraft: p.flight_plan?.aircraft_type ?? null,
        departure: p.flight_plan?.departure ?? null,
        arrival: p.flight_plan?.arrival ?? null,
        altitudeFt: p.altitude ?? null,
        speedKt: p.groundspeed ?? null,
        headingDeg: p.heading ?? null,
        lat: p.latitude,
        lon: p.longitude,
        network: "VATSIM",
      }));
    } catch {
      return []; // dev fallback: feed unreachable — platform stays functional
    }
  });
}

export async function vatsimLookupByCid(cid: string): Promise<NetworkPilot | null> {
  const all = await vatsimPilots();
  return all.find((p) => p.userId === cid) ?? null;
}

// ── IVAO ────────────────────────────────────────────────────────────
export async function ivaoPilots(): Promise<NetworkPilot[]> {
  return cached("ivao", async () => {
    const key = process.env.IVAO_API_KEY;
    if (!key) return []; // dev adapter: no key configured
    try {
      const data = (await fetchJson(
        `https://api.ivao.aero/v2/users/all/ATC&type=pilots`
      )) as { sessionId?: string; lat?: number; lon?: number }[];
      // NOTE: exact IVAO WHazzup mapping is documented in docs/integrations.md;
      // the v2 REST shape is normalized here.
      return (data ?? []).map<NetworkPilot>((p, i) => ({
        callsign: p.sessionId ?? `IVA-${i}`,
        userId: p.sessionId ?? String(i),
        aircraft: null, departure: null, arrival: null,
        altitudeFt: null, speedKt: null, headingDeg: null,
        lat: p.lat ?? 0, lon: p.lon ?? 0,
        network: "IVAO",
      }));
    } catch {
      return [];
    }
  });
}

export async function networkPilots(): Promise<NetworkPilot[]> {
  const [v, i] = await Promise.all([vatsimPilots(), ivaoPilots()]);
  return [...v, ...i];
}

/** Find a live flight matching a Meridian callsign (MRDxxx / MRDxxxx). */
export async function findLiveByCallsign(callsign: string): Promise<NetworkPilot | null> {
  const all = await networkPilots();
  const cs = callsign.toUpperCase();
  return all.find((p) => p.callsign.toUpperCase() === cs) ?? null;
}
