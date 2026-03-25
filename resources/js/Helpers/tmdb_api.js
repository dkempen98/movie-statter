
const getOptions = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + import.meta.env.VITE_TMDB_API_KEY
    }
};

export async function movieSearch(searchString) {
    const encodedSearch = encodeURIComponent(searchString.trim());
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodedSearch}`;

    try {
        const response = await fetch(url, getOptions);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let data = await response.json();
        return data.results.filter(movie => movie.popularity > 1);
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}

export async function movieCredits(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits`;

    try {
        const response = await fetch(url, getOptions);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}

export async function movieDetails(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}`;

    try {
        const response = await fetch(url, getOptions);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}
