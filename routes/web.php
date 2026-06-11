<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| The SPA (React) handles all frontend routing. In development, Vite serves
| the frontend directly. In production, the catch-all serves index.html.
|
*/

// Handle static assets and serve the SPA fallback.
// Exclude: /api, /sanctum, /_ignition, /up (health check)
Route::get('/{any?}', function (string $any = '') {
    // If the path matches an existing file in public/, serve it directly.
    if ($any !== '') {
        $filePath = public_path($any);
        if (file_exists($filePath) && is_file($filePath)) {
            $mime = match (pathinfo($filePath, PATHINFO_EXTENSION)) {
                'js'   => 'application/javascript',
                'css'  => 'text/css',
                'json' => 'application/json',
                'svg'  => 'image/svg+xml',
                'webp' => 'image/webp',
                'png'  => 'image/png',
                'jpg',
                'jpeg' => 'image/jpeg',
                'ico'  => 'image/x-icon',
                'woff2'=> 'font/woff2',
                default => mime_content_type($filePath) ?: 'application/octet-stream',
            };
            return response(file_get_contents($filePath), 200, ['Content-Type' => $mime]);
        }
    }

    // SPA fallback: serve index.html for any non-API route.
    $indexPath = public_path('index.html');
    if (!file_exists($indexPath)) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response(file_get_contents($indexPath), 200, ['Content-Type' => 'text/html']);
})->where('any', '^(?!api|sanctum|_ignition|up).*$')->name('spa');
