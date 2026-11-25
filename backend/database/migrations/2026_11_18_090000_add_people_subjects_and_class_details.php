<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('center_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 30)->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->unique(['center_id', 'name']);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('code', 30)->nullable()->unique();
            $table->string('gender', 10)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('address')->nullable();
            $table->string('school_name')->nullable();
            $table->string('grade_level', 40)->nullable();
            $table->string('qualification')->nullable();
            $table->date('joined_on')->nullable();
            $table->text('notes')->nullable();
        });

        Schema::table('parent_student', function (Blueprint $table): void {
            $table->string('relationship', 40)->nullable();
        });

        Schema::table('sections', function (Blueprint $table): void {
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('room')->nullable();
            $table->json('days')->nullable();
            $table->string('starts_at', 5)->nullable();
            $table->string('ends_at', 5)->nullable();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->text('description')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('subject_id');
            $table->dropColumn(['capacity', 'room', 'days', 'starts_at', 'ends_at', 'starts_on', 'ends_on', 'status', 'description']);
        });
        Schema::table('parent_student', function (Blueprint $table): void {
            $table->dropColumn('relationship');
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'gender', 'date_of_birth', 'address', 'school_name', 'grade_level', 'qualification', 'joined_on', 'notes']);
        });
        Schema::dropIfExists('subjects');
    }
};
