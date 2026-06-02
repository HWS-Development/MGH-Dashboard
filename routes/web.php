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

// In production, serve the SPA for any route not handled by API or Sanctum.
// Exclude: /api, /sanctum, /_ignition, /up (health check)
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (!file_exists($indexPath)) {
        // In development Vite serves the frontend — this route is unused.
        return response()->json(['error' => 'Not found'], 404);
    }
    return file_get_contents($indexPath);
})->where('any', '^(?!api|sanctum|_ignition|up).*$')->name('spa');
