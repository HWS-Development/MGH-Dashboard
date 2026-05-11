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

// ── Raw fetch functions (throw on error) ────────────────────────────

async function fetchAllHotels() {
  const res = await api.get('/partner/hotels');

  if (!res.data?.success) {
    throw new Error(
      res.data?.error || res.data?.message || 'Unknown error fetching hotels'
    );
  }

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
