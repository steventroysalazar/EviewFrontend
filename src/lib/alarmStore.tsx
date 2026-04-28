import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { buildStreamUrl } from "./api";

export interface AlarmEvent {
  deviceId?: number;
  externalDeviceId?: string;
  alarmCode?: string | null;
  alarmTriggeredAt?: string | null;
  alarmCancelledAt?: string | null;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  // Allow additional fields from the backend.
  [key: string]: unknown;
}

interface AlarmContextValue {
  connected: boolean;
  events: AlarmEvent[];
  alarmsByDevice: Record<string, AlarmEvent>;
  clear: () => void;
}

const AlarmContext = createContext<AlarmContextValue | undefined>(undefined);

const normalize = (raw: any): AlarmEvent | null => {
  if (!raw || typeof raw !== "object") return null;
  const deviceId = Number(raw.deviceId ?? raw.internalDeviceId ?? raw.id ?? 0) || undefined;
  const externalDeviceId =
    String(raw.externalDeviceId ?? raw.external_device_id ?? raw.imei ?? "").trim() || undefined;
  if (!deviceId && !externalDeviceId) return null;
  return {
    ...raw,
    deviceId,
    externalDeviceId,
    alarmCode: raw.alarmCode ?? raw.alarm_code ?? raw.alertCode ?? null,
    alarmTriggeredAt: raw.alarmTriggeredAt ?? raw.alarm_triggered_at ?? null,
    alarmCancelledAt: raw.alarmCancelledAt ?? raw.alarm_cancelled_at ?? null,
    latitude: Number(raw.latitude ?? raw.lat ?? raw.gpsLatitude) || undefined,
    longitude: Number(raw.longitude ?? raw.lng ?? raw.gpsLongitude) || undefined,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.receivedAt ?? new Date().toISOString(),
  };
};

const parseEventData = (data: string): AlarmEvent | null => {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed?.type === "connected") return null;
    if (parsed?.type === "alarm-update" && parsed.payload) return normalize(parsed.payload);
    if (parsed?.payload) return normalize(parsed.payload);
    return normalize(parsed);
  } catch {
    return null;
  }
};

export const AlarmProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [alarmsByDevice, setAlarmsByDevice] = useState<Record<string, AlarmEvent>>({});
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = buildStreamUrl("/api/alarms/stream");
    let source: EventSource;
    try {
      source = new EventSource(url);
    } catch {
      return;
    }
    sourceRef.current = source;

    const handle = (e: MessageEvent) => {
      const ev = parseEventData(e.data);
      if (!ev) return;
      setEvents((prev) => [ev, ...prev].slice(0, 100));
      setAlarmsByDevice((prev) => {
        const next = { ...prev };
        if (ev.deviceId) next[`id:${ev.deviceId}`] = ev;
        if (ev.externalDeviceId) next[`ext:${ev.externalDeviceId}`] = ev;
        return next;
      });
    };

    source.addEventListener("connected", () => setConnected(true));
    source.addEventListener("alarm-update", handle as EventListener);
    source.onmessage = handle;
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, []);

  const value = useMemo<AlarmContextValue>(
    () => ({
      connected,
      events,
      alarmsByDevice,
      clear: () => {
        setEvents([]);
        setAlarmsByDevice({});
      },
    }),
    [connected, events, alarmsByDevice]
  );

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
};

export const useAlarms = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarms must be used within AlarmProvider");
  return ctx;
};
