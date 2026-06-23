<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamePlayer extends Model
{
    protected $guarded = ['id'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function guesses(): HasMany
    {
        // When using this for a specific game, you have to add a sub-query
        return $this->hasMany(Guess::class, 'player_id', 'player_id');
    }
}
