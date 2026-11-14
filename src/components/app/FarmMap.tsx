import { useEffect, useRef, useState } from "react";
import type { Map as LMap, CircleMarker, TileLayer } from "leaflet";
import { getGibsTileUrl, NASA_GIBS_LAYERS, type GibsLayerType } from "@/lib/nasa/gibs";

/** Leaflet map loaded only in the browser. Click to move the farm pin. */
export function FarmMap({
  lat,
  lng,
  onSelect,
  height = 320,
  gibsLayer,
  gibsDate,
  onImageryStatusChange,
}: {
  lat: number;
  lng: number;
  onSelect?: (lat: number, lng: number) => void;
  height?: number;
  gibsLayer?: GibsLayerType | null;
  gibsDate?: string;
  onImageryStatusChange?: (status: "none" | "loading" | "loaded" | "error") => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const imagery = useRef<TileLayer | null>(null);
  const cb = useRef(onSelect);
  const statusCb = useRef(onImageryStatusChange);
  const [mapReady, setMapReady] = useState(false);
  cb.current = onSelect;
  statusCb.current = onImageryStatusChange;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(m);
      marker.current = L.circleMarker([lat, lng], { radius: 9, color: "#10251C", weight: 3, fillColor: "#759B75", fillOpacity: 0.9 }).addTo(m);
      m.on("click", (e) => cb.current?.(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))));
      map.current = m;
      setMapReady(true);
    }).catch(() => {
      statusCb.current?.("error");
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; imagery.current = null; setMapReady(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    imagery.current?.remove();
    imagery.current = null;
    if (!gibsLayer || !gibsDate || !map.current || !mapReady) {
      statusCb.current?.("none");
      return;
    }

    statusCb.current?.("loading");
    import("leaflet").then((L) => {
      if (cancelled || !map.current) return;
      const layerConfig = NASA_GIBS_LAYERS[gibsLayer];
      const maxNativeZoom = Number(layerConfig.tileMatrixSet.match(/Level(\d+)/)?.[1] ?? 9);
      const tileLayer = L.tileLayer(getGibsTileUrl(gibsLayer, gibsDate), {
        attribution: "Imagery © NASA GIBS",
        maxNativeZoom,
        opacity: 0.72,
      });
      tileLayer.on("tileload", () => statusCb.current?.("loaded"));
      tileLayer.on("tileerror", () => statusCb.current?.("error"));
      tileLayer.addTo(map.current);
      imagery.current = tileLayer;
    }).catch(() => {
      if (!cancelled) statusCb.current?.("error");
    });

    return () => {
      cancelled = true;
      imagery.current?.remove();
      imagery.current = null;
    };
  }, [gibsLayer, gibsDate, mapReady]);

  useEffect(() => {
    marker.current?.setLatLng([lat, lng]);
    map.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-lg border border-border bg-muted" role="application" aria-label="Farm location map. Click to select a location." />;
}
