import { useEffect, useRef } from "react";
import type { Map as LMap, CircleMarker } from "leaflet";

/** Leaflet map loaded only in the browser. Click to move the farm pin. */
export function FarmMap({ lat, lng, onSelect, height = 320 }: { lat: number; lng: number; onSelect?: (lat: number, lng: number) => void; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const cb = useRef(onSelect);
  cb.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(m);
      marker.current = L.circleMarker([lat, lng], { radius: 9, color: "#10251C", weight: 3, fillColor: "#759B75", fillOpacity: 0.9 }).addTo(m);
      m.on("click", (e) => cb.current?.(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))));
      map.current = m;
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    marker.current?.setLatLng([lat, lng]);
    map.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-lg border border-border bg-muted" role="application" aria-label="Farm location map. Click to select a location." />;
}
