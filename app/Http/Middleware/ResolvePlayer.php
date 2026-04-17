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
        $user = $request->user();

        if ($user) {
            $player = $user->player;

            if (! $player) {
                // Claim the existing cookie player if it's unclaimed, otherwise create one
                $browserUuid = $request->cookie('movie_player_uuid');
                $player = $browserUuid
                    ? Player::where('browser_uuid', $browserUuid)->whereNull('user_id')->first()
                    : null;

                if ($player) {
                    $player->user_id = $user->id;
                } else {
                    $player = new Player(['browser_uuid' => (string) Str::uuid(), 'user_id' => $user->id]);
                }
            }

            $player->last_seen_at = now();
            $player->save();
        } else {
            $browserUuid = $request->cookie('movie_player_uuid') ?? (string) Str::uuid();

            $player = Player::firstOrCreate(
                ['browser_uuid' => $browserUuid],
                ['last_seen_at' => now()]
            );

            $player->forceFill(['last_seen_at' => now()])->save();
        }

        $request->attributes->set('player', $player);

        $response = $next($request);

        Cookie::queue(Cookie::make('movie_player_uuid', $player->browser_uuid, 60 * 24 * 365));

        return $response;
    }
}
