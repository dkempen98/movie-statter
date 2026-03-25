<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $guarded = ['id'];

    public function games(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class);
    }
}
