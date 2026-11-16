<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('centers', function (Blueprint $table): void {
            $table->string('code', 30)->nullable()->unique();
            $table->string('email')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_phone', 40)->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->date('established_on')->nullable();
            $table->string('opens_at', 5)->nullable();
            $table->string('closes_at', 5)->nullable();
            $table->json('operating_days')->nullable();
            $table->text('notes')->nullable();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('phone', 40)->nullable();
            $table->string('designation')->nullable();
            $table->timestamp('last_login_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table): void {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'email', 'postal_code', 'contact_person', 'contact_phone', 'capacity', 'established_on', 'opens_at', 'closes_at', 'operating_days', 'notes']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['phone', 'designation', 'last_login_at']);
        });
    }
};
