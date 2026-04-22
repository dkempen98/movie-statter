<?php

namespace App\Console\Commands;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\CategoryQualifiers;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Random\RandomException;

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
        $genreCount = 0;
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
                    $genreCount = $this->choice(
                        'Select a number of genre options',
                        $countArray
                    );
                    if($genreCount > 0) {
                        $countArray = array_slice($countArray, 0, ($genreCount) * -1);
                    }
                    if($countArray) {
                        $decadeCount = array_pop($countArray);
                        $this->info($decadeCount . " Decade Categories");
                    }
                }
            }
        }

        $takenDates = Game::whereDate('date', '>=', now()->toDateString())
            ->pluck('date')
            ->map(fn ($d) => \Carbon\Carbon::parse($d)->toDateString())
            ->all();

        $date = now()->startOfDay();
        while (in_array($date->toDateString(), $takenDates)) {
            $date->addDay();
        }

        $customDate = $this->ask("Game date (YYYY-MM-DD), or press enter for {$date->toDateString()}");
        if ($customDate) {
            try {
                $parsed = \Carbon\Carbon::createFromFormat('Y-m-d', $customDate);
                if (!$parsed || $parsed->format('Y-m-d') !== $customDate) {
                    throw new \Exception();
                }
                $date = $parsed;
            } catch (\Exception $e) {
                $this->error("Invalid date format. Using {$date->toDateString()} instead.");
            }
        }

        $existing = Game::whereDate('date', $date->toDateString())->first();
        if ($existing) {
            $next = $date->copy()->addDay();
            while (Game::whereDate('date', $next->toDateString())->exists()) {
                $next->addDay();
            }
            if (!$this->confirm("Game #{$existing->id} already exists for {$date->toDateString()}. Move it to {$next->toDateString()}?")) {
                return;
            }
            $existing->update(['date' => $next->toDateString()]);
            $this->info("Game #{$existing->id} moved to {$next->toDateString()}.");
        }

        $game = new Game;
        $game->date = $date->toDateString();
        $game->scoring_type = $scoringType;

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

                        $lastInstance = Category::where('type', CategoryType::CastOrCrew->value)
                            ->where('value', $person['id'])
                            ->with('game')
                            ->orderByDesc(
                                \DB::table('games')
                                    ->select('date')
                                    ->whereColumn('games.id', 'categories.game_id')
                                    ->where('games.date', '<', $date->toDateString())
                                    ->limit(1)
                            )
                            ->first();

                        if($lastInstance) {
                            $this->info("{$person['name']} last used on {$lastInstance->game?->date}");
                        }

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

                    $lastInstance = Category::where('type', CategoryType::YearRange->value)
                        ->where('value', $decade)
                        ->with('game')
                        ->orderByDesc(
                            \DB::table('games')
                                ->select('date')
                                ->whereColumn('games.id', 'categories.game_id')
                                ->where('games.date', '<', $date->toDateString())
                                ->limit(1)
                        )
                        ->first();

                    if($lastInstance) {
                        $this->info("{$decade} last used on {$lastInstance->game?->date}");
                    }

                    $keep = $this->confirm("Use decade: Released in the " . substr($decade, 0, 4) . "s?", true);
                } while (!$keep);

                $used[] = $decade;
                $categories[] = [
                    'type' => CategoryType::YearRange->value,
                    'value' => $decade,
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
                    $lastInstance = Category::where('type', CategoryType::Year->value)
                        ->where('value', $year)
                        ->with('game')
                        ->orderByDesc(
                            \DB::table('games')
                                ->select('date')
                                ->whereColumn('games.id', 'categories.game_id')
                                ->where('games.date', '<', $date->toDateString())
                                ->limit(1)
                        )
                        ->first();

                    if($lastInstance) {
                        $this->info("{$year} last used on {$lastInstance->game?->date}");
                    }
                    $keep = $this->confirm("Use year: Released in {$year}?", true);
                } while (!$keep);

                $used[] = $year;
                $categories[] = [
                    'type' => CategoryType::Year->value,
                    'value' => (string) $year,
                    'display_name' => 'Released in ' . $year,
                ];
            }
        }

        if ($genreCount > 0) {
            $genres = Genre::where('active', '=', 1)->get();

            for ($i = 0; $i < $genreCount; $i++) {
                $confirmed = false;
                do {
                    $choice = $this->choice(
                        'Select a genre',
                        $genres->pluck('display_name')->toArray(),
                    );
                    $genre = Genre::where('display_name', '=', $choice)->first();
                    $lastInstance = Category::where('type', CategoryType::Genre->value)
                        ->where('value', $genre->tmdb_id)
                        ->with('game')
                        ->orderByDesc(
                            \DB::table('games')
                                ->select('date')
                                ->whereColumn('games.id', 'categories.game_id')
                                ->where('games.date', '<', $date->toDateString())
                                ->limit(1)
                        )
                        ->first();

                    if($lastInstance?->game?->date) {
                        $this->info("{$genre->display_name} last used on {$lastInstance->game?->date}");
                    }
                    $confirmed = $this->confirm("Confirm {$choice}?");
                } while (!$confirmed);

                if(!empty($genre)) {
                    $categories[] = [
                        'type' => CategoryType::Genre->value,
                        'value' => (string) $genre->tmdb_id,
                        'display_name' => $genre->display_name,
                    ];
                }

            }
        }


        $game->save();

        collect($categories)->shuffle()->each(fn ($category) => Category::create([
            ...$category,
            'game_id' => $game->id,
        ]));

        $categories = $game->categories()->get();

        foreach ($categories as $category) {
            $this->addQualifier($category);
        }

        $categories->load('qualifiers');

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

    /**
     * @throws RandomException
     * @throws ConnectionException
     */
    private function estimateRevenueTarget($categories): int
    {
        $categoryMovieIds = [];
        $genreTotal = 0;
        $target = 0;

        foreach ($categories as $index => $category) {
            if ($category->type === CategoryType::Genre->value) {
                $genre = Genre::where('tmdb_id', $category->value)->first();
                $agreed = false;
                while (!$agreed) {
                    $value = random_int($genre->min_revenue_value, $genre->max_revenue_value);
                    $agreed = $this->confirm($category->display_name." revenue target: ".Number::currency($value));
                }
                $genreTotal += $value;
                continue;
            }
            $params = ['sort_by' => 'revenue.desc', 'page' => 1];
            $movieCount = 10;

            if ($category->type === CategoryType::CastOrCrew->value) {
                $params['with_people'] = $category->value;
            } elseif ($category->type === CategoryType::Year->value) {
                $params['primary_release_year'] = $category->value;
                $movieCount = 20;
            } elseif ($category->type === CategoryType::YearRange->value) {
                [$start, $end] = explode('-', $category->value);
                $params['primary_release_date.gte'] = $start . '-01-01';
                $params['primary_release_date.lte'] = $end . '-12-31';
            } elseif ($category->type === CategoryType::Genre->value) {
                $params['with_genres'] = $category->value;
            }

            if($category->qualifiers?->count() > 0) {
                $movieCount = 10;
                foreach($category->qualifiers as $qualifier) {
                    if ($qualifier->type === CategoryType::CastOrCrew->value) {
                        if(isset($params['with_people'])) {
                            $params['with_people'] .= " AND " . $qualifier->value;
                        } else {
                            $params['with_people'] = $qualifier->value;
                        }
                    } elseif ($qualifier->type === CategoryType::Year->value) {
                        $params['primary_release_year'] = $category->value;
                    } elseif ($qualifier->type === CategoryType::YearRange->value) {
                        [$start, $end] = explode('-', $qualifier->value);
                        $params['primary_release_date.gte'] = $start . '-01-01';
                        $params['primary_release_date.lte'] = $end . '-12-31';
                    } elseif ($qualifier->type === CategoryType::Genre->value) {
                        if(isset($params['with_genres'])) {
                            $params['with_genres'] .= ' AND ' . $qualifier->value;
                        } else {
                            $params['with_genres'] = $qualifier->value;
                        }
                    }
                }
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


        if($categoryMovieIds) {
            $allIds = collect($categoryMovieIds)->flatten()->unique()->values()->all();
            $toFetch = [];

            $thisYear = Carbon::now()->startOfYear();
            $threeMonthsAgo = Carbon::now()->subMonths(3);

            foreach ($allIds as $tmdbId) {
                $movie = Movie::where('tmdb_movie_id', $tmdbId)
                    ->where('revenue', '>', 0)
                    ->whereNotNull('revenue')
                    ->where('release_date', '<', $thisYear)
                    ->where('updated_at', '>', $threeMonthsAgo)
                    ->first();
                if($movie) {

                } else {
                    $toFetch[] = $tmdbId;
                }
            }

            $responses = Http::pool(fn ($pool) => collect($toFetch)->map(
                fn ($id) => $pool->withToken(config('services.tmdb.key'))
                    ->acceptJson()
                    ->get("https://api.themoviedb.org/3/movie/{$id}")
            )->all());

            $movies = collect($toFetch)->zip($responses)
                ->filter(fn ($pair) => $pair[1]->ok())
                ->mapWithKeys(fn ($pair) => [$pair[0] => $pair[1]->json()]);

            foreach ($movies as $movie) {
                Movie::updateOrCreate([
                    'tmdb_movie_id' => $movie['id'],
                ], [
                    'release_date' => Carbon::parse($movie['release_date']),
                    'revenue' => $movie['revenue'],
                    'title' => $movie['title'],
                    'popularity' => $movie['popularity'],
                    'poster_path' => $movie['poster_path'],
                    'backdrop_path' => $movie['backdrop_path'],
                ]);
            }

            $moviesById = Movie::whereIn('tmdb_movie_id', $allIds)
                ->get()
                ->keyBy('tmdb_movie_id')
                ->map(fn ($movie) => [
                    'revenue'    => $movie->revenue ?? 0,
                    'popularity' => $movie->popularity ?? 0.01,
                ])
                ->all();

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

            $target = $simulations[(int) (count($simulations) * 0.5)];
        }
        return $target + $genreTotal;
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

    private function addQualifier(Category $category)
    {
        if($this->confirm("Would you like to add any qualifiers to the ".$category->display_name." category?")) {
            $qualifier = new CategoryQualifiers;
            $categoryTypes = CategoryType::cases();
            $choices = [];
            foreach ($categoryTypes as $type) {
                if(
                    $type->qualifierEligible() &&
                    $type !== $category->type &&
                    !($type->yearBased() && $category->type->yearBased())
                ) {
                    $choices[$type->value] = $type->label();
                }
            }
            $type = $this->choice(
                'Select a qualifier type',
                $choices
            );
            $qualifier->type = $type;
            $displayValue = '';
            $qualifierText = '';

            switch ($type) {
                case(CategoryType::YearRange->value):
                    $qualifierText = CategoryType::YearRange->qualifierText();
                    $decades = ['1950-1959', '1960-1969', '1970-1979', '1980-1989', '1990-1999', '2000-2009', '2010-2019'];
                    $qualifier->value = $this->choice(
                        'Select a decade',
                        $decades
                    );
                    if($qualifier->value[0] === '2') {
                        $displayValue = $qualifier->value[0].$qualifier->value[1].$qualifier->value[2].$qualifier->value[3]."'s";
                    } else {
                        $displayValue = $qualifier->value[2].$qualifier->value[3]."'s";
                    }
                    break;
                case(CategoryType::Year->value):
                    $qualifierText = CategoryType::Year->qualifierText();
                    $year = 0;
                    while($year < 1900) {
                        $year = $this->ask('Type in a year');
                    }
                    $qualifier->value = $year;
                    $displayValue = $year;
                    break;
                case(CategoryType::Genre->value):
                    $genres = Genre::where('active', '=', 1)->get();
                    $choice = $this->choice(
                        "Select a genre",
                        $genres->pluck('display_name')->toArray()
                    );
                    $genre = Genre::where('display_name', '=', $choice)->first();
                    $qualifier->value = $genre->tmdb_id;
                    $qualifierText = CategoryType::Genre->qualifierText();
                    $displayValue = $genre->display_name;

                    break;
            }
            $qualifier->display_name = Str::replace('$target', $displayValue, $qualifierText);
            $qualifier->category()->associate($category);
            $qualifier->save();
        }
    }
}
