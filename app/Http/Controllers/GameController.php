<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request)
    {
        $player = $request->attributes->get('player');

        $todaysGame = Game::query()
            ->where('date', today())
            ->firstOrFail();
        $guesses = $todaysGame->guesses()
            ->where('player_id', $player->id)
            ->get();

        return Inertia::render('Game/Show', [
            'game' => [
                'id' => $todaysGame->id,
                'game_date' => $todaysGame->game_date,
                'status' => $todaysGame->status,
            ],
            'guesses' => $guesses->map(fn ($guess) => [
                'id' => $guess->id,
                'tmdb_movie_id' => $guess->tmdb_movie_id,
                'movie_title' => $guess->movie_title,
                'correct' => $guess->correct,
            ]),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Game $game)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
