<?php

namespace App\Models;

use App\Enums\ScoringType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'scoring_type' => ScoringType::class,
    ];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function players(): HasMany
    {
      return $this->hasMany(GamePlayer::class);
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class);
    }
}
