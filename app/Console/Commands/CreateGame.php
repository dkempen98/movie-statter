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


        if($actorCount > 0 || $directorCount > 0) {
            $people = $this->fetchPopularPeople();
            $selected = collect($people['directors'])->shuffle()->take($directorCount)
                ->merge(collect($people['actors'])->shuffle()->take($actorCount));

            foreach ($selected as $person) {
                $categories[] = [
                    'type'         => CategoryType::CastOrCrew->value,
                    'value'        => (string) $person['id'],
                    'display_name' => $person['name'],
                ];
            }
        }


        if($decadeCount > 0) {
            $decades = collect(['1970-1979', '1980-1989', '1990-1999', '2000-2009', '2010-2019']);
            $decadeItems = $decades->shuffle()->take($decadeCount);
            foreach ($decadeItems as $decade) {
                $categories[] = [
                    'type'         => CategoryType::YearRange->value,
                    'value'        => $decade,
                    'display_name' => 'Released in the ' . substr($decade, 0, 4) . 's',
                ];
            }
        }

        $years = collect(range(1980, 2025));
        $yearItems = $years->shuffle()->take($yearCount);
        foreach ($yearItems as $year) {
            $categories[] = [
                'type' => CategoryType::Year->value,
                'value' => (string) $year,
                'display_name' => 'Released in ' . $year,
            ];
        }

        collect($categories)->shuffle()->each(fn ($category) => Category::create([
            ...$category,
            'game_id' => $game->id,
        ]));

        $this->info("Game #{$game->id} created with scoring type: {$scoringType}");
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

            if ($page < 2) {
                $fetchedActors = collect($response->json('results', []))
                    ->filter(fn ($person) => $person['known_for_department'] === 'Acting')
                    ->values()
                    ->all();

                $actors = array_merge($actors, $fetchedActors);
            }
        }

        return [
            'actors'    => $actors,
            'directors' => $directors,
        ];
    }
}
