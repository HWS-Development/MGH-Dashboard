<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\DataController;
use App\Http\Controllers\DestinationImageController;
use App\Http\Controllers\DestinationOrderController;
use App\Http\Controllers\ExperienceImageController;
use App\Http\Controllers\ExperienceOrderController;
use App\Http\Controllers\PartnerHotelController;
use App\Http\Controllers\PublicDataController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes for MGH-Dashboard API. These routes are loaded by the
| RouteServiceProvider and are assigned the "api" middleware group.
|
*/

// ─── Public Routes (no authentication required) ─────────────────────────────

Route::post('/register', [RegisteredUserController::class, 'store'])
    ->name('register');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->name('login');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->name('password.store');

// ─── Public Read-Only API (consumed by AMH-Website) ─────────────────────────
// No authentication required. Only exposes published content from whitelisted
// tables (experiences, destinations, etc.).
Route::prefix('public')->group(function () {
    Route::get('/experiences', [PublicDataController::class, 'listExperiences'])
        ->name('public.experiences.index');
    Route::get('/experiences/by-slugs', [PublicDataController::class, 'experiencesBySlugs'])
        ->name('public.experiences.bySlugs');
    Route::get('/experiences/{slug}', [PublicDataController::class, 'showExperience'])
        ->name('public.experiences.show');

    Route::get('/destinations', [PublicDataController::class, 'listDestinations'])
        ->name('public.destinations.index');
    Route::get('/destinations/{slug}', [PublicDataController::class, 'showDestination'])
        ->name('public.destinations.show');
});

// ─── Authenticated Routes ────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Current user info
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    })->name('user');

    // Email verification
    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    // ─── Data API (generic CRUD for MGH tables) ────────────────────────────────
    Route::post('/data/query', [DataController::class, 'query'])->name('data.query');

    // ─── Partner Hotels (Centra API proxy) ────────────────────────────────────
    Route::get('/partner/hotels', [PartnerHotelController::class, 'index'])
        ->name('partner.hotels.index');
    Route::get('/partner/hotels/stats', [PartnerHotelController::class, 'stats'])
        ->name('partner.hotels.stats');
    Route::get('/partner/hotels/{id}', [PartnerHotelController::class, 'show'])
        ->name('partner.hotels.show');
    Route::get('/partner/hotels/{id}/content', [PartnerHotelController::class, 'content'])
        ->name('partner.hotels.content');

    // ─── Experience Image Upload ──────────────────────────────────────────────
    Route::post('/experiences/upload-image', [ExperienceImageController::class, 'upload'])
        ->name('experiences.upload-image');
    Route::delete('/experiences/delete-image', [ExperienceImageController::class, 'delete'])
        ->name('experiences.delete-image');

    // ─── Experience Ordering ──────────────────────────────────────────────────
    Route::get('/experiences/next-order', [ExperienceOrderController::class, 'nextOrder'])
        ->name('experiences.next-order');
    Route::post('/experiences/reorder', [ExperienceOrderController::class, 'reorder'])
        ->name('experiences.reorder');
    Route::post('/experiences/move', [ExperienceOrderController::class, 'move'])
        ->name('experiences.move');

    // ─── Destination Image Upload ────────────────────────────────────────────
    Route::post('/destinations/upload-image', [DestinationImageController::class, 'upload'])
        ->name('destinations.upload-image');
    Route::delete('/destinations/delete-image', [DestinationImageController::class, 'delete'])
        ->name('destinations.delete-image');

    // ─── Destination Ordering ────────────────────────────────────────────────
    Route::get('/destinations/next-order', [DestinationOrderController::class, 'nextOrder'])
        ->name('destinations.next-order');
    Route::post('/destinations/reorder', [DestinationOrderController::class, 'reorder'])
        ->name('destinations.reorder');
    Route::post('/destinations/move', [DestinationOrderController::class, 'move'])
        ->name('destinations.move');

    // ─── Functions API (callable server-side functions) ───────────────────────
    Route::post('/functions/{name}', function (Request $request, string $name) {
        // For now, return a stub. Real implementations can be added as needed.
        return response()->json([
            'data' => null,
            'message' => "Function '{$name}' executed.",
        ]);
    })->name('functions.invoke');

    // ─── Admin Only Routes ───────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', function () {
            return response()->json(\App\Models\User::all());
        })->name('admin.users');

        Route::get('/dashboard-stats', function () {
            return response()->json([
                'total_users' => \App\Models\User::count(),
                'admin_users' => \App\Models\User::where('role', 'admin')->count(),
                'regular_users' => \App\Models\User::where('role', 'user')->count(),
                'verified_users' => \App\Models\User::whereNotNull('email_verified_at')->count(),
            ]);
        })->name('admin.dashboard-stats');
    });
});
