<?php

namespace App\Console\Commands;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CreateGame extends Command
{
    protected $signature = 'game:create';
    protected $description = 'Create a new daily game';

    public function handle(): void
    {
        $scoringType = $this->choice(
            'Select a scoring type',
            collect(ScoringType::cases())->mapWithKeys(fn ($case) => [$case->value => $case->label()])->all()
        );

        $countArray = [0,1,2,3,4,5];
        $directorCount = 0;
        $yearCount = 0;
        $decadeCount = 0;

        $actorCount = $this->choice(
            'Select a number of actors',
            $countArray
        );

        if($actorCount > 0) {
            $countArray = array_slice($countArray, 0, ($actorCount) * -1);
        }

        if($countArray) {
            $directorCount = $this->choice(
                'Select a number of directors',
                $countArray
            );
            if($directorCount > 0) {
                $countArray = array_slice($countArray, 0, ($directorCount) * -1);
            }
            if($countArray) {
                $yearCount = $this->choice(
                    'Select a number of year options',
                    $countArray
                );
                if($yearCount > 0) {
                    $countArray = array_slice($countArray, 0, ($yearCount) * -1);
                }
                if($countArray) {
                    $decadeCount = array_pop($countArray);
                    $this->info($decadeCount . " Decade Categories");
                }
            }
        }

        $game = Game::create([
            'date'         => now()->toDateString(),
            'scoring_type' => $scoringType,
        ]);

        $categories = [];

        if ($actorCount > 0 || $directorCount > 0) {
            $people = $this->fetchPopularPeople();
            $actorPool = collect($people['actors'])->shuffle();
            $directorPool = collect($people['directors'])->shuffle();
            $usedIds = [];

            foreach (['actor' => $actorCount, 'director' => $directorCount] as $role => $count) {
                $pool = $role === 'actor' ? $actorPool : $directorPool;

                for ($i = 0; $i < $count; $i++) {
                    $available = $pool->filter(fn ($p) => !in_array($p['id'], $usedIds));

                    do {
                        $person = $available->shift();
                        if (!$person) break 2;
                        $keep = $this->confirm("Use {$role}: {$person['name']}?", true);
                        if (!$keep) $available = $available;
                    } while (!$keep);

                    $usedIds[] = $person['id'];
                    $categories[] = [
                        'type'         => CategoryType::CastOrCrew->value,
                        'value'        => (string) $person['id'],
                        'display_name' => $person['name'],
                    ];
                }
            }
        }

        if ($decadeCount > 0) {
            $decades = collect(['1970-1979', '1980-1989', '1990-1999', '2000-2009', '2010-2019'])->shuffle();
            $used = [];

            for ($i = 0; $i < $decadeCount; $i++) {
                $available = $decades->filter(fn ($d) => !in_array($d, $used));

                do {
                    $decade = $available->shift();
                    if (!$decade) break 2;
                    $keep = $this->confirm("Use decade: Released in the " . substr($decade, 0, 4) . "s?", true);
                } while (!$keep);

                $used[] = $decade;
                $categories[] = [
                    'type'         => CategoryType::YearRange->value,
                    'value'        => $decade,
                    'display_name' => 'Released in the ' . substr($decade, 0, 4) . 's',
                ];
            }
        }

        if ($yearCount > 0) {
            $years = collect(range(1980, 2025))->shuffle();
            $used = [];

            for ($i = 0; $i < $yearCount; $i++) {
                $available = $years->filter(fn ($y) => !in_array($y, $used));

                do {
                    $year = $available->shift();
                    if (!$year) break 2;
                    $keep = $this->confirm("Use year: Released in {$year}?", true);
                } while (!$keep);

                $used[] = $year;
                $categories[] = [
                    'type'         => CategoryType::Year->value,
                    'value'        => (string) $year,
                    'display_name' => 'Released in ' . $year,
                ];
            }
        }

        collect($categories)->shuffle()->each(fn ($category) => Category::create([
            ...$category,
            'game_id' => $game->id,
        ]));

        if ($scoringType === ScoringType::Revenue->value) {
            $this->info('Estimating revenue target...');
            $target = $this->estimateRevenueTarget($categories);
            $rounder = $target % 50000000;
            if($rounder < 25000000) {
                $rounder *= -1;
            }
            $target = $target + $rounder;
            $game->update(['target_score' => $target]);
            $this->info('Revenue target set to: $' . number_format($target));
        }

        $this->info("Game #{$game->id} created with scoring type: {$scoringType}");
    }

    private function estimateRevenueTarget(array $categories): int
    {
        $categoryMovieIds = [];

        foreach ($categories as $index => $category) {
            $params = ['sort_by' => 'revenue.desc', 'page' => 1];
            $movieCount = 10;

            if ($category['type'] === CategoryType::CastOrCrew->value) {
                $params['with_people'] = $category['value'];
            } elseif ($category['type'] === CategoryType::Year->value) {
//                TODO:: Store these for 2+ years ago so we only do the call once, refresh every ~6 months for re-releases
                $params['primary_release_year'] = $category['value'];
                $movieCount = 20;
            } elseif ($category['type'] === CategoryType::YearRange->value) {
                [$start, $end] = explode('-', $category['value']);
                $params['primary_release_date.gte'] = $start . '-01-01';
                $params['primary_release_date.lte'] = $end . '-12-31';
            }

            $response = Http::withToken(config('services.tmdb.key'))
                ->acceptJson()
                ->get('https://api.themoviedb.org/3/discover/movie', $params);

            if ($response->failed()) continue;

            $categoryMovieIds[$index] = collect($response->json('results', []))
                ->take($movieCount)
                ->pluck('id')
                ->all();
        }

        $allIds = collect($categoryMovieIds)->flatten()->unique()->values()->all();

        $responses = Http::pool(fn ($pool) => collect($allIds)->map(
            fn ($id) => $pool->withToken(config('services.tmdb.key'))
                ->acceptJson()
                ->get("https://api.themoviedb.org/3/movie/{$id}")
        )->all());

        $moviesById = collect($allIds)->combine(
            collect($responses)->map(fn ($r) => $r->ok() ? [
                'revenue'    => $r->json('revenue', 0),
                'popularity' => $r->json('popularity', 1),
            ] : ['revenue' => 0, 'popularity' => 1])
        )->all();

        $pools = [];

        foreach ($categoryMovieIds as $index => $ids) {
            $movies = collect($ids)
                ->map(fn ($id) => $moviesById[$id] ?? null)
                ->filter(fn ($m) => $m && $m['revenue'] > 0)
                ->values()
                ->all();

            if (!empty($movies)) {
                $pools[] = $movies;
            }
        }

        if (empty($pools)) return 0;

        $simulations = [];

        for ($i = 0; $i < 1000; $i++) {
            $total = 0;
            foreach ($pools as $pool) {
                $total += $this->weightedPick($pool)['revenue'];
            }
            $simulations[] = $total;
        }

        sort($simulations);

        return $simulations[(int) (count($simulations) * 0.5)];
    }

    private function weightedPick(array $pool): array
    {
        $weights = array_map(fn ($m) => sqrt($m['popularity']), $pool);
        $total = array_sum($weights);
        $rand = mt_rand() / mt_getrandmax() * $total;

        $cumulative = 0;
        foreach ($pool as $i => $movie) {
            $cumulative += $weights[$i];
            if ($rand <= $cumulative) return $movie;
        }

        return end($pool);
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

            $fetchedActors = collect($response->json('results', []))
                ->filter(fn ($person) => $person['known_for_department'] === 'Acting')
                ->values()
                ->all();

            $actors = array_merge($actors, $fetchedActors);
        }

        return [
            'actors'    => $actors,
            'directors' => $directors,
        ];
    }
}
