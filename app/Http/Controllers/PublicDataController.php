<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PublicDataController
 *
 * Exposes read-only, unauthenticated endpoints consumed by the public
 * AMH-Website (amh-website). Only whitelisted tables are accessible
 * and (where applicable) only `is_published = 1` rows are returned.
 */
class PublicDataController extends Controller
{
    /**
     * Tables that may be read publicly + columns exposed for list views.
     * For detail views (`show*`) we still return the full record.
     */
    private array $publicTables = [
        'mgh_experiences'  => true,
        'mgh_destinations' => true,
        'why_book_direct'  => true,
        'amh_quartiers'    => true,
        'amh_pois'         => true,
    ];

    // ─── Experiences ─────────────────────────────────────────────────────────

    public function listExperiences(Request $request)
    {
        return $this->publicList('mgh_experiences', $request, [
            'published_only' => true,
            'order'          => 'sort_order',
        ]);
    }

    public function showExperience(string $slug)
    {
        return $this->publicShowBySlug('mgh_experiences', $slug, true);
    }

    public function experiencesBySlugs(Request $request)
    {
        $slugs = (array) $request->input('slugs', []);
        return $this->publicListBySlugs('mgh_experiences', $slugs, true);
    }

    // ─── Destinations ────────────────────────────────────────────────────────

    public function listDestinations(Request $request)
    {
        return $this->publicList('mgh_destinations', $request, [
            'published_only' => true,
            'order'          => 'sort_order',
        ]);
    }

    public function showDestination(string $slug)
    {
        return $this->publicShowBySlug('mgh_destinations', $slug, true);
    }

    // ─── Generic helpers ─────────────────────────────────────────────────────

    private function publicList(string $table, Request $request, array $opts = [])
    {
        if (!isset($this->publicTables[$table]) || !Schema::hasTable($table)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $query = DB::table($table);

        if (($opts['published_only'] ?? false) && Schema::hasColumn($table, 'is_published')) {
            $query->where('is_published', 1);
        }

        // Optional slug filter (?slugs=a,b,c)
        if ($request->filled('slugs') && Schema::hasColumn($table, 'slug')) {
            $slugs = array_filter(array_map('trim', explode(',', (string) $request->query('slugs'))));
            if ($slugs) {
                $query->whereIn('slug', $slugs);
            }
        }

        // Ordering
        $orderField = $opts['order'] ?? 'id';
        if (Schema::hasColumn($table, $orderField)) {
            $query->orderBy($orderField, 'asc');
        }

        // Optional limit
        if ($limit = (int) $request->query('limit')) {
            $query->limit($limit);
        }

        $rows = $query->get()->map(fn ($row) => $this->decodeJsonColumns((array) $row));

        return response()->json(['data' => $rows]);
    }

    private function publicShowBySlug(string $table, string $slug, bool $publishedOnly = true)
    {
        if (!isset($this->publicTables[$table]) || !Schema::hasTable($table)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $query = DB::table($table)->where('slug', $slug);
        if ($publishedOnly && Schema::hasColumn($table, 'is_published')) {
            $query->where('is_published', 1);
        }

        $record = $query->first();
        if (!$record) {
            return response()->json(['data' => null, 'error' => 'Not found'], 404);
        }

        return response()->json(['data' => $this->decodeJsonColumns((array) $record)]);
    }

    private function publicListBySlugs(string $table, array $slugs, bool $publishedOnly = true)
    {
        if (!isset($this->publicTables[$table]) || !Schema::hasTable($table)) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if (empty($slugs)) {
            return response()->json(['data' => []]);
        }

        $query = DB::table($table)->whereIn('slug', $slugs);
        if ($publishedOnly && Schema::hasColumn($table, 'is_published')) {
            $query->where('is_published', 1);
        }

        $rows = $query->get()->map(fn ($row) => $this->decodeJsonColumns((array) $row));

        return response()->json(['data' => $rows]);
    }

    private function decodeJsonColumns(array $row): array
    {
        foreach ($row as $key => $value) {
            if (is_string($value) && $value !== '' && ($value[0] === '{' || $value[0] === '[')) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row[$key] = $decoded;
                }
            }
        }
        return $row;
    }
}
