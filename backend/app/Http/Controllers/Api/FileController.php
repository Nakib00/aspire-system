<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentAttachment;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Serves private files through short-lived signed links (see the `url` accessors on the models). */
class FileController extends Controller
{
    /**
     * Stream an assignment attachment (requires a valid signed URL).
     *
     * GET /api/v1/files/attachments/{attachment}
     */
    public function attachment(AssignmentAttachment $attachment): StreamedResponse
    {
        return Storage::disk('local')->response($attachment->path, $attachment->original_name);
    }

    /**
     * Stream a student's submitted file (requires a valid signed URL).
     *
     * GET /api/v1/files/submissions/{submission}
     */
    public function submission(Submission $submission): StreamedResponse
    {
        abort_unless($submission->file_path, 404);

        return Storage::disk('local')->response($submission->file_path, $submission->original_name);
    }
}
