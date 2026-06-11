<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'admin@mgh-dashboard.com')->first();
if ($u) {
    $u->delete();
    echo "Deleted old admin\n";
}

App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@mgh-dashboard.com',
    'password' => Illuminate\Support\Facades\Hash::make('password'),
    'role' => 'admin'
]);
echo "Admin recreated\n";
