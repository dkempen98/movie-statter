<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\CategoryQualifiers;
use App\Models\Game;
use App\Models\Genre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $takenDates = Game::whereDate('date', '>=', now()->toDateString())
            ->pluck('date')
            ->map(fn ($d) => \Carbon\Carbon::parse($d)->toDateString())
            ->all();

        $date = now()->startOfDay();
        while (in_array($date->toDateString(), $takenDates)) {
            $date->addDay();
        }

        $decades = [
            '2020-2029',
            '2010-2019',
            '2000-2009',
            '1990-1999',
            '1980-1989',
            '1970-1979',
        ];

        $lastDecades = [];
        foreach ($decades as $decade) {
            $lastTime = Category::where('type', CategoryType::YearRange->value)
                ->where('value', $decade)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->limit(1)
                )
                ->first();
            $lastDecades[] = [
                'decade' => $decade,
                'last' => $lastTime?->game?->date,
            ];
        }

        $years = collect(range(2026, 1980));
        $lastYears = [];
        foreach ($years as $year) {
            $lastTime = Category::where('type', CategoryType::Year->value)
                ->where('value', $year)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->limit(1)
                )
                ->first();
            $lastYears[] = [
                'year' => $year,
                'last' => $lastTime?->game?->date,
            ];
        }

        $genres = Genre::where('active', '=', 1)->get();
        $lastGenres = [];
        foreach ($genres as $genre) {
            $lastTime = Category::where('type', CategoryType::Genre->value)
                ->where('value', $genre->tmdb_id)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->limit(1)
                )
                ->first();
            $lastGenres[] = [
                'tmdb_id' => $genre->tmdb_id,
                'display_name' => $genre->display_name,
                'last' => $lastTime?->game?->date,
            ];
        }


        return Inertia::render('CreateGame', [
            'takenDates' => $takenDates,
            'date' => $date->toDateString(),
            'decades' => $decades,
            'lastDecades' => $lastDecades,
            'years' => $years,
            'lastYears' => $lastYears,
            'genres' => $genres,
            'lastGenres' => $lastGenres,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'targetScore' => 'required|integer',
            'categories' => 'required|array|min:1|max:5',
            'categories.*.type' => 'required|string',
            'categories.*.value' => 'required',
            'categories.*.displayName' => 'required|string',
            'categories.*.qualifiers' => 'array',
            'categories.*.qualifiers.*.type' => 'required|string',
            'categories.*.qualifiers.*.value' => 'required',
            'categories.*.qualifiers.*.isDisqualifier' => 'boolean',
        ]);

        $game = new Game;
        $game->date = $data['date'];
        $game->scoring_type = ScoringType::Revenue->value;
        $game->target_score = $data['targetScore'];
        $game->save();

        foreach ($data['categories'] as $cat) {
            $category = Category::create([
                'game_id' => $game->id,
                'type' => $cat['type'],
                'value' => (string) $cat['value'],
                'display_name' => $cat['displayName'],
            ]);

            foreach ($cat['qualifiers'] ?? [] as $q) {
                $type = CategoryType::from($q['type']);
                $isDisqualifier = $q['isDisqualifier'] ?? false;
                $text = $isDisqualifier ? $type->disqualifierText() : $type->qualifierText();

                $qualifier = new CategoryQualifiers;
                $qualifier->type = $type->value;
                $qualifier->value = (string) $q['value'];
                $qualifier->is_disqualifier = $isDisqualifier;
                $qualifier->display_name = Str::replace('$target', $this->qualifierDisplayValue($type, $q['value']), $text);
                $qualifier->category()->associate($category);
                $qualifier->save();
            }
        }

        return redirect()->route('game.create');
    }

    private function qualifierDisplayValue(CategoryType $type, $value): string
    {
        return match ($type) {
            CategoryType::Genre => Genre::where('tmdb_id', $value)->value('display_name') ?? (string) $value,
            CategoryType::YearRange => $value[0] === '2'
                ? substr($value, 0, 4) . "'s"
                : substr($value, 2, 2) . "'s",
            default => (string) $value,
        };
    }

    public function searchPeople(Request $request)
    {
        $query = $request->query('q');
        if (! $query) {
            return response()->json([]);
        }

        $response = Http::withToken(config('services.tmdb.key'))
            ->acceptJson()
            ->get('https://api.themoviedb.org/3/search/person', ['query' => $query]);

        if ($response->failed()) {
            return response()->json([]);
        }

        $results = collect($response->json('results', []));

        $lastUsed = Category::where('type', CategoryType::CastOrCrew->value)
            ->whereIn('value', $results->pluck('id'))
            ->join('games', 'games.id', '=', 'categories.game_id')
            ->groupBy('categories.value')
            ->selectRaw('categories.value as value, MAX(games.date) as last_used')
            ->pluck('last_used', 'value');

        return response()->json(
            $results
                ->map(fn ($p) => [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'department' => $p['known_for_department'] ?? null,
                    'last_used' => $lastUsed[(string) $p['id']] ?? null,
                ])
                ->values()
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request)
    {
        $player = $request->attributes->get('player');

        $todaysGame = Game::query()
            ->where('date', today())
            ->firstOrFail();
        $guesses = $todaysGame->guesses()
            ->where('player_id', $player->id)
            ->get();

        return Inertia::render('Game/Show', [
            'game' => [
                'id' => $todaysGame->id,
                'game_date' => $todaysGame->game_date,
                'status' => $todaysGame->status,
            ],
            'guesses' => $guesses->map(fn ($guess) => [
                'id' => $guess->id,
                'tmdb_movie_id' => $guess->tmdb_movie_id,
                'movie_title' => $guess->movie_title,
                'correct' => $guess->correct,
            ]),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Game $game)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
