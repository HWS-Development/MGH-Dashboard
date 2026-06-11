<?php

return [
    'name' => env('APP_NAME', 'MGH-Dashboard'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'asset_url' => env('ASSET_URL'),
    'timezone' => 'UTC',
    'locale' => 'en',
    'fallback_locale' => 'en',
    'faker_locale' => 'en_US',
    'cipher' => 'AES-256-CBC',
    'key' => env('APP_KEY'),

    /*
    | Fallback admin credentials for when the database is unavailable
    | (e.g. Hostinger max_connections_per_hour limit reached).
    | Generate the hash locally: php -r "echo password_hash('your-password', PASSWORD_BCRYPT);"
    */
    'admin_email' => env('APP_ADMIN_EMAIL'),
    'admin_hash'  => env('APP_ADMIN_HASH'),
    'previous_keys' => [
        ...array_filter(
            explode(',', env('APP_PREVIOUS_KEYS', ''))
        ),
    ],
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],
    'providers' => \Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
    ])->toArray(),
];
