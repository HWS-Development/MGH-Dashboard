<?php

use Illuminate\Foundation\Application;

define('LARAVEL_START', microtime(true));

// ── Serve built assets from dist/ with correct MIME types ────────────
// We build to dist/ (not public/) so Apache can't serve static files
// directly with wrong MIME types — every request reaches this file.
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$distDir = __DIR__ . '/../dist';

// Serve / (root) → dist/index.html
if ($uri === '/' || $uri === '') {
    $indexFile = $distDir . '/index.html';
    if (file_exists($indexFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexFile);
        exit;
    }
}

// Serve known asset paths from dist/
$assetPath = $distDir . $uri;
if (file_exists($assetPath) && is_file($assetPath)) {
    $ext = strtolower(pathinfo($assetPath, PATHINFO_EXTENSION));
    $mime = match ($ext) {
        'js'    => 'application/javascript',
        'mjs'   => 'application/javascript',
        'css'   => 'text/css',
        'json'  => 'application/json',
        'svg'   => 'image/svg+xml',
        'webp'  => 'image/webp',
        'png'   => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'gif'   => 'image/gif',
        'ico'   => 'image/x-icon',
        'woff2' => 'font/woff2',
        'woff'  => 'font/woff',
        'ttf'   => 'font/ttf',
        'map'   => 'application/json',
        default => mime_content_type($assetPath) ?: 'application/octet-stream',
    };
    header('Content-Type: ' . $mime);
    // Aggressive caching for hashed assets (1 year)
    if (preg_match('/[a-fA-F0-9]{8,}\.(js|css)$/', $uri)) {
        header('Cache-Control: public, max-age=31536000, immutable');
    }
    readfile($assetPath);
    exit;
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
