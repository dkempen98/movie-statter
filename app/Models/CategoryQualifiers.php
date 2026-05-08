<?php

namespace App\Models;

use App\Enums\CategoryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryQualifiers extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_disqualifier' => 'boolean',
            'type' => CategoryType::class,
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
