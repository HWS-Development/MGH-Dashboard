<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DataController extends Controller
{
    /**
     * Allowed tables for security (whitelist).
     */
    private array $allowedTables = [
        'mgh_properties_final',
        'mgh_contacts',
        'mgh_cities',
        'mgh_neighborhoods',
        'mgh_property_types',
        'mgh_amenities_catalog',
        'mgh_services_catalog',
        'mgh_booking_conditions_catalog',
        'mgh_experiences',
        'mgh_destinations',
        'why_book_direct',
        'amh_quartiers',
        'amh_pois',
        'pending_updates',
    ];

    /**
     * Handle a generic data query request.
     * Supports: list, get, insert, update, delete, test_connection
     */
    public function query(Request $request)
    {
        $action = $request->input('action');
        $table = $request->input('table');

        // Validate table name
        if (!in_array($table, $this->allowedTables)) {
            return response()->json(['error' => "Table '{$table}' is not allowed."], 403);
        }

        if (!Schema::hasTable($table)) {
            return response()->json(['error' => "Table '{$table}' does not exist."], 404);
        }

        return match ($action) {
            'list' => $this->handleList($table, $request->input('params', [])),
            'get' => $this->handleGet($table, $request->input('id')),
            'insert' => $this->handleInsert($table, $request->input('data', [])),
            'update' => $this->handleUpdate($table, $request->input('id'), $request->input('data', []), $request->input('params', [])),
            'delete' => $this->handleDelete($table, $request->input('id')),
            'test_connection' => $this->handleTestConnection($table),
            default => response()->json(['error' => "Unknown action: {$action}"], 400),
        };
    }

    /**
     * List records with optional filters and ordering.
     */
    private function handleList(string $table, array $params)
    {
        $query = DB::table($table);

        // Apply filters (PostgREST-like syntax: field => "eq.value", "like.%value%", "in.(a,b,c)")
        if (!empty($params['filters'])) {
            foreach ($params['filters'] as $field => $condition) {
                if (is_string($condition) && str_contains($condition, '.')) {
                    [$operator, $value] = explode('.', $condition, 2);
                    match ($operator) {
                        'eq' => $query->where($field, '=', $value),
                        'neq' => $query->where($field, '!=', $value),
                        'gt' => $query->where($field, '>', $value),
                        'gte' => $query->where($field, '>=', $value),
                        'lt' => $query->where($field, '<', $value),
                        'lte' => $query->where($field, '<=', $value),
                        'like', 'ilike' => $query->where($field, 'LIKE', $value),
                        'in' => $query->whereIn($field, explode(',', trim($value, '()'))),
                        'is' => $value === 'null' ? $query->whereNull($field) : $query->where($field, '=', $value),
                        default => $query->where($field, '=', $condition),
                    };
                } else {
                    $query->where($field, '=', $condition);
                }
            }
        }

        // Apply search (basic text search across common fields)
        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search, $table) {
                $columns = Schema::getColumnListing($table);
                foreach ($columns as $col) {
                    $q->orWhere($col, 'LIKE', "%{$search}%");
                }
            });
        }

        // Apply ordering (PostgREST-like: "field.asc" or "field.desc")
        if (!empty($params['order'])) {
            $parts = explode('.', $params['order']);
            $orderField = $parts[0];
            $direction = $parts[1] ?? 'asc';
            $query->orderBy($orderField, $direction);
        }

        // Apply pagination
        $limit = $params['limit'] ?? null;
        $offset = $params['offset'] ?? 0;
        if ($limit) {
            $query->limit((int)$limit)->offset((int)$offset);
        }

        $data = $query->get();

        // Decode JSON columns for the client
        $data = $data->map(function ($row) {
            $row = (array)$row;
            foreach ($row as $key => $value) {
                if (is_string($value) && $this->isJson($value)) {
                    $row[$key] = json_decode($value, true);
                }
            }
            return $row;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get a single record by ID.
     */
    private function handleGet(string $table, $id)
    {
        if (!$id) {
            return response()->json(['error' => 'ID is required.'], 400);
        }

        $pkField = $this->getPrimaryKey($table);
        $record = DB::table($table)->where($pkField, $id)->first();

        if (!$record) {
            return response()->json(['data' => [], 'error' => 'Not found.'], 404);
        }

        $record = (array)$record;
        foreach ($record as $key => $value) {
            if (is_string($value) && $this->isJson($value)) {
                $record[$key] = json_decode($value, true);
            }
        }

        return response()->json(['data' => [$record]]);
    }

    /**
     * Insert a new record.
     */
    private function handleInsert(string $table, array $data)
    {
        if (empty($data)) {
            return response()->json(['error' => 'Data is required.'], 400);
        }

        // Auto-generate UUID for tables that use uuid PKs
        $pkField = $this->getPrimaryKey($table);
        if ($pkField === 'id' && in_array($table, ['mgh_properties_final', 'mgh_experiences', 'mgh_destinations']) && empty($data['id'])) {
            $data['id'] = (string)Str::uuid();
        }

        // Auto-assign sequential sort_order for mgh_experiences
        if ($table === 'mgh_experiences') {
            $maxOrder = DB::table('mgh_experiences')->max('sort_order') ?? 0;
            $data['sort_order'] = $maxOrder + 1;
        }

        // Auto-assign sequential sort_order for mgh_destinations
        if ($table === 'mgh_destinations') {
            $maxOrder = DB::table('mgh_destinations')->max('sort_order') ?? 0;
            $data['sort_order'] = $maxOrder + 1;
        }

        // Encode arrays/objects as JSON for storage
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $data[$key] = json_encode($value);
            }
        }

        // Add timestamps
        $now = now();
        if (Schema::hasColumn($table, 'created_at') && !isset($data['created_at'])) {
            $data['created_at'] = $now;
        }
        if (Schema::hasColumn($table, 'updated_at') && !isset($data['updated_at'])) {
            $data['updated_at'] = $now;
        }

        $id = DB::table($table)->insertGetId($data);

        return response()->json(['data' => ['id' => $data['id'] ?? $id, 'sort_order' => $data['sort_order'] ?? null], 'message' => 'Created successfully.'], 201);
    }

    /**
     * Update a record by ID.
     */
    private function handleUpdate(string $table, $id, array $data, array $params = [])
    {
        if (!$id) {
            return response()->json(['error' => 'ID is required.'], 400);
        }

        if (empty($data)) {
            return response()->json(['error' => 'Data is required.'], 400);
        }

        // Allow custom PK field (e.g. "property_id" for mgh_contacts)
        $pkField = $params['pk_field'] ?? $this->getPrimaryKey($table);

        // Encode arrays/objects as JSON
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $data[$key] = json_encode($value);
            }
        }

        // Update timestamp
        if (Schema::hasColumn($table, 'updated_at') && !isset($data['updated_at'])) {
            $data['updated_at'] = now();
        }

        $affected = DB::table($table)->where($pkField, $id)->update($data);

        return response()->json(['data' => ['affected' => $affected], 'message' => 'Updated successfully.']);
    }

    /**
     * Delete a record by ID.
     */
    private function handleDelete(string $table, $id)
    {
        if (!$id) {
            return response()->json(['error' => 'ID is required.'], 400);
        }

        $pkField = $this->getPrimaryKey($table);
        $affected = DB::table($table)->where($pkField, $id)->delete();

        // Re-sequence sort_order for mgh_experiences after delete (close gaps)
        if ($table === 'mgh_experiences' && $affected > 0) {
            $this->resequenceTable('mgh_experiences');
        }

        // Re-sequence sort_order for mgh_destinations after delete (close gaps)
        if ($table === 'mgh_destinations' && $affected > 0) {
            $this->resequenceTable('mgh_destinations');
        }

        return response()->json(['data' => ['affected' => $affected], 'message' => 'Deleted successfully.']);
    }

    /**
     * Re-sequence all records in a table's sort_order to be strictly sequential (1, 2, 3...N).
     */
    private function resequenceTable(string $table): void
    {
        $records = DB::table($table)
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->select('id')
            ->get();

        foreach ($records as $index => $record) {
            DB::table($table)
                ->where('id', $record->id)
                ->update(['sort_order' => $index + 1, 'updated_at' => now()]);
        }
    }

    /**
     * Test database connection.
     */
    private function handleTestConnection(string $table)
    {
        try {
            $count = DB::table($table)->count();
            return response()->json(['data' => ['connected' => true, 'count' => $count]]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Connection failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the primary key field for a table.
     */
    private function getPrimaryKey(string $table): string
    {
        return match ($table) {
            'mgh_contacts' => 'id',
            'mgh_properties_final' => 'id',
            default => 'id',
        };
    }

    /**
     * Check if a string is valid JSON.
     */
    private function isJson(string $string): bool
    {
        if ($string === '' || $string[0] === ' ') return false;
        if ($string[0] !== '{' && $string[0] !== '[') return false;
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
}
