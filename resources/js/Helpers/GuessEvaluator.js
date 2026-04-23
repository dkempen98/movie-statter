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
    async function checkCastCrewGuess(value) {
        try {
            const credits = await movieCredits(movie.id)
            console.log(value);
            console.log(credits.cast);
            const right = credits.cast.some(m => m.id == value) || credits.crew.some(m => m.id == value)
            if(!right) {
                wrongString = 'Person did not appear in the movie, try again!';
            }
            return right;

        } catch (error) {
            console.error(error)
        }
    }

    async function checkYearGuess(value) {
        const releaseYear = movie.release_date.split("-").shift();
        const right = releaseYear == value;
        if(!right) {
            wrongString = movie.title + ' was released in ' + releaseYear +', try again!';
        }
        return right;
    }

    async function checkYearRangeGuess(value) {
        const releaseYear = Number(movie.release_date.split("-").shift());
        let values = value.split("-");
        const lowerRange = values.shift();
        const upperRange = values.pop();
        const right = lowerRange < releaseYear < upperRange;
        if(!right) {
            wrongString = movie.title + ' was released in ' + releaseYear +', try again!';
        }
        return right;
    }

    async function checkGenreGuess(value) {
        let right = movie.genre_ids?.includes(Number(value), false);
        if (!right) {
            wrongString = movie.title + ' is Not a ' + genreMap[value] +' Movie, Try Again!';
        }
        return right;
    }

    let correct = false;

    async function checkItem(type, value = category.value) {
        switch(type) {
            case 'cast_or_crew': {
                //TODO:: break this up for cast + type / crew / cast and crew
                return await checkCastCrewGuess(value);
            }
            case 'year': {
                return await checkYearGuess(value);
            }
            case 'year_range': {
                return await checkYearRangeGuess(value);
            }
            case 'genre': {
                return await checkGenreGuess(value);
            }
        }
    }

    correct = await checkItem(category.type);

    for (const qualifier of category.qualifiers) {
        if(correct) {
            correct = await checkItem(qualifier.type, qualifier.value, qualifier.display_name);
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

