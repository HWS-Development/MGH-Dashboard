<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DestinationOrderController extends Controller
{
    /**
     * Get the next available sort_order (MAX + 1).
     * Used by the frontend to show the auto-assigned position on create.
     */
    public function nextOrder()
    {
        $maxOrder = DB::table('mgh_destinations')->max('sort_order') ?? 0;

        return response()->json([
            'data' => [
                'next_order' => $maxOrder + 1,
                'total' => DB::table('mgh_destinations')->count(),
            ],
        ]);
    }

    /**
     * Reorder a destination to a new position.
     * Shifts all other destinations to maintain strict sequential order (1, 2, 3...N).
     *
     * Expects: { id: string, new_position: int }
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'id' => 'required|string',
            'new_position' => 'required|integer|min:1',
        ]);

        $id = $request->input('id');
        $newPosition = $request->input('new_position');

        // Verify the destination exists
        $destination = DB::table('mgh_destinations')->where('id', $id)->first();
        if (!$destination) {
            return response()->json(['error' => 'Destination not found.'], 404);
        }

        $currentPosition = (int) $destination->sort_order;
        $totalCount = DB::table('mgh_destinations')->count();

        // Clamp new_position to valid range
        $newPosition = max(1, min($newPosition, $totalCount));

        if ($currentPosition === $newPosition) {
            return response()->json([
                'data' => ['message' => 'Position unchanged.'],
            ]);
        }

        $now = now();

        if ($newPosition < $currentPosition) {
            // Moving up: shift items in [newPosition, currentPosition-1] down by +1
            DB::table('mgh_destinations')
                ->where('sort_order', '>=', $newPosition)
                ->where('sort_order', '<', $currentPosition)
                ->where('id', '!=', $id)
                ->increment('sort_order', 1, ['updated_at' => $now]);
        } else {
            // Moving down: shift items in [currentPosition+1, newPosition] up by -1
            DB::table('mgh_destinations')
                ->where('sort_order', '>', $currentPosition)
                ->where('sort_order', '<=', $newPosition)
                ->where('id', '!=', $id)
                ->decrement('sort_order', 1, ['updated_at' => $now]);
        }

        // Set the target destination to its new position
        DB::table('mgh_destinations')
            ->where('id', $id)
            ->update(['sort_order' => $newPosition, 'updated_at' => $now]);

        return response()->json([
            'data' => [
                'id' => $id,
                'old_position' => $currentPosition,
                'new_position' => $newPosition,
            ],
            'message' => 'Reordered successfully.',
        ]);
    }

    /**
     * Move a destination up or down by one position.
     * Convenience endpoint for up/down arrow buttons.
     *
     * Expects: { id: string, direction: 'up'|'down' }
     */
    public function move(Request $request)
    {
        $request->validate([
            'id' => 'required|string',
            'direction' => 'required|in:up,down',
        ]);

        $id = $request->input('id');
        $direction = $request->input('direction');

        $destination = DB::table('mgh_destinations')->where('id', $id)->first();
        if (!$destination) {
            return response()->json(['error' => 'Destination not found.'], 404);
        }

        $currentPosition = (int) $destination->sort_order;
        $totalCount = DB::table('mgh_destinations')->count();

        if ($direction === 'up' && $currentPosition <= 1) {
            return response()->json(['data' => ['message' => 'Already at top.']]);
        }
        if ($direction === 'down' && $currentPosition >= $totalCount) {
            return response()->json(['data' => ['message' => 'Already at bottom.']]);
        }

        $newPosition = $direction === 'up' ? $currentPosition - 1 : $currentPosition + 1;

        // Swap with the adjacent destination
        $now = now();
        DB::table('mgh_destinations')
            ->where('sort_order', $newPosition)
            ->update(['sort_order' => $currentPosition, 'updated_at' => $now]);

        DB::table('mgh_destinations')
            ->where('id', $id)
            ->update(['sort_order' => $newPosition, 'updated_at' => $now]);

        return response()->json([
            'data' => [
                'id' => $id,
                'old_position' => $currentPosition,
                'new_position' => $newPosition,
            ],
            'message' => 'Moved successfully.',
        ]);
    }
}
