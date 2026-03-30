<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $people = $this->fetchPopularPeople();
        $selected = collect($people['directors'])->shuffle()->take(1)->merge(collect($people['actors'])->shuffle()->take(2));

        $game = Game::create([
            'date'         => now()->toDateString(),
            'scoring_type' => ScoringType::Revenue->value,
        ]);

        $categories = [];

        foreach ($selected as $person) {
            $categories[] = [
                'type'         => CategoryType::CastOrCrew->value,
                'value'        => (string) $person['id'],
                'display_name' => $person['name'],
            ];
        }

        $decades = ['1970-1979', '1980-1989', '1990-1999', '2000-2009', '2010-2019'];
        $decade = collect($decades)->random();
        $categories[] = [
            'type'         => CategoryType::YearRange->value,
            'value'        => $decade,
            'display_name' => 'Released in the ' . $decade . 's',
        ];

        $years = range(1980, 2025);
        $year = collect($years)->random();
        $categories[] = [
            'type'         => CategoryType::Year->value,
            'value'        => (string) $year,
            'display_name' => 'Released in ' . $year,
        ];

        collect($categories)->shuffle()->each(fn ($category) => Category::create([
            ...$category,
            'game_id' => $game->id,
        ]));
    }

    private function fetchPopularPeople(): array
    {
        $actors = [];
        $directors = [];

        for ($page = 1; $page <= 10; $page++) {
            $response = Http::withToken(config('services.tmdb.key'))
                ->acceptJson()
                ->get('https://api.themoviedb.org/3/person/popular', ['page' => $page]);

            if ($response->failed()) break;

            $fetchedDirectors = collect($response->json('results', []))
                ->filter(fn ($person) => $person['known_for_department'] === 'Directing')
                ->values()
                ->all();

            $directors = array_merge($directors, $fetchedDirectors);

            if($page < 2) {
                $fetchedActors = collect($response->json('results', []))
                    ->filter(fn ($person) => $person['known_for_department'] === 'Acting')
                    ->values()
                    ->all();

                $actors = array_merge($actors, $fetchedActors);
            }
        }

        return [
            'actors' => $actors,
            'directors' => $directors,
        ];
    }
}
