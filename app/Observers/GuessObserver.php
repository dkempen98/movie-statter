<?php

namespace App\Observers;

use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Guess;

class GuessObserver
{
    public function creating(Guess $guess): void
    {
        //
    }

    public function created(Guess $guess): void
    {
        $this->updatePlayerGame($guess);
    }

    public function updated(Guess $guess): void
    {
        $this->updatePlayerGame($guess);
    }

    public function deleted(Guess $guess): void
    {
        //
    }

    /**
     * @param Guess $guess
     * @return void
     */
    protected function updatePlayerGame(Guess $guess): void
    {
        $guesses = Guess::query()
            ->where('game_id', $guess->game_id)
            ->where('player_id', $guess->player_id)
            ->where('correct', 1);
        $game = Game::find($guess->game_id);

        $completed = $guesses->count() >= 5;

        GamePlayer::firstOrCreate([
            'game_id' => $guess->game_id,
            'player_id' => $guess->player_id,
        ])->update([
            'score' => $guesses->sum('points') - $game->target_score,
            'complete' => $completed,
        ]);
    }
}
