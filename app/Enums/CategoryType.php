<?php

namespace App\Enums;

enum CategoryType: string
{
    case CastOrCrew = 'cast_or_crew';
    case Year = 'year';
    case YearRange = 'year_range';
}