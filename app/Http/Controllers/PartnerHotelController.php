<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Partner Hotel Controller — server-side proxy to the Centra partner API.
 *
 * Credentials never reach the browser. Token is cached server-side with
 * proactive refresh (60 s before expiry). On 401, token is invalidated
 * and a single retry is attempted.
 */
class PartnerHotelController extends Controller
{
    private const CACHE_TOKEN_KEY = 'centra_partner_token';
    private const CACHE_HOTELS_KEY = 'centra_partner_hotels';
    private const CACHE_ORG_ID_KEY = 'centra_partner_org_id';
    private const HOTELS_CACHE_TTL = 300; // 5 minutes

    /**
     * GET /api/partner/hotels
     * Returns all partner hotels from the Centra API (cached 5 min server-side).
     */
    public function index(): JsonResponse
    {
        try {
            // Server-side cache: avoid hitting Centra on every request
            $hotels = Cache::remember(self::CACHE_HOTELS_KEY, self::HOTELS_CACHE_TTL, function () {
                return $this->fetchHotelsFromCentra();
            });

            return response()->json([
                'success' => true,
                'data'    => $hotels,
            ]);
        } catch (\Exception $e) {
            Log::error('[PartnerHotelController] index error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * GET /api/partner/hotels/{id}
     * Returns a single partner hotel by ID.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $hotel = $this->fetchHotelByIdFromCentra($id);

            return response()->json([
                'success' => true,
                'data'    => $hotel,
            ]);
        } catch (\Exception $e) {
            Log::error("[PartnerHotelController] show({$id}) error: " . $e->getMessage());

            $status = str_contains($e->getMessage(), '404') ? 404 : 502;

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], $status);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────

    /**
     * Get a valid access token, using cache or logging in fresh.
     */
    private function getValidToken(): string
    {
        $cached = Cache::get(self::CACHE_TOKEN_KEY);

        if ($cached) {
            return $cached;
        }

        return $this->appLogin();
    }

    /**
     * Authenticate with the Centra partner API using app credentials.
     * Caches the token for (expiresIn - 60) seconds.
     */
    private function appLogin(): string
    {
        $baseUrl      = config('services.centra.api_base_url');
        $clientId     = config('services.centra.client_id');
        $clientSecret = config('services.centra.client_secret');

        if (!$baseUrl || !$clientId || !$clientSecret) {
            $missing = array_filter([
                !$baseUrl      ? 'CENTRA_API_BASE_URL' : null,
                !$clientId     ? 'PARTNER_APP_CLIENT_ID' : null,
                !$clientSecret ? 'PARTNER_APP_CLIENT_SECRET' : null,
            ]);
            throw new \RuntimeException('Missing Centra API configuration: ' . implode(', ', $missing));
        }

        $loginUrl = rtrim($baseUrl, '/') . '/apps/login';

        Log::info("[PartnerHotelController] POST {$loginUrl} (clientId: " . substr($clientId, 0, 16) . '...)');

        $response = Http::timeout(30)
            ->acceptJson()
            ->post($loginUrl, [
                'clientId'     => $clientId,
                'clientSecret' => $clientSecret,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException(
                "Centra login failed — POST {$loginUrl} returned {$response->status()}. " .
                "Body: " . substr($response->body(), 0, 500)
            );
        }

        $body    = $response->json();
        $payload = $body['data'] ?? $body;

        $accessToken = $payload['accessToken'] ?? null;
        $expiresIn   = $payload['expiresIn'] ?? 3600;

        if (!$accessToken) {
            throw new \RuntimeException(
                "Centra login succeeded ({$response->status()}) but no accessToken in response. " .
                "Keys: " . implode(', ', array_keys($body))
            );
        }

        // Extract organization ID from login payload (cached for fallback)
        $orgId = $payload['organizationId']
            ?? $payload['organization_id']
            ?? $payload['orgId']
            ?? $payload['org_id']
            ?? $payload['app']['orgId'] ?? null
            ?? $payload['app']['organizationId'] ?? null
            ?? $payload['app']['org_id'] ?? null
            ?? $payload['organization']['id'] ?? null
            ?? $payload['org']['id'] ?? null
            ?? $payload['user']['organizationId'] ?? null
            ?? $payload['account']['organizationId'] ?? null;
        if ($orgId) {
            Cache::put(self::CACHE_ORG_ID_KEY, $orgId, 86400); // 24h cache
            Log::info("[PartnerHotelController] Cached org ID: {$orgId}");
        }

        // Cache token for (expiresIn - 60) seconds (proactive refresh)
        $cacheTtl = max($expiresIn - 60, 60);
        Cache::put(self::CACHE_TOKEN_KEY, $accessToken, $cacheTtl);

        Log::info("[PartnerHotelController] Login OK — token cached for {$cacheTtl}s");

        return $accessToken;
    }

    /**
     * Invalidate the cached token (e.g. after a 401).
     */
    private function invalidateToken(): void
    {
        Cache::forget(self::CACHE_TOKEN_KEY);
    }

    /**
     * Fetch all partner hotels from the Centra API.
     * Handles token acquisition and single retry on 401.
     */
    private function fetchHotelsFromCentra(): array
    {
        $baseUrl   = rtrim(config('services.centra.api_base_url'), '/');
        $hotelsUrl = $baseUrl . '/partner/hotels/content?limit=all';

        $token    = $this->getValidToken();
        $response = Http::timeout(60)
            ->acceptJson()
            ->withToken($token)
            ->get($hotelsUrl);

        // If 401, refresh token and retry once
        if ($response->status() === 401) {
            Log::warning('[PartnerHotelController] Got 401 fetching hotels — refreshing token...');
            $this->invalidateToken();
            Cache::forget(self::CACHE_HOTELS_KEY);

            $token    = $this->appLogin();
            $response = Http::timeout(60)
                ->acceptJson()
                ->withToken($token)
                ->get($hotelsUrl);
        }

        if (!$response->successful()) {
            throw new \RuntimeException(
                "Hotel fetch failed — GET {$hotelsUrl} returned {$response->status()}. " .
                "Body: " . substr($response->body(), 0, 500)
            );
        }

        $body = $response->json();

        if (!($body['success'] ?? false)) {
            throw new \RuntimeException(
                'Hotel fetch — API returned success=false. ' .
                'Message: ' . ($body['message'] ?? 'none')
            );
        }

        $count = is_array($body['data']) ? count($body['data']) : 'N/A';
        Log::info("[PartnerHotelController] Success — returning {$count} hotels");

        return $body['data'] ?? [];
    }

    /**
     * GET /api/partner/hotels/{id}/content
     * Returns structured amenities, services, and facilities from Centra.
     *
     * Accepts an optional X-Partner-Organization-Id header passed from
     * the frontend (cached from listing data) which is forwarded to
     * Centra as X-Organization-Id for multi-org access.
     */
    public function content(string $id): JsonResponse
    {
        try {
            $organizationId = request()->header('x-partner-organization-id');

            if (!$organizationId) {
                $organizationId = Cache::get(self::CACHE_ORG_ID_KEY);
            }

            if (!$organizationId) {
                // Force a fresh login to extract org ID from payload
                $this->invalidateToken();
                $this->getValidToken();
                $organizationId = Cache::get(self::CACHE_ORG_ID_KEY);
            }

            try {
                $hotel = $this->fetchHotelByIdFromCentra($id, $organizationId);
            } catch (\Exception $e) {
                // If the first attempt fails (likely 403 — wrong org),
                // scan the listing for this hotel's image URL to extract its org ID.
                $msg = $e->getMessage();
                Log::warning("[PartnerHotelController] content({$id}) first attempt failed — scanning listing for hotel's org ID. Error: {$msg}");

                $hotels = $this->fetchHotelsFromCentra();
                $matchedOrgId = null;
                foreach ($hotels as $hotel) {
                    $urls = $hotel['image_urls'] ?? [];
                    if (!is_array($urls)) continue;

                    // Check if this hotel matches the requested ID
                    $matchesId = ($hotel['hotelId'] ?? null) === $id
                        || ($hotel['id'] ?? null) === $id;
                    if (!$matchesId) continue;

                    // Extract org ID from its image URLs
                    foreach ($urls as $url) {
                        if (preg_match('#/(ORG-[A-Z0-9]+)/#i', (string)$url, $m)) {
                            $matchedOrgId = $m[1];
                            break 2;
                        }
                    }
                }

                if ($matchedOrgId && $matchedOrgId !== $organizationId) {
                    Log::info("[PartnerHotelController] content({$id}) — retrying with hotel's own org ID: {$matchedOrgId}");
                    $hotel = $this->fetchHotelByIdFromCentra($id, $matchedOrgId);
                } elseif ($matchedOrgId) {
                    // Same org ID already tried — use listing data as fallback
                    Log::info("[PartnerHotelController] content({$id}) — same org ID already tried, returning listing data");
                    $hotel = collect($hotels)->first(function ($h) use ($id) {
                        return ($h['hotelId'] ?? null) === $id || ($h['id'] ?? null) === $id;
                    });
                    if (!$hotel) throw $e;
                } else {
                    throw $e;
                }
            }

            return response()->json([
                'success' => true,
                'data'    => $hotel,
            ]);
        } catch (\Exception $e) {
            Log::error("[PartnerHotelController] content({$id}) error: " . $e->getMessage());

            $status = str_contains($e->getMessage(), '404') ? 404 : 502;

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Fetch a single partner hotel by ID from the Centra API.
     * Handles token acquisition and single retry on 401.
     *
     * @param  string      $hotelId
     * @param  string|null $organizationId  Forwarded as X-Organization-Id
     *                                       for multi-org access.
     */
    private function fetchHotelByIdFromCentra(string $hotelId, ?string $organizationId = null): mixed
    {
        $baseUrl  = rtrim(config('services.centra.api_base_url'), '/');
        $hotelUrl = $baseUrl . '/partner/hotels/' . urlencode($hotelId) . '/content';

        $token    = $this->getValidToken();

        $request = Http::timeout(30)
            ->acceptJson()
            ->withToken($token);

        if ($organizationId) {
            $request->withHeader('X-Organization-Id', $organizationId);
        }

        $response = $request->get($hotelUrl);

        // If 401, refresh token and retry once
        if ($response->status() === 401) {
            Log::warning("[PartnerHotelController] Got 401 fetching hotel {$hotelId} — refreshing token...");
            $this->invalidateToken();

            $token    = $this->appLogin();
            $request  = Http::timeout(30)
                ->acceptJson()
                ->withToken($token);

            if ($organizationId) {
                $request->withHeader('X-Organization-Id', $organizationId);
            }

            $response = $request->get($hotelUrl);
        }

        if ($response->status() === 404) {
            throw new \RuntimeException("Hotel {$hotelId} not found (404).");
        }

        if (!$response->successful()) {
            throw new \RuntimeException(
                "Hotel detail fetch failed — GET {$hotelUrl} returned {$response->status()}. " .
                "Body: " . substr($response->body(), 0, 500)
            );
        }

        $body = $response->json();

        if (!($body['success'] ?? false)) {
            throw new \RuntimeException(
                'Hotel detail fetch — API returned success=false. ' .
                'Message: ' . ($body['message'] ?? 'none')
            );
        }

        Log::info("[PartnerHotelController] Success — returning hotel {$hotelId}");

        return $body['data'] ?? null;
    }
}
