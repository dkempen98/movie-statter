<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $guarded = ['id'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class);
    }
}
