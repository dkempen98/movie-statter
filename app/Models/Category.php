<?php

namespace App\Models;

use App\Enums\CategoryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'type' => CategoryType::class,
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class);
    }

    public function qualifiers(): HasMany
    {
        return $this->hasMany(CategoryQualifiers::class);
    }
}
