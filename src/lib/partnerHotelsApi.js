/**
 * Frontend helper — fetches partner hotels from our own backend API route.
 *
 * The backend handles authentication with the Centra partner API;
 * credentials never reach the browser.
 *
 * Raw fetch functions throw on error (for TanStack Query).
 * React Query hooks provide caching, deduplication, and automatic refetch.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/base44Client';

const PARTNER_ORG_CACHE_KEY = 'partnerHotelOrganizations';

export function extractCentraHotelId(imageUrls = []) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  for (const url of urls) {
    const match = String(url).match(/\/(HT-[A-Z0-9]+)\//i);
    if (match) return match[1];
  }
  return null;
}

export function extractCentraOrganizationId(imageUrls = []) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  for (const url of urls) {
    const match = String(url).match(/\/(ORG-[A-Z0-9]+)\//i);
    if (match) return match[1];
  }
  return null;
}

function readOrganizationCache() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PARTNER_ORG_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeOrganizationCache(cache) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PARTNER_ORG_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures
  }
}

function cacheHotelOrganizations(hotels = []) {
  const nextCache = { ...readOrganizationCache() };
  let changed = false;
  for (const hotel of Array.isArray(hotels) ? hotels : []) {
    const organizationId = extractCentraOrganizationId(hotel?.image_urls);
    if (!organizationId) continue;

    const ids = [
      hotel?.id,
      hotel?.hotelId,
      extractCentraHotelId(hotel?.image_urls),
    ];

    for (const id of ids) {
      if (id && nextCache[id] !== organizationId) {
        nextCache[id] = organizationId;
        changed = true;
      }
    }
  }
  if (changed) {
    writeOrganizationCache(nextCache);
  }
}

function getCachedOrganizationId(hotelId) {
  return readOrganizationCache()[hotelId];
}

function resolveOrganizationId(hotelId) {
  return getCachedOrganizationId(hotelId);
}

// ── Raw fetch functions (throw on error) ────────────────────────────

async function fetchAllHotels() {
  const res = await api.get('/partner/hotels');

  if (!res.data?.success) {
    throw new Error(
      res.data?.error || res.data?.message || 'Unknown error fetching hotels'
    );
  }

  cacheHotelOrganizations(res.data.data);
  return res.data.data;
}

async function fetchHotelById(id) {
  const res = await api.get(`/partner/hotels/${encodeURIComponent(id)}`);

  if (!res.data?.success) {
    throw new Error(
      res.data?.error || res.data?.message || `Unknown error fetching hotel ${id}`
    );
  }

  return res.data.data;
}

// ── Raw fetch: hotel content (amenities / services / facilities) ─────

async function fetchContentByHotelId(id) {
  const res = await api.get(`/partner/hotels/${encodeURIComponent(id)}/content`);

  if (!res.data?.success) {
    throw new Error(
      res.data?.error || res.data?.message || `Unknown error fetching content for hotel ${id}`
    );
  }

  return res.data.data;
}

// ── Legacy wrappers (return { data, error } for backward compat) ────

export async function fetchPartnerHotels() {
  try {
    const data = await fetchAllHotels();
    return { data, error: null };
  } catch (err) {
    console.error('[partnerHotelsApi] fetchPartnerHotels error:', err);
    return { data: null, error: err };
  }
}

export async function fetchPartnerHotelById(id) {
  try {
    const data = await fetchHotelById(id);
    return { data, error: null };
  } catch (err) {
    console.error('[partnerHotelsApi] fetchPartnerHotelById error:', err);
    return { data: null, error: err };
  }
}

// ── TanStack Query hooks ────────────────────────────────────────────

/**
 * Hook to fetch all partner hotels with caching.
 *
 * - staleTime: 5 min — won't refetch within 5 min of a successful fetch
 * - gcTime: 10 min — keep data in cache for 10 min after last subscriber unmounts
 * - Multiple components using this hook share the same cache entry & single request
 *
 * This replaces all the scattered `listProperties` calls that previously
 * used different query keys, causing redundant API calls. Now every
 * component shares the single ['partner-hotels'] cache entry.
 */
export function usePartnerHotels() {
  return useQuery({
    queryKey: ['partner-hotels'],
    queryFn: fetchAllHotels,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single partner hotel by ID with caching.
 */
export function usePartnerHotelById(id) {
  return useQuery({
    queryKey: ['partner-hotel', id],
    queryFn: () => fetchHotelById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch a hotel's content (amenities / services / facilities)
 * from the Centra API via our backend proxy.
 *
 * - enabled: only fires when `id` is truthy
 * - staleTime: 5 min
 */
export function usePartnerHotelContent(id) {
  return useQuery({
    queryKey: ['partner-hotel-content', id],
    queryFn: () => fetchContentByHotelId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('403') || error?.message?.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 800,
  });
}
