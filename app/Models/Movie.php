<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Movie extends Model
{
    protected $primaryKey = 'tmdb_movie_id';
    public $incrementing = false;
    protected $guarded = [];

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class, 'tmdb_movie_id', 'tmdb_movie_id');
    }
}
