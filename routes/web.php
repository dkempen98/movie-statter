<?php

use App\Http\Controllers\GuessController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\ResolvePlayer;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Player;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $player = request()->attributes->get('player');

    $timezone = request()->cookie('app_timezone') ?? request()->header('X-Timezone') ?? 'EST';
    try { new \DateTimeZone($timezone); } catch (\Exception $e) { $timezone = 'EST'; }

    $now = now()->setTimezone($timezone);
    $gameDate = $now->hour < 4 ? $now->copy()->subDay()->toDateString() : $now->toDateString();

    $game = Game::with('categories.qualifiers')->whereDate('date', $gameDate)->first();
    if($game === null) {
        $game = Game::with('categories')->latest()->first();
    }

    $guessCount =$game->guesses()->where('player_id', $player->id)->count();

    $guesses = $game
        ? $game->guesses()
            ->where('player_id', $player->id)
            ->with('movie:tmdb_movie_id,title,poster_path,backdrop_path')
            ->get()
            ->keyBy('category_id')
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
        'guessCount' => $guessCount,
        'gameOver' => $gameOver,
    ]);
})->middleware([\App\Http\Middleware\ResolvePlayer::class]);

Route::post('/guesses', [GuessController::class, 'store'])->middleware(ResolvePlayer::class);

Route::get('/leaderboard', function () {
    $player = request()->attributes->get('player');

    $timezone = request()->cookie('app_timezone') ?? request()->header('X-Timezone') ?? 'EST';
    try { new \DateTimeZone($timezone); } catch (\Exception $e) { $timezone = 'EST'; }

    $now = now()->setTimezone($timezone);
    $gameDate = $now->hour < 4 ? $now->copy()->subDay()->toDateString() : $now->toDateString();

    $game = Game::with('categories')->whereDate('date', $gameDate)->first();
    if($game === null) {
        $game = Game::with('categories')->latest()->first();
    }
    // TODO:: Make it so you only see following, or add option for global and following

    $leaders = DB::table('guesses')
        ->join('games', 'guesses.game_id', '=', 'games.id')
        ->join('players', 'guesses.player_id', '=', 'players.id')
        ->join('users', 'players.user_id', '=', 'users.id')
        ->select(
            'guesses.game_id',
            'guesses.player_id',
            'users.name',
            DB::raw('SUM(guesses.points) - games.target_score AS closest'),
            DB::raw('SUM(guesses.correct) AS right_answers'),
        )
        ->whereNotNull('games.target_score')
        ->where('games.id', $game->id)
        ->groupBy('guesses.player_id', 'guesses.game_id')
        ->having('right_answers', '=', 5)
        ->orderByRaw('ABS(closest)')
        ->limit(10)
        ->get();

    return Inertia::render('Leaderboard', [
        'leaders' => $leaders,
        'game' => $game,
    ]);
})->name('leaderboard');

Route::get('stats/{userId}', function($userId) {
    $player = Player::where('user_id', $userId)->first();
    $test = GamePlayer::where('player_id', $player->id)
        ->with('game')
        ->first();
    //TODO:: Actually use what I have set up here to get the stats
    // Also, need to backfill the GamePlayer data with a command
    return Inertia::render('Stats', [
        'leaders' => $test,
        'game' => $test,
    ]);
})->name('stats.user');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
