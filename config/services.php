<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as the Centra partner API. This gives a convenient, uniform place to
    | manage these credentials.
    |
    */

    'centra' => [
        'api_base_url'  => env('CENTRA_API_BASE_URL', 'https://api.centra.global/api'),
        'client_id'     => env('PARTNER_APP_CLIENT_ID'),
        'client_secret' => env('PARTNER_APP_CLIENT_SECRET'),
        'test_key'      => env('CENTRA_TEST_KEY'),
    ],

];
