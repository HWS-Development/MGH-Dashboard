<?php

use Illuminate\Foundation\Application;

define('LARAVEL_START', microtime(true));

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
