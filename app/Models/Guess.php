<?php

namespace App\Models;

use App\Observers\GuessObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[ObservedBy(GuessObserver::class)]
class Guess extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'correct' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function gamePlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function movie(): HasOne
    {
        return $this->hasOne(Movie::class, 'tmdb_movie_id', 'tmdb_movie_id');
    }
}
