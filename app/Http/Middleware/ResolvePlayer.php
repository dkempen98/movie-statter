<?php

namespace App\Http\Middleware;

use App\Models\Player;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResolvePlayer
{
    public function handle(Request $request, Closure $next): Response
    {
        $browserUuid = $request->cookie('movie_player_uuid');

        if (! $browserUuid) {
            $browserUuid = (string) Str::uuid();
        }

        $player = Player::firstOrCreate(
            ['browser_uuid' => $browserUuid],
            ['last_seen_at' => now()]
        );

        $player->forceFill([
            'last_seen_at' => now(),
        ])->save();

        $request->attributes->set('player', $player);

        $response = $next($request);

        if (! $request->cookie('movie_player_uuid')) {
            Cookie::queue(
                Cookie::make(
                    'movie_player_uuid',
                    $browserUuid,
                    60 * 24 * 365
                )
            );
        }

        return $response;
    }
}