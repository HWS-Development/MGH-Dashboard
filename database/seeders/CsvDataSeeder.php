<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CsvDataSeeder extends Seeder
{
    /**
     * Seed all MGH tables from CSV files in the project root.
     * Each CSV file maps directly to a MySQL table.
     */
    public function run(): void
    {
        $csvDir = base_path();

        // Order matters: reference tables first, then tables with FKs
        $tables = [
            'mgh_cities'                    => 'mgh_cities_rows.csv',
            'mgh_property_types'            => 'mgh_property_types_rows.csv',
            'mgh_neighborhoods'             => 'mgh_neighborhoods_rows.csv',
            'mgh_amenities_catalog'         => 'mgh_amenities_catalog_rows.csv',
            'mgh_services_catalog'          => 'mgh_services_catalog_rows.csv',
            'mgh_booking_conditions_catalog' => 'mgh_booking_conditions_catalog_rows.csv',
            'mgh_properties_final'          => 'mgh_properties_final_rows.csv',
            'mgh_experiences'               => 'mgh_experiences_rows.csv',
            'mgh_destinations'              => 'mgh_destinations_rows.csv',
            'why_book_direct'               => 'why_book_direct_rows.csv',
            'amh_quartiers'                 => 'amh_quartiers_rows.csv',
            'amh_pois'                      => 'amh_pois_rows.csv',
        ];

        foreach ($tables as $table => $csvFile) {
            $filePath = $csvDir . DIRECTORY_SEPARATOR . $csvFile;

            if (!file_exists($filePath)) {
                $this->command->warn("CSV file not found: {$csvFile} — skipping {$table}");
                continue;
            }

            $this->command->info("Seeding {$table} from {$csvFile}...");
            $this->importCsv($table, $filePath);
        }
    }

    /**
     * Import a CSV file into the specified table.
     */
    private function importCsv(string $table, string $filePath): void
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->command->error("Cannot open file: {$filePath}");
            return;
        }

        // Read header row (disable PHP's proprietary backslash-escape to use
        // standard RFC 4180 CSV parsing — fixes fields containing \")
        $headers = fgetcsv($handle, 0, ',', '"', '');
        if (!$headers) {
            fclose($handle);
            return;
        }

        // Clean BOM from first header if present
        $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);

        // Map CSV columns to table columns
        $columnMap = $this->getColumnMap($table, $headers);

        $rowCount = 0;
        $batchSize = 50;
        $batch = [];

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
            if (count($row) !== count($headers)) {
                // Skip malformed rows
                continue;
            }

            $record = [];
            foreach ($headers as $index => $header) {
                $column = $columnMap[$header] ?? $header;
                $value = $row[$index];

                // Process value based on column type
                $record[$column] = $this->processValue($table, $column, $value);
            }

            $batch[] = $record;
            $rowCount++;

            if (count($batch) >= $batchSize) {
                DB::table($table)->insert($batch);
                $batch = [];
            }
        }

        // Insert remaining records
        if (!empty($batch)) {
            DB::table($table)->insert($batch);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        fclose($handle);
        $this->command->info("  → Inserted {$rowCount} rows into {$table}");
    }

    /**
     * Map CSV column headers to database column names.
     * Handles any name differences between CSV and schema.
     */
    private function getColumnMap(string $table, array $headers): array
    {
        // Default: CSV column name = DB column name (identity map)
        $map = [];
        foreach ($headers as $h) {
            $map[$h] = $h;
        }
        return $map;
    }

    /**
     * Process a CSV value into the appropriate PHP type for database insertion.
     */
    private function processValue(string $table, string $column, string $value): mixed
    {
        // Handle empty strings
        if ($value === '' || $value === 'null' || $value === 'NULL') {
            return null;
        }

        // Boolean columns
        $booleanColumns = ['is_published', 'is_featured'];
        if (in_array($column, $booleanColumns)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }

        // Integer columns
        $intColumns = ['sort_order', 'display_order', 'reviews_count', 'walking_minutes_from_jemaa'];
        if (in_array($column, $intColumns)) {
            return (int) $value;
        }

        // Float columns
        $floatColumns = ['longitude', 'latitude', 'lat', 'lng', 'rating_avg'];
        if (in_array($column, $floatColumns)) {
            return (float) $value;
        }

        // JSON columns - detect by content or known column names
        $jsonColumns = [
            'label', 'name', 'address', 'description', 'extra_info',
            'amenity_ids', 'service_ids', 'booking_condition_ids',
            'image_urls', 'gallery_urls', 'related_riads',
            'title_tr', 'subtitle_tr', 'destination_tr', 'short_intro_tr',
            'description_rich_tr', 'what_to_do_tr', 'good_to_know_tr',
            'booking_cta_label_tr', 'seo_title_tr', 'seo_description_tr',
            'seo_keywords_tr', 'name_tr', 'short_desc_tr', 'long_desc_tr',
            'todo_see_tr', 'images', 'category_tags', 'ambiance_tags',
            'seo_desc_tr', 'hours', 'price',
            'subtitle', 'intro_rich', 'getting_here', 'what_to_do',
            'good_to_know', 'when_to_visit', 'faq', 'hero_image_urls',
            'best_months', 'related_experiences', 'related_collections',
            'cta_label', 'seo_title', 'seo_description', 'seo_keywords',
            'changes',
        ];

        if (in_array($column, $jsonColumns)) {
            // Validate it's actual JSON before storing
            if ($this->isJson($value)) {
                return $value; // Store as-is (MySQL handles JSON strings)
            }
            return null;
        }

        // Timestamp columns - convert from Postgres format to MySQL format
        $timestampColumns = ['created_at', 'updated_at', 'approved_at'];
        if (in_array($column, $timestampColumns)) {
            return $this->parseTimestamp($value);
        }

        // ID column for why_book_direct (integer)
        if ($table === 'why_book_direct' && $column === 'id') {
            return (int) $value;
        }

        // Default: return as string
        return $value;
    }

    /**
     * Check if a string is valid JSON.
     */
    private function isJson(string $string): bool
    {
        if ($string === '' || $string[0] === ' ') return false;
        if ($string[0] !== '{' && $string[0] !== '[' && $string[0] !== '"') return false;
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Parse a PostgreSQL timestamp into MySQL format.
     * Input:  "2026-01-24 19:57:11.976102+00"
     * Output: "2026-01-24 19:57:11"
     */
    private function parseTimestamp(string $value): ?string
    {
        if (empty($value)) return null;

        try {
            $dt = new \DateTime($value);
            return $dt->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            // Try simple truncation as fallback
            return substr($value, 0, 19);
        }
    }
}
