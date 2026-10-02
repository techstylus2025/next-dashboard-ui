"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

type MapLocation = {
  latitude: number;
  longitude: number;
  reportedAt: string;
};

type MapBus = {
  id: number;
  name: string;
  plateNumber: string;
  driverName: string;
  route: string;
  latestLocation: MapLocation | null;
  locationTrail: MapLocation[];
};

const routeColors = ["#0f766e", "#d97706", "#2563eb", "#be123c", "#7c3aed", "#047857"];
const defaultCenter: LatLngExpression = [5.6037, -0.187];

function FitInitialBounds({ locations }: { locations: LatLngExpression[] }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current || locations.length === 0) return;
    hasFitted.current = true;

    if (locations.length === 1) {
      map.setView(locations[0], 14);
      return;
    }

    map.fitBounds(locations as LatLngBoundsExpression, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [locations, map]);

  return null;
}

export default function TransportMap({ buses }: { buses: MapBus[] }) {
  const locations = useMemo<LatLngExpression[]>(
    () => buses.flatMap((bus) => bus.latestLocation
      ? [[bus.latestLocation.latitude, bus.latestLocation.longitude] as LatLngExpression]
      : []),
    [buses]
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom
        className="h-full min-h-[360px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitInitialBounds locations={locations} />

        {buses.map((bus, index) => {
          const color = routeColors[index % routeColors.length];
          const trail = bus.locationTrail.map((location) => [
            location.latitude,
            location.longitude,
          ] as LatLngExpression);

          return (
            <Fragment key={bus.id}>
              {trail.length > 1 ? (
                <Polyline
                  positions={trail}
                  pathOptions={{ color, opacity: 0.82, weight: 5 }}
                />
              ) : null}
              {bus.latestLocation ? (
                <CircleMarker
                  center={[bus.latestLocation.latitude, bus.latestLocation.longitude]}
                  radius={8}
                  pathOptions={{ color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 3 }}
                >
                  <Tooltip permanent direction="top" offset={[0, -8]}>
                    {bus.name}
                  </Tooltip>
                  <Popup>
                    <div className="min-w-48 space-y-1 text-sm">
                      <p className="font-semibold text-slate-900">{bus.name}</p>
                      <p className="text-slate-600">{bus.route}</p>
                      <p className="text-xs text-slate-500">
                        {bus.latestLocation.latitude.toFixed(5)}, {bus.latestLocation.longitude.toFixed(5)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Updated {new Date(bus.latestLocation.reportedAt).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null}
            </Fragment>
          );
        })}
      </MapContainer>

      {buses.some((bus) => bus.latestLocation) ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-h-36 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-sm" aria-label="Live bus routes">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Live routes</p>
          <ul className="space-y-2">
            {buses.map((bus, index) => bus.latestLocation ? (
              <li key={bus.id} className="flex min-w-0 items-center gap-2 text-xs">
                <span
                  className={bus.locationTrail.length > 1 ? "h-1 w-5 shrink-0 rounded-full" : "h-2 w-2 shrink-0 rounded-full"}
                  style={{ backgroundColor: routeColors[index % routeColors.length] }}
                />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-800">{bus.name}</span>
                  <span className="ml-1 truncate text-slate-600">{bus.route}</span>
                  <span className="ml-1 text-[10px] text-slate-400">
                    {bus.locationTrail.length > 1
                      ? `${bus.locationTrail.length} GPS points`
                      : "Trail starts after another GPS update"}
                  </span>
                </span>
              </li>
            ) : null)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}