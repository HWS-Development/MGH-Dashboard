<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class DestinationImageController extends Controller
{
    /**
     * Allowed MIME types for destination images.
     */
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Max file size in bytes (5 MB).
     */
    private const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    /**
     * Image quality for compression (0-100).
     */
    private const IMAGE_QUALITY = 60;

    /**
     * Upload a destination image to storage.
     *
     * POST /api/destinations/upload-image
     * Content-Type: multipart/form-data
     * Body: file (image), type (hero|gallery)
     *
     * Returns: { url: string, filename: string, size: int, mime: string, width: int, height: int }
     */
    public function upload(Request $request)
    {
        // Validate that a file was provided
        if (!$request->hasFile('file')) {
            return response()->json([
                'error' => 'No file provided.',
            ], 422);
        }

        $file = $request->file('file');

        // Check that the upload was successful
        if (!$file->isValid()) {
            return response()->json([
                'error' => 'File upload failed.',
            ], 422);
        }

        // Validate file size
        if ($file->getSize() > self::MAX_SIZE_BYTES) {
            return response()->json([
                'error' => 'File exceeds the 5 MB limit.',
            ], 422);
        }

        // Strict MIME type validation
        $uploadMime = $file->getMimeType();
        if (!in_array($uploadMime, self::ALLOWED_MIMES, true)) {
            return response()->json([
                'error' => 'The file is not a valid image. Allowed: JPG, PNG, GIF, WebP.',
            ], 422);
        }

        // Double-check with getimagesize() to ensure it's truly an image
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo === false) {
            return response()->json([
                'error' => 'The file does not appear to be a valid image.',
            ], 422);
        }

        // Determine extension from MIME
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            'image/webp' => 'webp',
        ];
        $ext = $extensions[$uploadMime] ?? 'jpg';

        // Generate unique filename: type_timestamp_random.ext
        $type = $request->input('type', 'image');
        $filename = $type . '_' . time() . '_' . Str::random(8) . '.' . $ext;

        // Compress image with quality=60 before storing
        $storagePath = 'Destinations_Images/' . $filename;
        $fullStoragePath = Storage::disk('public')->path($storagePath);

        // Ensure directory exists
        $dir = dirname($fullStoragePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Use GD to compress image with quality=60
        $this->compressAndSave($file->getRealPath(), $fullStoragePath, $ext, self::IMAGE_QUALITY);

        if (!Storage::disk('public')->exists($storagePath)) {
            return response()->json([
                'error' => 'Failed to save the file.',
            ], 500);
        }

        // Get final file info
        $finalInfo = @getimagesize($fullStoragePath);
        $finalSize = filesize($fullStoragePath);

        // Return the public URL
        $url = Storage::disk('public')->url($storagePath);

        return response()->json([
            'url'      => $url,
            'filename' => $filename,
            'size'     => $finalSize,
            'mime'     => $uploadMime,
            'width'    => $finalInfo[0] ?? null,
            'height'   => $finalInfo[1] ?? null,
        ]);
    }

    /**
     * Delete a destination image from storage.
     *
     * DELETE /api/destinations/delete-image
     * Body: { filename: string }
     */
    public function delete(Request $request)
    {
        $filename = $request->input('filename');

        if (!$filename) {
            return response()->json([
                'error' => 'No filename provided.',
            ], 422);
        }

        // Sanitize filename — prevent directory traversal
        $filename = basename($filename);
        $path = 'Destinations_Images/' . $filename;

        if (!Storage::disk('public')->exists($path)) {
            return response()->json([
                'error' => 'File not found.',
            ], 404);
        }

        Storage::disk('public')->delete($path);

        return response()->json([
            'success' => true,
            'message' => 'Image deleted.',
        ]);
    }

    /**
     * Compress and save an image with specified quality.
     */
    private function compressAndSave(string $sourcePath, string $destPath, string $ext, int $quality): void
    {
        switch ($ext) {
            case 'jpg':
                $img = @imagecreatefromjpeg($sourcePath);
                if ($img) {
                    imagejpeg($img, $destPath, $quality);
                    imagedestroy($img);
                } else {
                    copy($sourcePath, $destPath);
                }
                break;

            case 'png':
                $img = @imagecreatefrompng($sourcePath);
                if ($img) {
                    // PNG quality is 0-9 (0=no compression, 9=max)
                    // Convert quality percentage to PNG level
                    $pngQuality = (int) round((100 - $quality) / 11.111);
                    $pngQuality = max(0, min(9, $pngQuality));
                    imagealphablending($img, false);
                    imagesavealpha($img, true);
                    imagepng($img, $destPath, $pngQuality);
                    imagedestroy($img);
                } else {
                    copy($sourcePath, $destPath);
                }
                break;

            case 'webp':
                $img = @imagecreatefromwebp($sourcePath);
                if ($img) {
                    imagewebp($img, $destPath, $quality);
                    imagedestroy($img);
                } else {
                    copy($sourcePath, $destPath);
                }
                break;

            case 'gif':
                // GIF doesn't support quality compression, just copy
                copy($sourcePath, $destPath);
                break;

            default:
                copy($sourcePath, $destPath);
                break;
        }
    }
}
