import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchApi } from "@/lib/api";
import { useAlarms, AlarmEvent } from "@/lib/alarmStore";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Building2, MapPin, Users, Cpu, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Fix default leaflet icon paths in vite bundling.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const alarmIcon = L.divIcon({
  className: "ev12-alarm-marker",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:hsl(345 90% 60%);
    box-shadow:0 0 0 6px hsla(345, 90%, 60%, 0.25), 0 0 12px hsla(345, 90%, 60%, 0.6);
    border:2px solid white;
    animation: ev12-pulse 1.5s ease-out infinite;
  "></div>
  <style>@keyframes ev12-pulse{0%{box-shadow:0 0 0 0 hsla(345,90%,60%,0.6)}70%{box-shadow:0 0 0 14px hsla(345,90%,60%,0)}100%{box-shadow:0 0 0 0 hsla(345,90%,60%,0)}}</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface CountCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: "default" | "alert";
  to?: string;
}
function CountCard({ label, value, icon: Icon, tone = "default", to }: CountCardProps) {
  const body = (
    <Card className="p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon
          className={`h-4 w-4 ${tone === "alert" ? "text-destructive" : "text-muted-foreground"}`}
        />
      </div>
      <div
        className={`text-[26px] font-semibold ${
          tone === "alert" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

interface DeviceRow {
  id?: number;
  externalDeviceId?: string;
  name?: string;
  alarmCode?: string | null;
  latitude?: number;
  longitude?: number;
  lastLatitude?: number;
  lastLongitude?: number;
  [key: string]: unknown;
}

const getCoords = (d: any): [number, number] | null => {
  const lat = Number(d?.latitude ?? d?.lastLatitude ?? d?.gpsLatitude ?? d?.lat);
  const lng = Number(d?.longitude ?? d?.lastLongitude ?? d?.gpsLongitude ?? d?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
};

export default function Dashboard() {
  const { events, alarmsByDevice, connected } = useAlarms();
  const [companiesCount, setCompaniesCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [devicesCount, setDevicesCount] = useState(0);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const safe = async <T,>(p: Promise<T>): Promise<T | null> => {
        try {
          return await p;
        } catch {
          return null;
        }
      };
      const [companies, locations, users, devicesData] = await Promise.all([
        safe(fetchApi<any>("/api/companies")),
        safe(fetchApi<any>("/api/locations")),
        safe(fetchApi<any>("/api/users")),
        safe(fetchApi<any>("/api/devices")),
      ]);
      const arr = (x: any) => (Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : []);
      setCompaniesCount(arr(companies).length);
      setLocationsCount(arr(locations).length);
      setUsersCount(arr(users).length);
      const devList = arr(devicesData);
      setDevicesCount(devList.length);
      setDevices(devList);
      setLoading(false);
    };
    load();
  }, []);

  // Merge live alarm stream with device list to know which devices currently
  // have an alert code.
  const alertedDevices = useMemo(() => {
    const merged = new Map<string, { device: DeviceRow; alarm: AlarmEvent | null }>();

    devices.forEach((d) => {
      const alarmFromStream =
        (d.id ? alarmsByDevice[`id:${d.id}`] : null) ||
        (d.externalDeviceId ? alarmsByDevice[`ext:${d.externalDeviceId}`] : null) ||
        null;
      const code =
        alarmFromStream?.alarmCode ??
        (d as any).alarmCode ??
        (d as any).alarm_code ??
        null;
      const cancelledAt =
        alarmFromStream?.alarmCancelledAt ?? (d as any).alarmCancelledAt ?? null;
      if (code && !cancelledAt) {
        const key = `${d.id ?? "-"}:${d.externalDeviceId ?? "-"}`;
        merged.set(key, { device: d, alarm: alarmFromStream });
      }
    });

    // Also include alarms whose device isn't in the loaded list yet.
    events.forEach((ev) => {
      if (!ev.alarmCode || ev.alarmCancelledAt) return;
      const key = `${ev.deviceId ?? "-"}:${ev.externalDeviceId ?? "-"}`;
      if (merged.has(key)) return;
      const synthetic: DeviceRow = {
        id: ev.deviceId,
        externalDeviceId: ev.externalDeviceId,
        latitude: ev.latitude,
        longitude: ev.longitude,
        alarmCode: ev.alarmCode,
      };
      merged.set(key, { device: synthetic, alarm: ev });
    });

    return Array.from(merged.values());
  }, [devices, alarmsByDevice, events]);

  const mapPoints = alertedDevices
    .map(({ device, alarm }) => {
      const coords = getCoords(alarm) || getCoords(device);
      return coords ? { coords, device, alarm } : null;
    })
    .filter(Boolean) as { coords: [number, number]; device: DeviceRow; alarm: AlarmEvent | null }[];

  const activeAlertCount = alertedDevices.length;

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your fleet."
        actions={
          <Badge variant={connected ? "default" : "secondary"} className="text-[11px]">
            {connected ? "Live stream connected" : "Stream offline"}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <CountCard label="Companies" value={loading ? "—" : companiesCount} icon={Building2} to="/companies" />
        <CountCard label="Locations" value={loading ? "—" : locationsCount} icon={MapPin} to="/locations" />
        <CountCard label="Users" value={loading ? "—" : usersCount} icon={Users} to="/users" />
        <CountCard label="Devices" value={loading ? "—" : devicesCount} icon={Cpu} to="/devices" />
        <CountCard
          label="Active Alerts"
          value={loading ? "—" : activeAlertCount}
          icon={AlertTriangle}
          tone="alert"
          to="/alerts"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold">Devices with active alerts</h2>
            <p className="text-[12px] text-muted-foreground">
              {mapPoints.length
                ? `${mapPoints.length} device${mapPoints.length === 1 ? "" : "s"} pinned on map`
                : "No active alerts at the moment"}
            </p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div style={{ height: 480 }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {mapPoints.map(({ coords, device, alarm }, i) => (
              <Marker key={i} position={coords} icon={alarmIcon}>
                <Popup>
                  <div className="text-[12px] space-y-0.5">
                    <div className="font-semibold">
                      {device.name || device.externalDeviceId || `Device #${device.id}`}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Code:</span>{" "}
                      <span className="text-destructive font-medium">
                        {alarm?.alarmCode ?? device.alarmCode ?? "Alert"}
                      </span>
                    </div>
                    {alarm?.updatedAt ? (
                      <div>
                        <span className="text-muted-foreground">When:</span>{" "}
                        {new Date(alarm.updatedAt).toLocaleString()}
                      </div>
                    ) : null}
                    {device.id ? (
                      <Link
                        to={`/devices/${device.id}`}
                        className="text-primary underline mt-1 inline-block"
                      >
                        Open device
                      </Link>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            ))}
            <FitToMarkers points={mapPoints.map((p) => p.coords)} />
          </MapContainer>
        </div>
      </Card>

      <Card className="mt-5 p-4">
        <h2 className="text-[14px] font-semibold mb-2">Recent alarm stream</h2>
        {events.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No alarm events received yet.</p>
        ) : (
          <ul className="divide-y divide-border text-[12px]">
            {events.slice(0, 8).map((ev, i) => (
              <li key={i} className="py-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {ev.externalDeviceId || `Device #${ev.deviceId}`}{" "}
                    <span
                      className={`ml-2 ${ev.alarmCode ? "text-destructive" : "text-success"}`}
                    >
                      {ev.alarmCode ?? "Cleared"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {ev.updatedAt ? new Date(ev.updatedAt).toLocaleString() : ""}
                  </div>
                </div>
                {ev.deviceId ? (
                  <Link to={`/devices/${ev.deviceId}`} className="text-primary hover:underline">
                    View
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
