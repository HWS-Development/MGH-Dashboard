<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        try {
            $ok = Auth::attempt($this->only('email', 'password'), $this->boolean('remember'));
        } catch (\PDOException $e) {
            // DB unavailable (e.g. Hostinger max_connections_per_hour) —
            // fall back to env hash check
            $ok = $this->fallbackAuth();
        }

        if (! $ok) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Fallback authentication using APP_ADMIN_EMAIL + APP_ADMIN_HASH from .env
     * when the database is unavailable.
     */
    private function fallbackAuth(): bool
    {
        $email = config('app.admin_email');
        $hash  = config('app.admin_hash');

        if (! $email || ! $hash) {
            return false;
        }

        if ($this->string('email') !== $email) {
            return false;
        }

        if (! password_verify($this->string('password'), $hash)) {
            return false;
        }

        // Find or create a temporary user object to log in
        $user = \App\Models\User::where('email', $email)->first();
        if (! $user) {
            return false;
        }

        Auth::login($user);

        return true;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}
