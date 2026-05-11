import {movieCredits, movieDetails} from "@/Helpers/tmdb_api.js";
import {router} from "@inertiajs/react";
import {movieAwards} from "@/Helpers/omdb_api.js";

export async function evaluateGuess(movie, category, game) {
    const genreMap = {
        "28": "Action",
        "12": "Adventure",
        "16": "Animation",
        "35": "Comedy",
        "80": "Crime",
        "99": "Documentary",
        "18": "Drama",
        "10751": "Family",
        "14": "Fantasy",
        "36": "History",
        "27": "Horror",
        "10402": "Music",
        "9648": "Mystery",
        "10749": "Romance",
        "878": "Science Fiction",
        "10770": "TV Movie",
        "53": "Thriller",
        "10752": "War",
        "37": "Western",
    }
    const detailedMovie = await movieDetails(movie.id);
    // console.log(detailedMovie);
    let wrongString = null;
    async function checkCastCrewGuess(value, disqualifier) {
        try {
            const credits = await movieCredits(movie.id)
            const right = credits.cast.some(m => m.id == value) || credits.crew.some(m => m.id == value)
            if(!right && !disqualifier) {
                wrongString = 'Person did not appear in the movie, try again!';
            } else if (right && disqualifier) {
                wrongString = 'Person appeared in the movie, try again!';
            }
            return right !== disqualifier;

        } catch (error) {
            console.error(error)
        }
    }

    async function checkYearGuess(value, disqualifier) {
        const releaseYear = movie.release_date.split("-").shift();
        const right = releaseYear == value;
        if((!right && !disqualifier) || (right && disqualifier)) {
            wrongString = movie.title + ' was released in ' + releaseYear +', try again!';
        }
        return right !== disqualifier;
    }

    async function checkYearRangeGuess(value, disqualifier) {
        const releaseYear = Number(movie.release_date.split("-").shift());
        let values = value.split("-");
        const lowerRange = Number(values.shift());
        const upperRange = Number(values.pop());
        const right = lowerRange <= releaseYear && releaseYear <= upperRange;
        if((!right && !disqualifier) || (right && disqualifier)) {
            wrongString = movie.title + ' was released in ' + releaseYear +', try again!';
        }
        return right !== disqualifier;
    }

    async function checkGenreGuess(value, disqualifier) {
        let right = movie.genre_ids?.includes(Number(value), false);
        if(!right && !disqualifier) {
            wrongString = movie.title + ' is Not a ' + genreMap[value] +' Movie, Try Again!';
        } else if (right && disqualifier) {
            wrongString = movie.title + ' is a ' + genreMap[value] +' Movie, Try Again!';
        }
        return right !== disqualifier;
    }

    let correct = false;

    async function checkItem(type, value = category.value, disqualifier = false) {
        switch(type) {
            case 'cast_or_crew': {
                //TODO:: break this up for cast + type / crew / cast and crew
                return await checkCastCrewGuess(value, disqualifier);
            }
            case 'year': {
                return await checkYearGuess(value, disqualifier);
            }
            case 'year_range': {
                return await checkYearRangeGuess(value, disqualifier);
            }
            case 'genre': {
                return await checkGenreGuess(value, disqualifier);
            }
        }
    }

    correct = await checkItem(category.type);

    if (correct) {
        for (const qualifier of category.qualifiers) {
            if(correct) {
                correct = await checkItem(qualifier.type, qualifier.value, qualifier.is_disqualifier);
            }
        }
    }

    const omdbList = [
        'oscar_nominations'
    ];

    let score = 0;

    if(correct && omdbList.includes(game.scoring_type)) {
        switch(game.scoring_type) {
            case 'oscar_nominations': {
                score = await movieAwards(detailedMovie.imdb_id);
                break;
            }
        }
    } else if (correct) {
        score = detailedMovie[game.scoring_type];
    }

    // https://image.tmdb.org/t/p/w92/
    // console.log(movie);
    if(score === 0) {
        if(correct) {
            wrongString = "Selected movie has a score of 0, try again!";
        }
        correct = false;
    }

    router.post('/guesses', {
        game_id: game.id,
        category_id: category.id,
        tmdb_movie_id: movie.id,
        movie_title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        points: score,
        correct,
    });

    return wrongString;
}

