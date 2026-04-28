// Per-page lookup hooks. Each hook fetches ONLY the data it needs,
// instead of a global provider that pre-fetches everything for every page.
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export interface LookupItem {
  id: number | string;
  name?: string;
  label?: string;
  email?: string;
  [key: string]: unknown;
}

const safeFetch = async <T,>(path: string): Promise<T[]> => {
  try {
    const data = await fetchApi<T[] | { items?: T[] }>(path);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as { items?: T[] }).items))
      return (data as { items: T[] }).items;
    return [];
  } catch {
    return [];
  }
};

function useLookup(path: string, enabled = true) {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    safeFetch<LookupItem>(path).then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path, enabled]);

  return { items, loading };
}

export const useCompaniesLookup = (enabled = true) =>
  useLookup("/api/lookups/companies", enabled);

export const useLocationsLookup = (enabled = true) =>
  useLookup("/api/lookups/locations", enabled);

export const useCompanyAdminsLookup = (enabled = true) =>
  useLookup("/api/lookups/company-admins", enabled);

export const usePortalUsersLookup = (enabled = true) =>
  useLookup("/api/lookups/portal-users", enabled);

export const useMobileUsersLookup = (enabled = true) =>
  useLookup("/api/lookups/mobile-users", enabled);

export const useSuperAdminsLookup = (enabled = true) =>
  useLookup("/api/lookups/super-admins", enabled);

export const fetchLocationUsers = (locationId: string | number) =>
  safeFetch<LookupItem>(`/api/lookups/locations/${locationId}/users`);
