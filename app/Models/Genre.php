<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Genre extends Model
{
    protected $guarded = [];

    public function categories(): HasMany
    {
        return $this->hasMany(
            Category::class,
            'value',
            'tmdb_id'
        )->where('type', '=', 'genre');
    }
}
