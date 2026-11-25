<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $email = config('aspire.initial_admin_email');
        $password = config('aspire.initial_admin_password');

        if (! $email || ! $password) {
            $this->command?->warn('Initial administrator not created: set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD.');

            return;
        }

        User::firstOrCreate(['email' => strtolower($email)], [
            'name' => config('aspire.initial_admin_name', 'Super Admin'),
            'password' => $password,
            'role' => 'super_admin',
            'active' => true,
        ]);
    }
}
