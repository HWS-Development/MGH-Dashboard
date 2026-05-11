<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| The SPA (React) handles all frontend routing. This catch-all route
| serves the main index.html for any non-API request.
|
*/

Route::get('/{any?}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*')->name('spa');
