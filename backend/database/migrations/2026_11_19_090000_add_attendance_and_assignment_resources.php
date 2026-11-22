<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('status', 10);
            $table->string('note')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unique(['section_id', 'student_id', 'date']);
            $table->index(['section_id', 'date']);
            $table->timestamps();
        });

        Schema::create('assignment_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 10);
            $table->string('path');
            $table->string('original_name');
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });

        Schema::table('assignments', function (Blueprint $table): void {
            $table->unsignedInteger('max_marks')->default(100);
            $table->string('youtube_url')->nullable();
            $table->json('questions')->nullable();
        });

        Schema::table('submissions', function (Blueprint $table): void {
            $table->string('file_path')->nullable()->change();
            $table->string('original_name')->nullable();
            $table->text('text_answer')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('submitted_by');
            $table->dropColumn(['original_name', 'text_answer']);
        });
        Schema::table('assignments', function (Blueprint $table): void {
            $table->dropColumn(['max_marks', 'youtube_url', 'questions']);
        });
        Schema::dropIfExists('assignment_attachments');
        Schema::dropIfExists('attendance_records');
    }
};
