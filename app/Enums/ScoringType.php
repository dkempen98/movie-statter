<?php

namespace App\Enums;

enum ScoringType: string
{
    case Revenue = 'revenue';
    case OscarNominations = 'oscar_nominations';

    public function label(): string
    {
        return match($this) {
            self::Revenue => 'Global Box Office Revenue',
            self::OscarNominations => 'Oscar Nominations',
        };
    }

    public function guessLabel(): string
    {
        return match($this) {
            self::Revenue => '',
            self::OscarNominations => 'Nominations',
        };
    }

    public function isCurrency(): bool
    {
        return match($this) {
            self::Revenue => true,
            self::OscarNominations => false,
        };
    }

    public function useTarget(): bool
    {
        return match($this) {
            self::Revenue => true,
            self::OscarNominations => false,
        };
    }
}

