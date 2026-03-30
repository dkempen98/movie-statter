<?php

namespace App\Http\Controllers;

use App\Models\Guess;
use App\Models\Movie;
use Illuminate\Http\Request;

class GuessController extends Controller
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
        Movie::firstOrCreate(
            ['tmdb_movie_id' => $request->tmdb_movie_id],
            [
                'title' => $request->movie_title,
                'poster_path' => $request->poster_path,
                'backdrop_path' => $request->backdrop_path,
            ]
        );

        Guess::create([
            'game_id'       => $request->game_id,
            'player_id'     => $request->attributes->get('player')->id,
            'category_id'   => $request->category_id,
            'tmdb_movie_id' => $request->tmdb_movie_id,
            'points'        => $request->points,
            'correct'       => $request->correct,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Guess $guess)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Guess $guess)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guess $guess)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guess $guess)
    {
        //
    }
}
