<?php

use App\Http\Controllers\GuessController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\ResolvePlayer;
use App\Models\Game;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $player = request()->attributes->get('player');

    $timezone = request()->cookie('app_timezone') ?? request()->header('X-Timezone') ?? 'EST';
    try { new \DateTimeZone($timezone); } catch (\Exception $e) { $timezone = 'EST'; }

    $now = now()->setTimezone($timezone);
    $gameDate = $now->hour < 4 ? $now->copy()->subDay()->toDateString() : $now->toDateString();

    $game = Game::with('categories')->whereDate('date', $gameDate)->first();
    if($game === null) {
        $game = Game::with('categories')->latest()->first();
    }

    $guesses = $game
        ? $game->guesses()->where('player_id', $player->id)->with('movie:tmdb_movie_id,title,poster_path,backdrop_path')->get()->keyBy('category_id')
        : collect();

    $score = 0;
    if($guesses->isNotEmpty()) {
        $score = $guesses->sum('points');
    }

    $gameOver = $guesses->where('correct')->count() === $game->categories->count();

    return Inertia::render('Welcome', [
        'game'    => $game,
        'score'   => $score,
        'guesses' => $guesses,
        'gameOver' => $gameOver,
    ]);
})->middleware([\App\Http\Middleware\ResolvePlayer::class]);

Route::post('/guesses', [GuessController::class, 'store'])->middleware(ResolvePlayer::class);

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
