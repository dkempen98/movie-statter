<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Enums\ScoringType;
use App\Models\Category;
use App\Models\CategoryQualifiers;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Keyword;
use Carbon\Carbon;
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

        $futureGameIds = Game::query()->where('date', '>', $date)->get()->pluck('id');

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
            $lastCategory = Category::where('type', CategoryType::YearRange->value)
                ->where('value', $decade)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastQualifier = CategoryQualifiers::where('type', CategoryType::YearRange->value)
                ->where('value', $decade)
                ->with('category.game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->join('categories', 'category_qualifiers.category_id', '=', 'categories.id')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastTime = max($lastCategory?->game?->date, $lastQualifier?->category?->game?->date);

            $lastDecades[] = [
                'decade' => $decade,
                'last' => $lastTime,
            ];
        }

        $years = collect(range(2026, 1980));
        $lastYears = [];
        foreach ($years as $year) {
            $lastCategory = Category::where('type', CategoryType::Year->value)
                ->where('value', $year)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastQualifier = CategoryQualifiers::where('type', CategoryType::Year->value)
                ->where('value', $year)
                ->with('category.game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->join('categories', 'category_qualifiers.category_id', '=', 'categories.id')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastTime = max($lastCategory?->game?->date, $lastQualifier?->category?->game?->date);

            $lastYears[] = [
                'year' => $year,
                'last' => $lastTime,
            ];
        }

        $genres = Genre::where('active', '=', 1)->get();
        $lastGenres = [];
        foreach ($genres as $genre) {
            $lastCategory = Category::where('type', CategoryType::Genre->value)
                ->where('value', $genre->tmdb_id)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastQualifier = CategoryQualifiers::where('type', CategoryType::Genre->value)
                ->where('value', $genre->tmdb_id)
                ->with('category.game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->join('categories', 'category_qualifiers.category_id', '=', 'categories.id')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastTime = max($lastCategory?->game?->date, $lastQualifier?->category?->game?->date);

            $lastGenres[] = [
                'tmdb_id' => $genre->tmdb_id,
                'display_name' => $genre->display_name,
                'last' => $lastTime,
            ];
        }

        $keywords = Keyword::where('active', '=', 1)->get();
        $lastKeywords = [];
        foreach ($keywords as $keyword) {
            $lastCategory = Category::where('type', CategoryType::Keyword->value)
                ->where('value', $keyword->tmdb_id)
                ->with('game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();
            $lastQualifier = CategoryQualifiers::where('type', CategoryType::Keyword->value)
                ->where('value', $keyword->tmdb_id)
                ->with('category.game')
                ->orderByDesc(
                    \DB::table('games')
                        ->select('date')
                        ->join('categories', 'category_qualifiers.category_id', '=', 'categories.id')
                        ->whereColumn('games.id', 'categories.game_id')
                        ->whereNotIn('games.id', $futureGameIds)
                        ->limit(1)
                )
                ->first();

            $lastTime = max($lastCategory?->game?->date, $lastQualifier?->category?->game?->date);


            $lastKeywords[] = [
                'tmdb_id' => $keyword->tmdb_id,
                'display_name' => $keyword->label,
                'last' => $lastTime,
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
            'keywords' => $keywords,
            'lastKeywords' => $lastKeywords,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'target_score' => 'required|integer',
            'categories' => 'required|array|min:1|max:5',
            'categories.*.type' => 'required|string',
            'categories.*.value' => 'required',
            'categories.*.display_name' => 'required|string',
            'categories.*.qualifiers' => 'array',
            'categories.*.qualifiers.*.type' => 'required|string',
            'categories.*.qualifiers.*.value' => 'required',
            'categories.*.qualifiers.*.is_disqualifier' => 'boolean',
        ]);

        $game = new Game;
        $game->date = $data['date'];
        $game->scoring_type = ScoringType::Revenue->value;
        $game->target_score = $data['target_score'];
        $game->save();

        foreach ($data['categories'] as $cat) {
            $category = Category::create([
                'game_id' => $game->id,
                'type' => $cat['type'],
                'value' => (string) $cat['value'],
                'display_name' => $cat['display_name'],
            ]);

            foreach ($cat['qualifiers'] ?? [] as $q) {
                $type = CategoryType::from($q['type']);
                $isDisqualifier = $q['is_disqualifier'] ?? false;
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
    public function edit($date)
    {
        $game = Game::query()
            ->where('date', '=', $date)
            ->with('categories.qualifiers')
            ->first();
        return response()->json(['game' => $game]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $gameId)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'target_score' => 'required|integer',
            'categories' => 'required|array|min:1|max:5',
            'categories.*.type' => 'required|string',
            'categories.*.value' => 'required',
            'categories.*.display_name' => 'required|string',
            'categories.*.qualifiers' => 'array',
            'categories.*.qualifiers.*.type' => 'required|string',
            'categories.*.qualifiers.*.value' => 'required',
            'categories.*.qualifiers.*.is_disqualifier' => 'boolean',
        ]);

        $game = Game::query()
            ->with('categories.qualifiers')
            ->find($gameId);

        \DB::transaction(function () use ($game, $data) {
            $game->update([
                'date' => $data['date'],
                'target_score' => $data['target_score'],
            ]);

            $keptCategoryIds = [];
            foreach ($data['categories'] as $cat) {
                $category = $game->categories()->updateOrCreate(
                    ['id' => $cat['id'] ?? null],
                    [
                        'type' => $cat['type'],
                        'value' => (string) $cat['value'],
                        'display_name' => $cat['display_name'],
                    ]
                );
                $keptCategoryIds[] = $category->id;

                $keptQualifierIds = [];
                foreach ($cat['qualifiers'] ?? [] as $q) {
                    $type = CategoryType::from($q['type']);
                    $isDisqualifier = $q['is_disqualifier'] ?? false;
                    $text = $isDisqualifier ? $type->disqualifierText() : $type->qualifierText();
                    $qualifier = $category->qualifiers()->updateOrCreate(
                        ['id' => $q['id'] ?? null],
                        [
                            "type" => $type->value,
                            "value" => (string) $q['value'],
                            "is_disqualifier" => $isDisqualifier,
                            "display_name" => Str::replace('$target', $this->qualifierDisplayValue($type, $q['value']), $text),
                        ]
                    );
                    $keptQualifierIds[] = $qualifier->id;
                }
                $category->qualifiers()->whereNotIn('id', $keptQualifierIds)->delete();
            }
            $game->categories()->whereNotIn('id', $keptCategoryIds)->delete();
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
