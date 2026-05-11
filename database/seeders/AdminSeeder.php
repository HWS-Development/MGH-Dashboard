<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the admin account.
     * Creates a default admin user for first-time setup.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@mgh-dashboard.com'],
            [
                'name' => 'MGH Admin',
                'email' => 'admin@mgh-dashboard.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Admin account created successfully.');
        $this->command->info('Email: admin@mgh-dashboard.com');
        $this->command->info('Password: password');
        $this->command->warn('Please change the default password after first login!');
    }
}
