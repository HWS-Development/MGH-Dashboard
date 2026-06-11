<?php

use Illuminate\Foundation\Application;

define('LARAVEL_START', microtime(true));

// ── Serve static assets directly, bypassing Laravel ────────────────────
// This handles the case where Apache/LiteSpeed serves .js files with
// incorrect MIME types (text/plain instead of application/javascript).
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($uri !== '/' && $uri !== '/index.php') {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = match ($ext) {
            'js'    => 'application/javascript',
            'mjs'   => 'application/javascript',
            'css'   => 'text/css',
            'json'  => 'application/json',
            'svg'   => 'image/svg+xml',
            'webp'  => 'image/webp',
            'png'   => 'image/png',
            'jpg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'ico'   => 'image/x-icon',
            'woff2' => 'font/woff2',
            'woff'  => 'font/woff',
            'ttf'   => 'font/ttf',
            'map'   => 'application/json',
            default => null,
        };
        if ($mime) {
            header('Content-Type: ' . $mime);
            readfile($filePath);
            exit;
        }
    }
}
// ────────────────────────────────────────────────────────────────────────

// Suppress PHP 8.5 deprecation warnings that break the built-in server
// (vendor code uses deprecated PDO constants not yet updated for PHP 8.5)
error_reporting(E_ALL & ~E_DEPRECATED);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Illuminate\Http\Request::capture());
