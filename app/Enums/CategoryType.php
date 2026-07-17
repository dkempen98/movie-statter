<?php

namespace App\Enums;

enum CategoryType: string
{
    case CastOrCrew = 'cast_or_crew';
    case Actor = 'actor';
    case Director = 'director';

    case Year = 'year';
    case YearRange = 'year_range';

    case Genre = 'genre';
    case Keyword = 'keyword';

    public function label(): string
    {
        return match($this) {
            self::CastOrCrew => 'In the Cast Or Crew',
            self::Actor => 'In the Cast',
            self::Director => 'Directed By',
            self::Year, self::YearRange => 'Release Date',
            self::Genre => 'Film Genre',
            self::Keyword => 'Keyword',
        };
    }

    public function qualifierText(): string
    {
        return match($this) {
            self::CastOrCrew => '$target in the Cast Or Crew',
            self::Actor => '$target in Cast',
            self::Director => 'Directed by $target',
            self::Year, => 'Released in $target',
            self::YearRange => 'Released in the $target',
            self::Genre => 'In the $target Genre',
            self::Keyword => '$target',
        };
    }

    public function disqualifierText(): string
    {
        return match($this) {
            self::CastOrCrew => '$target Not in the Cast Or Crew',
            self::Actor => '$target Not in the Cast',
            self::Director => 'Not Directed by $target',
            self::Year, => 'Not Released in $target',
            self::YearRange => 'Not Released in the $target',
            self::Genre => 'Not in the $target Genre',
            self::Keyword => 'Not a $target',
        };
    }

    public function qualifierEligible(): bool
    {
        return in_array(
            $this,
            [
                self::Year,
                self::YearRange,
                self::Genre,
                self::Keyword,
            ]
        );
    }

    public function yearBased(): bool
    {
        return in_array(
            $this,
            [
                self::Year,
                self::YearRange,
            ]
        );
    }
}