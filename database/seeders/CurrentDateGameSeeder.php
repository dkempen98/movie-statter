<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\CategoryQualifiers;
use App\Models\Game;
use App\Models\Genre;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CurrentDateGameSeeder extends Seeder
{
    public function run(): void
    {
        $today = now()->startOfDay();

        // Push every existing game on today's date into the future, onto the
        // next free dates so nothing collides.
        $taken = Game::whereDate('date', '>', $today->toDateString())
            ->pluck('date')
            ->map(fn ($d) => \Carbon\Carbon::parse($d)->toDateString())
            ->all();

        $existing = Game::whereDate('date', $today->toDateString())->orderBy('id')->get();

        $next = $today->copy()->addDay();
        foreach ($existing as $game) {
            while (in_array($next->toDateString(), $taken)) {
                $next->addDay();
            }
            $game->update(['date' => $next->toDateString()]);
            $taken[] = $next->toDateString();
            $this->command?->info("Moved game #{$game->id} to {$next->toDateString()}.");
            $next->addDay();
        }

        $game = Game::create([
            'date'         => $today->toDateString(),
            'scoring_type' => ScoringType::Revenue->value,
            'target_score' => 1_000_000_000,
        ]);

        // 2025
        Category::create([
            'game_id'      => $game->id,
            'type'         => CategoryType::Year->value,
            'value'        => '2025',
            'display_name' => 'Released in 2025',
        ]);

        // 2010's with a horror qualifier
        $decade = Category::create([
            'game_id'      => $game->id,
            'type'         => CategoryType::YearRange->value,
            'value'        => '2010-2019',
            'display_name' => 'Released in the 2010s',
        ]);

        $horror = Genre::where('display_name', 'Horror')->first();
        CategoryQualifiers::create([
            'category_id'     => $decade->id,
            'type'            => CategoryType::Genre->value,
            'value'           => (string) ($horror->tmdb_id ?? 27),
            'display_name'    => Str::replace('$target', $horror->display_name ?? 'Horror', CategoryType::Genre->qualifierText()),
            'is_disqualifier' => false,
        ]);

        // Tom Cruise (TMDB person id 500)
        Category::create([
            'game_id'      => $game->id,
            'type'         => CategoryType::CastOrCrew->value,
            'value'        => '500',
            'display_name' => 'Tom Cruise',
        ]);

        // Steven Spielberg (TMDB person id 488)
        Category::create([
            'game_id'      => $game->id,
            'type'         => CategoryType::CastOrCrew->value,
            'value'        => '488',
            'display_name' => 'Steven Spielberg',
        ]);

        // 2026
        Category::create([
            'game_id'      => $game->id,
            'type'         => CategoryType::Year->value,
            'value'        => '2026',
            'display_name' => 'Released in 2026',
        ]);

        $this->command?->info("Created game #{$game->id} for {$today->toDateString()}.");
    }
}
