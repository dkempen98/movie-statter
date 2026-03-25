import {movieCredits, movieDetails} from "@/Helpers/tmdb_api.js";
import {router} from "@inertiajs/react";

export async function evaluateGuess(movie, category, game) {
    const detailedMovie = await movieDetails(movie.id);
    let wrongString = null;
    async function checkCastCrewGuess() {
        try {
            const credits = await movieCredits(movie.id)
            const right = credits.cast.some(m => m.id == category.value) || credits.crew.some(m => m.id == category.value)
            if(!right) {
                wrongString = 'Person did not appear in the movie, try again!';
            }
            return right;

        } catch (error) {
            console.error(error)
        }
    }

    async function checkYearGuess() {
        console.log(movie);
        const releaseYear = movie.release_date.split("-").shift();
        const right = releaseYear == category.value;
        if(!right) {
            wrongString = movie.title + 'was released in ' + releaseYear +', try again!';
        }
        return right;
    }

    async function checkYearRangeGuess() {
        const releaseYear = Number(movie.release_date.split("-").shift());
        let values = category.value.split("-");
        const lowerRange = values.shift();
        const upperRange = values.pop();
        const right = lowerRange < releaseYear < upperRange;
        if(!right) {
            wrongString = movie.title + 'was released in ' + releaseYear +', try again!';
        }
        return right;
    }

    let correct = false;

    switch(category.type) {
        case 'cast_or_crew': {
            correct = await checkCastCrewGuess();
            break;
        }
        case 'year': {
            correct = await checkYearGuess()
            break;
        }
        case 'year_range': {
            correct = await checkYearRangeGuess()
            break;
        }
    }

    router.post('/guesses', {
        game_id: game.id,
        category_id: category.id,
        tmdb_movie_id: movie.id,
        movie_title: movie.title,
        points: correct ? detailedMovie[game.scoring_type] : 0,
        correct,
    });

    return wrongString;
}

