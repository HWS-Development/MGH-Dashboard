<?php

/*
 * CORS config.
 *
 * Allowed origins are read from the FRONTEND_URLS env (comma-separated list)
 * with FRONTEND_URL as a backwards-compatible single value.
 */
$origins = array_filter(array_map('trim', explode(
    ',',
    env('FRONTEND_URLS', env('FRONTEND_URL', 'http://localhost:5173'))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins,

    // Allow common local dev origins by pattern as well.
    'allowed_origins_patterns' => [
        '#^https?://localhost(:\d+)?$#',
        '#^https?://127\.0\.0\.1(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
